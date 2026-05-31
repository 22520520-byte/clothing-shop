<?php
// =========================================================
// File: api/vouchers/get-vouchers.php
// Mục đích: API lấy danh sách voucher đang hoạt động
// Method: GET
// =========================================================

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


// 3. Lấy tham số lọc từ URL
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 12;

$discountType = trim($_GET['discount_type'] ?? '');
$availableOnly = isset($_GET['available_only']) ? (int) $_GET['available_only'] : 1;

$sort = trim($_GET['sort'] ?? 'latest');


// 4. Chuẩn hóa phân trang
if ($page < 1) {
    $page = 1;
}

if ($limit < 1) {
    $limit = 12;
}

if ($limit > 50) {
    $limit = 50;
}

$offset = ($page - 1) * $limit;


// 5. Validate loại giảm giá nếu có
$allowedDiscountTypes = ['fixed', 'percent', 'freeship'];

if ($discountType !== '' && !in_array($discountType, $allowedDiscountTypes)) {
    sendError('Loai voucher khong hop le', 422);
}


// 6. Kết nối database
$conn = getDatabaseConnection();

try {
    // 7. Tạo điều kiện lọc
    $where = [];
    $params = [];

    $where[] = "status = 'active'";

    if ($discountType !== '') {
        $where[] = "discount_type = :discount_type";
        $params[':discount_type'] = $discountType;
    }

    if ($availableOnly === 1) {
        $where[] = "start_date <= NOW()";
        $where[] = "end_date >= NOW()";
        $where[] = "used_quantity < quantity";
    }

    $whereSql = implode(' AND ', $where);


    // 8. Sắp xếp voucher
    $orderBy = "created_at DESC";

    if ($sort === 'end_soon') {
        $orderBy = "end_date ASC";
    } elseif ($sort === 'discount_desc') {
        $orderBy = "discount_value DESC";
    } elseif ($sort === 'min_order_asc') {
        $orderBy = "min_order_value ASC";
    }


    // 9. Đếm tổng số voucher
    $countSql = "
        SELECT COUNT(*) AS total
        FROM vouchers
        WHERE $whereSql
    ";

    $countStmt = $conn->prepare($countSql);
    $countStmt->execute($params);

    $totalVouchers = (int) $countStmt->fetch()['total'];
    $totalPages = (int) ceil($totalVouchers / $limit);


    // 10. Lấy danh sách voucher
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
        ORDER BY $orderBy
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $vouchers = $stmt->fetchAll();


    // 11. Format dữ liệu trả về
    $formattedVouchers = array_map(function ($voucher) {
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

        $discountLabel = '';

        if ($voucher['discount_type'] === 'fixed') {
            $discountLabel = 'Giam ' . number_format((float) $voucher['discount_value'], 0, ',', '.') . 'd';
        } elseif ($voucher['discount_type'] === 'percent') {
            $discountLabel = 'Giam ' . (float) $voucher['discount_value'] . '%';
        } elseif ($voucher['discount_type'] === 'freeship') {
            $discountLabel = 'Mien phi van chuyen';
        }

        return [
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
            'is_started' => $isStarted,
            'is_expired' => $isExpired,
            'is_out_of_quantity' => $isOutOfQuantity,
            'is_available' => $isAvailable,

            'created_at' => $voucher['created_at'],
            'updated_at' => $voucher['updated_at']
        ];
    }, $vouchers);


    // 12. Trả kết quả
    sendSuccess('Lay danh sach voucher thanh cong', [
        'vouchers' => $formattedVouchers,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_vouchers' => $totalVouchers,
            'total_pages' => $totalPages
        ],
        'filters' => [
            'discount_type' => $discountType,
            'available_only' => $availableOnly,
            'sort' => $sort
        ]
    ]);

} catch (PDOException $e) {
    sendError('Lay danh sach voucher that bai', 500, [
        'database' => $e->getMessage()
    ]);
}