<?php
// =========================================================
// File: api/vouchers/get-voucher-detail.php
// Mục đích: API lấy chi tiết một voucher
// Method: GET
// =========================================================

session_start();

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/response.php';


// 1. Cho phép gọi API từ frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}


// 2. Chỉ cho phép GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Phuong thuc khong hop le', 405);
}


// 3. Lấy tham số từ URL
$voucherId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$voucherCode = strtoupper(trim($_GET['code'] ?? ''));

if ($voucherId <= 0 && $voucherCode === '') {
    sendError('Vui long truyen id hoac code voucher', 422);
}


// 4. Lấy user hiện tại nếu có đăng nhập
$userId = !empty($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;


// 5. Kết nối database
$conn = getDatabaseConnection();

try {
    // 6. Tạo điều kiện tìm voucher
    if ($voucherId > 0) {
        $whereSql = "id = :voucher_id";
        $params = [
            ':voucher_id' => $voucherId
        ];
    } else {
        $whereSql = "code = :voucher_code";
        $params = [
            ':voucher_code' => $voucherCode
        ];
    }


    // 7. Lấy thông tin voucher
    $sql = "
        SELECT
            id,
            code,
            name,
            description,
            discount_type,
            discount_value,
            min_order_value,
            max_discount_amount,
            quantity,
            used_quantity,
            usage_limit_per_user,
            start_date,
            end_date,
            status,
            created_at,
            updated_at
        FROM vouchers
        WHERE $whereSql
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $voucher = $stmt->fetch();

    if (!$voucher) {
        sendError('Khong tim thay voucher', 404);
    }


    // 8. Tính trạng thái voucher
    $quantity = (int) $voucher['quantity'];
    $usedQuantity = (int) $voucher['used_quantity'];
    $remainingQuantity = max($quantity - $usedQuantity, 0);

    $now = time();
    $startTime = strtotime($voucher['start_date']);
    $endTime = strtotime($voucher['end_date']);

    $isStarted = $now >= $startTime;
    $isExpired = $now > $endTime;
    $isOutOfQuantity = $remainingQuantity <= 0;

    $isAvailable = (
        $voucher['status'] === 'active'
        && $isStarted
        && !$isExpired
        && !$isOutOfQuantity
    );


    // 9. Tạo thông báo trạng thái
    $availabilityMessage = 'Voucher co the su dung';

    if ($voucher['status'] !== 'active') {
        $availabilityMessage = 'Voucher khong hoat dong';
    } elseif (!$isStarted) {
        $availabilityMessage = 'Voucher chua den thoi gian su dung';
    } elseif ($isExpired) {
        $availabilityMessage = 'Voucher da het han';
    } elseif ($isOutOfQuantity) {
        $availabilityMessage = 'Voucher da het luot su dung';
    }


    // 10. Tạo nhãn giảm giá
    $discountLabel = '';

    if ($voucher['discount_type'] === 'fixed') {
        $discountLabel = 'Giam ' . number_format((float) $voucher['discount_value'], 0, ',', '.') . 'd';
    } elseif ($voucher['discount_type'] === 'percent') {
        $discountLabel = 'Giam ' . (float) $voucher['discount_value'] . '%';
    } elseif ($voucher['discount_type'] === 'freeship') {
        $discountLabel = 'Mien phi van chuyen';
    }


    // 11. Đếm số lần user hiện tại đã dùng voucher nếu đã đăng nhập
    $userUsedCount = 0;
    $canUseByUser = true;

    if ($userId > 0) {
        $sql = "
            SELECT COUNT(*) AS used_count
            FROM voucher_usages
            WHERE voucher_id = :voucher_id
            AND user_id = :user_id
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':voucher_id' => (int) $voucher['id'],
            ':user_id' => $userId
        ]);

        $userUsedCount = (int) $stmt->fetch()['used_count'];

        if ($userUsedCount >= (int) $voucher['usage_limit_per_user']) {
            $canUseByUser = false;
        }
    }


    // 12. Format dữ liệu trả về
    $voucherData = [
        'id' => (int) $voucher['id'],
        'code' => $voucher['code'],
        'name' => $voucher['name'],
        'description' => $voucher['description'],

        'discount_type' => $voucher['discount_type'],
        'discount_value' => (float) $voucher['discount_value'],
        'discount_label' => $discountLabel,

        'min_order_value' => (float) $voucher['min_order_value'],
        'max_discount_amount' => $voucher['max_discount_amount'] !== null
            ? (float) $voucher['max_discount_amount']
            : null,

        'quantity' => $quantity,
        'used_quantity' => $usedQuantity,
        'remaining_quantity' => $remainingQuantity,
        'usage_limit_per_user' => (int) $voucher['usage_limit_per_user'],

        'start_date' => $voucher['start_date'],
        'end_date' => $voucher['end_date'],

        'status' => $voucher['status'],

        'state' => [
            'is_started' => $isStarted,
            'is_expired' => $isExpired,
            'is_out_of_quantity' => $isOutOfQuantity,
            'is_available' => $isAvailable,
            'availability_message' => $availabilityMessage
        ],

        'user_usage' => [
            'is_logged_in' => $userId > 0,
            'used_count' => $userUsedCount,
            'can_use_by_user' => $canUseByUser,
            'remaining_usage_for_user' => max((int) $voucher['usage_limit_per_user'] - $userUsedCount, 0)
        ],

        'created_at' => $voucher['created_at'],
        'updated_at' => $voucher['updated_at']
    ];


    // 13. Trả kết quả
    sendSuccess('Lay chi tiet voucher thanh cong', [
        'voucher' => $voucherData
    ]);

} catch (PDOException $e) {
    sendError('Lay chi tiet voucher that bai', 500, [
        'database' => $e->getMessage()
    ]);
}