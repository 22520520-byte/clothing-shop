<?php
// =========================================================
// File: api/admin/vouchers/update-voucher-status.php
// Mục đích: API admin cập nhật trạng thái voucher
// Method: POST
// =========================================================

session_start();

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../helpers/response.php';


// 1. Cho phép gọi API từ frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}


// 2. Chỉ cho phép POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Phuong thuc khong hop le', 405);
}


// 3. Kiểm tra đăng nhập
if (empty($_SESSION['user_id'])) {
    sendError('Vui long dang nhap de cap nhat trang thai voucher', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy dữ liệu request
$voucherId = isset($input['voucher_id']) ? (int) $input['voucher_id'] : 0;
$status = trim($input['status'] ?? '');


// 6. Validate dữ liệu
$errors = [];

if ($voucherId <= 0) {
    $errors['voucher_id'] = 'Vui long truyen ma voucher';
}

$allowedStatuses = [
    'active',
    'inactive'
];

if (!in_array($status, $allowedStatuses)) {
    $errors['status'] = 'Trang thai voucher khong hop le';
}

if (!empty($errors)) {
    sendError('Du lieu khong hop le', 422, $errors);
}


// 7. Kết nối database
$conn = getDatabaseConnection();

try {
    // 8. Kiểm tra quyền admin/staff
    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.status,
            r.code AS role_code,
            r.name AS role_name
        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        WHERE u.id = :user_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId
    ]);

    $user = $stmt->fetch();

    if (!$user) {
        sendError('Khong tim thay nguoi dung', 404);
    }

    if ($user['status'] !== 'active') {
        sendError('Tai khoan dang bi khoa hoac khong hoat dong', 403);
    }

    $allowedRoles = ['owner', 'admin', 'staff'];

    if (!in_array($user['role_code'], $allowedRoles)) {
        sendError('Ban khong co quyen cap nhat trang thai voucher', 403);
    }


    // 9. Kiểm tra voucher tồn tại
    $sql = "
        SELECT
            id,
            code,
            name,
            discount_type,
            discount_value,
            quantity,
            used_quantity,
            start_date,
            end_date,
            status
        FROM vouchers
        WHERE id = :voucher_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':voucher_id' => $voucherId
    ]);

    $voucher = $stmt->fetch();

    if (!$voucher) {
        sendError('Khong tim thay voucher', 404);
    }

    $oldStatus = $voucher['status'];


    // 10. Nếu trạng thái không đổi
    if ($oldStatus === $status) {
        sendSuccess('Trang thai voucher khong thay doi', [
            'voucher' => [
                'id' => (int) $voucher['id'],
                'code' => $voucher['code'],
                'name' => $voucher['name'],
                'old_status' => $oldStatus,
                'new_status' => $status
            ]
        ]);
    }


    // 11. Bắt đầu transaction
    $conn->beginTransaction();


    // 12. Cập nhật trạng thái voucher
    $sql = "
        UPDATE vouchers
        SET
            status = :status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :voucher_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':status' => $status,
        ':voucher_id' => $voucherId
    ]);


    // 13. Ghi log hoạt động nhân viên nếu có bảng staff_activity_logs
    try {
        $description = 'Cap nhat trang thai voucher ' . $voucher['code'] . ' tu ' . $oldStatus . ' sang ' . $status;

        $sql = "
            INSERT INTO staff_activity_logs (
                user_id,
                action_type,
                target_type,
                target_id,
                description
            )
            VALUES (
                :user_id,
                'update_status',
                'voucher',
                :target_id,
                :description
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':target_id' => $voucherId,
            ':description' => $description
        ]);
    } catch (PDOException $logError) {
        // Bỏ qua nếu bảng log khác cấu trúc
    }


    // 14. Lấy lại voucher sau cập nhật
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
        WHERE id = :voucher_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':voucher_id' => $voucherId
    ]);

    $updatedVoucher = $stmt->fetch();


    // 15. Hoàn tất transaction
    $conn->commit();


    // 16. Nhãn hiển thị
    $statusLabels = [
        'active' => 'Đang hoạt động',
        'inactive' => 'Tạm ẩn'
    ];

    $discountTypeLabels = [
        'fixed' => 'Giảm tiền cố định',
        'percent' => 'Giảm theo phần trăm',
        'freeship' => 'Miễn phí vận chuyển'
    ];


    // 17. Tính tình trạng voucher
    $quantity = (int) $updatedVoucher['quantity'];
    $usedQuantity = (int) $updatedVoucher['used_quantity'];
    $remainingQuantity = max($quantity - $usedQuantity, 0);

    $now = time();
    $startTime = strtotime($updatedVoucher['start_date']);
    $endTime = strtotime($updatedVoucher['end_date']);

    $isStarted = $now >= $startTime;
    $isExpired = $now > $endTime;
    $isOutOfQuantity = $remainingQuantity <= 0;

    $isAvailable = (
        $updatedVoucher['status'] === 'active'
        && $isStarted
        && !$isExpired
        && !$isOutOfQuantity
    );

    $stateCode = 'available';
    $stateLabel = 'Có thể sử dụng';

    if ($updatedVoucher['status'] !== 'active') {
        $stateCode = 'inactive';
        $stateLabel = 'Tạm ẩn';
    } elseif (!$isStarted) {
        $stateCode = 'not_started';
        $stateLabel = 'Chưa bắt đầu';
    } elseif ($isExpired) {
        $stateCode = 'expired';
        $stateLabel = 'Đã hết hạn';
    } elseif ($isOutOfQuantity) {
        $stateCode = 'out_of_quantity';
        $stateLabel = 'Hết lượt sử dụng';
    }


    // 18. Trả kết quả
    sendSuccess('Admin cap nhat trang thai voucher thanh cong', [
        'current_user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => [
                'code' => $user['role_code'],
                'name' => $user['role_name']
            ]
        ],

        'voucher' => [
            'id' => (int) $updatedVoucher['id'],
            'code' => $updatedVoucher['code'],
            'name' => $updatedVoucher['name'],

            'discount_type' => $updatedVoucher['discount_type'],
            'discount_type_label' => $discountTypeLabels[$updatedVoucher['discount_type']] ?? $updatedVoucher['discount_type'],
            'discount_value' => (float) $updatedVoucher['discount_value'],

            'quantity' => $quantity,
            'used_quantity' => $usedQuantity,
            'remaining_quantity' => $remainingQuantity,

            'start_date' => $updatedVoucher['start_date'],
            'end_date' => $updatedVoucher['end_date'],

            'old_status' => $oldStatus,
            'old_status_label' => $statusLabels[$oldStatus] ?? $oldStatus,

            'new_status' => $updatedVoucher['status'],
            'new_status_label' => $statusLabels[$updatedVoucher['status']] ?? $updatedVoucher['status'],

            'state' => [
                'code' => $stateCode,
                'label' => $stateLabel,
                'is_started' => $isStarted,
                'is_expired' => $isExpired,
                'is_out_of_quantity' => $isOutOfQuantity,
                'is_available' => $isAvailable
            ],

            'updated_at' => $updatedVoucher['updated_at']
        ]
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Admin cap nhat trang thai voucher that bai', 500, [
        'error' => $e->getMessage()
    ]);
}