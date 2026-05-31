<?php
// =========================================================
// File: api/admin/vouchers/get-vouchers.php
// Mục đích: API admin lấy danh sách voucher
// Method: GET
// =========================================================

session_start();

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../helpers/response.php';


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


// 3. Kiểm tra đăng nhập
if (empty($_SESSION['user_id'])) {
    sendError('Vui long dang nhap de quan ly voucher', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số lọc
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;

$keyword = trim($_GET['keyword'] ?? '');
$discountType = trim($_GET['discount_type'] ?? 'all');
$status = trim($_GET['status'] ?? 'all');
$state = trim($_GET['state'] ?? 'all');

$sort = trim($_GET['sort'] ?? 'latest');


// 5. Chuẩn hóa phân trang
if ($page < 1) {
    $page = 1;
}

if ($limit < 1) {
    $limit = 10;
}

if ($limit > 50) {
    $limit = 50;
}

$offset = ($page - 1) * $limit;


// 6. Validate filter
$allowedDiscountTypes = [
    'all',
    'fixed',
    'percent',
    'freeship'
];

if (!in_array($discountType, $allowedDiscountTypes)) {
    sendError('Loai giam gia khong hop le', 422);
}

$allowedStatuses = [
    'all',
    'active',
    'inactive'
];

if (!in_array($status, $allowedStatuses)) {
    sendError('Trang thai voucher khong hop le', 422);
}

$allowedStates = [
    'all',
    'available',
    'not_started',
    'expired',
    'out_of_quantity'
];

if (!in_array($state, $allowedStates)) {
    sendError('Tinh trang voucher khong hop le', 422);
}

$allowedSorts = [
    'latest',
    'oldest',
    'end_soon',
    'used_desc',
    'quantity_desc',
    'code_asc'
];

if (!in_array($sort, $allowedSorts)) {
    sendError('Kieu sap xep khong hop le', 422);
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
        sendError('Ban khong co quyen quan ly voucher', 403);
    }


    // 9. Tạo điều kiện lọc
    $where = [];
    $params = [];

    if ($keyword !== '') {
        $where[] = "(
            code LIKE :keyword_code
            OR name LIKE :keyword_name
            OR description LIKE :keyword_description
        )";

        $params[':keyword_code'] = '%' . $keyword . '%';
        $params[':keyword_name'] = '%' . $keyword . '%';
        $params[':keyword_description'] = '%' . $keyword . '%';
    }

    if ($discountType !== 'all') {
        $where[] = "discount_type = :discount_type";
        $params[':discount_type'] = $discountType;
    }

    if ($status !== 'all') {
        $where[] = "status = :status";
        $params[':status'] = $status;
    }

    if ($state === 'available') {
        $where[] = "status = 'active'";
        $where[] = "NOW() BETWEEN start_date AND end_date";
        $where[] = "used_quantity < quantity";
    } elseif ($state === 'not_started') {
        $where[] = "NOW() < start_date";
    } elseif ($state === 'expired') {
        $where[] = "NOW() > end_date";
    } elseif ($state === 'out_of_quantity') {
        $where[] = "used_quantity >= quantity";
    }

    if (empty($where)) {
        $where[] = "1 = 1";
    }

    $whereSql = implode(' AND ', $where);


    // 10. Sắp xếp
    $orderBy = "created_at DESC, id DESC";

    if ($sort === 'oldest') {
        $orderBy = "created_at ASC, id ASC";
    } elseif ($sort === 'end_soon') {
        $orderBy = "end_date ASC, id ASC";
    } elseif ($sort === 'used_desc') {
        $orderBy = "used_quantity DESC, id DESC";
    } elseif ($sort === 'quantity_desc') {
        $orderBy = "quantity DESC, id DESC";
    } elseif ($sort === 'code_asc') {
        $orderBy = "code ASC, id ASC";
    }


    // 11. Đếm tổng voucher sau lọc
    $countSql = "
        SELECT COUNT(*) AS total
        FROM vouchers
        WHERE $whereSql
    ";

    $countStmt = $conn->prepare($countSql);
    $countStmt->execute($params);

    $totalVouchers = (int) $countStmt->fetch()['total'];
    $totalPages = (int) ceil($totalVouchers / $limit);


    // 12. Lấy danh sách voucher
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


    // 13. Thống kê nhanh toàn bộ voucher
    $sql = "
        SELECT
            COUNT(*) AS total_vouchers,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_vouchers,
            SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive_vouchers,
            SUM(CASE WHEN status = 'active' AND NOW() BETWEEN start_date AND end_date AND used_quantity < quantity THEN 1 ELSE 0 END) AS available_vouchers,
            SUM(CASE WHEN NOW() < start_date THEN 1 ELSE 0 END) AS not_started_vouchers,
            SUM(CASE WHEN NOW() > end_date THEN 1 ELSE 0 END) AS expired_vouchers,
            SUM(CASE WHEN used_quantity >= quantity THEN 1 ELSE 0 END) AS out_of_quantity_vouchers,

            SUM(CASE WHEN discount_type = 'fixed' THEN 1 ELSE 0 END) AS fixed_vouchers,
            SUM(CASE WHEN discount_type = 'percent' THEN 1 ELSE 0 END) AS percent_vouchers,
            SUM(CASE WHEN discount_type = 'freeship' THEN 1 ELSE 0 END) AS freeship_vouchers
        FROM vouchers
    ";

    $summaryStmt = $conn->prepare($sql);
    $summaryStmt->execute();

    $summary = $summaryStmt->fetch();


    // 14. Nhãn hiển thị
    $discountTypeLabels = [
        'fixed' => 'Giảm tiền cố định',
        'percent' => 'Giảm theo phần trăm',
        'freeship' => 'Miễn phí vận chuyển'
    ];

    $statusLabels = [
        'active' => 'Đang hoạt động',
        'inactive' => 'Tạm ẩn'
    ];


    // 15. Format danh sách voucher
    $formattedVouchers = array_map(function ($voucher) use (
        $discountTypeLabels,
        $statusLabels
    ) {
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

        $stateCode = 'available';
        $stateLabel = 'Có thể sử dụng';

        if ($voucher['status'] !== 'active') {
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

        $discountLabel = '';

        if ($voucher['discount_type'] === 'fixed') {
            $discountLabel = 'Giảm ' . number_format((float) $voucher['discount_value'], 0, ',', '.') . 'đ';
        } elseif ($voucher['discount_type'] === 'percent') {
            $discountLabel = 'Giảm ' . (float) $voucher['discount_value'] . '%';
        } elseif ($voucher['discount_type'] === 'freeship') {
            $discountLabel = 'Miễn phí vận chuyển';
        }

        return [
            'id' => (int) $voucher['id'],
            'code' => $voucher['code'],
            'name' => $voucher['name'],
            'description' => $voucher['description'],

            'discount_type' => $voucher['discount_type'],
            'discount_type_label' => $discountTypeLabels[$voucher['discount_type']] ?? $voucher['discount_type'],
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
            'status_label' => $statusLabels[$voucher['status']] ?? $voucher['status'],

            'state' => [
                'code' => $stateCode,
                'label' => $stateLabel,
                'is_started' => $isStarted,
                'is_expired' => $isExpired,
                'is_out_of_quantity' => $isOutOfQuantity,
                'is_available' => $isAvailable
            ],

            'created_at' => $voucher['created_at'],
            'updated_at' => $voucher['updated_at']
        ];
    }, $vouchers);


    // 16. Trả kết quả
    sendSuccess('Admin lay danh sach voucher thanh cong', [
        'current_user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => [
                'code' => $user['role_code'],
                'name' => $user['role_name']
            ]
        ],

        'summary' => [
            'total_vouchers' => (int) ($summary['total_vouchers'] ?? 0),
            'active_vouchers' => (int) ($summary['active_vouchers'] ?? 0),
            'inactive_vouchers' => (int) ($summary['inactive_vouchers'] ?? 0),
            'available_vouchers' => (int) ($summary['available_vouchers'] ?? 0),
            'not_started_vouchers' => (int) ($summary['not_started_vouchers'] ?? 0),
            'expired_vouchers' => (int) ($summary['expired_vouchers'] ?? 0),
            'out_of_quantity_vouchers' => (int) ($summary['out_of_quantity_vouchers'] ?? 0),
            'fixed_vouchers' => (int) ($summary['fixed_vouchers'] ?? 0),
            'percent_vouchers' => (int) ($summary['percent_vouchers'] ?? 0),
            'freeship_vouchers' => (int) ($summary['freeship_vouchers'] ?? 0)
        ],

        'vouchers' => $formattedVouchers,

        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_vouchers' => $totalVouchers,
            'total_pages' => $totalPages
        ],

        'filters' => [
            'keyword' => $keyword,
            'discount_type' => $discountType,
            'status' => $status,
            'state' => $state,
            'sort' => $sort
        ]
    ]);

} catch (PDOException $e) {
    sendError('Admin lay danh sach voucher that bai', 500, [
        'database' => $e->getMessage()
    ]);
}