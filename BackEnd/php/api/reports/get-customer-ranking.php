<?php
// =========================================================
// File: api/reports/get-customer-ranking.php
// Mục đích: API lấy bảng xếp hạng khách hàng
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


// 3. Kiểm tra đăng nhập
if (empty($_SESSION['user_id'])) {
    sendError('Vui long dang nhap de xem bao cao khach hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số từ URL
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;
$sort = trim($_GET['sort'] ?? 'spent_desc');

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


// 5. Validate sort
$allowedSorts = [
    'spent_desc',
    'orders_desc',
    'name_asc'
];

if (!in_array($sort, $allowedSorts)) {
    sendError('Kieu sap xep khong hop le', 422);
}


// 6. Kết nối database
$conn = getDatabaseConnection();

try {
    // 7. Kiểm tra quyền user hiện tại
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
        sendError('Ban khong co quyen xem bao cao khach hang', 403);
    }


    // 8. Sắp xếp
    $orderBy = "total_spent DESC, total_orders DESC";

    if ($sort === 'orders_desc') {
        $orderBy = "total_orders DESC, total_spent DESC";
    } elseif ($sort === 'name_asc') {
        $orderBy = "full_name ASC, email ASC";
    }


    // 9. Đếm tổng khách hàng
    $sql = "
        SELECT COUNT(*) AS total
        FROM vw_customer_ranking
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $totalCustomers = (int) $stmt->fetch()['total'];
    $totalPages = (int) ceil($totalCustomers / $limit);


    // 10. Lấy danh sách xếp hạng khách hàng
    $sql = "
        SELECT
            user_id,
            full_name,
            email,
            total_orders,
            total_spent
        FROM vw_customer_ranking
        ORDER BY $orderBy
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $customers = $stmt->fetchAll();


    // 11. Lấy thống kê tổng quan
    $sql = "
        SELECT
            COUNT(*) AS total_customers,
            COALESCE(SUM(total_orders), 0) AS all_total_orders,
            COALESCE(SUM(total_spent), 0) AS all_total_spent,
            COALESCE(AVG(total_spent), 0) AS average_spent_per_customer
        FROM vw_customer_ranking
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $summary = $stmt->fetch();


    // 12. Format danh sách khách hàng
    $formattedCustomers = array_map(function ($item, $index) use ($offset) {
        $totalOrders = (int) $item['total_orders'];
        $totalSpent = (float) $item['total_spent'];

        $customerLevel = 'normal';

        if ($totalSpent >= 5000000) {
            $customerLevel = 'diamond';
        } elseif ($totalSpent >= 3000000) {
            $customerLevel = 'gold';
        } elseif ($totalSpent >= 1000000) {
            $customerLevel = 'silver';
        }

        $customerLevelLabels = [
            'normal' => 'Thường',
            'silver' => 'Bạc',
            'gold' => 'Vàng',
            'diamond' => 'Kim cương'
        ];

        return [
            'rank' => $offset + $index + 1,
            'user_id' => (int) $item['user_id'],
            'full_name' => $item['full_name'],
            'email' => $item['email'],
            'total_orders' => $totalOrders,
            'total_spent' => $totalSpent,
            'average_order_value' => $totalOrders > 0 ? $totalSpent / $totalOrders : 0,
            'customer_level' => $customerLevel,
            'customer_level_label' => $customerLevelLabels[$customerLevel]
        ];
    }, $customers, array_keys($customers));


    // 13. Lấy khách hàng top 1
    $topCustomer = null;

    if (count($formattedCustomers) > 0 && $page === 1) {
        $topCustomer = $formattedCustomers[0];
    } else {
        $sql = "
            SELECT
                user_id,
                full_name,
                email,
                total_orders,
                total_spent
            FROM vw_customer_ranking
            ORDER BY total_spent DESC, total_orders DESC
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute();

        $top = $stmt->fetch();

        if ($top) {
            $totalOrders = (int) $top['total_orders'];
            $totalSpent = (float) $top['total_spent'];

            $topCustomer = [
                'rank' => 1,
                'user_id' => (int) $top['user_id'],
                'full_name' => $top['full_name'],
                'email' => $top['email'],
                'total_orders' => $totalOrders,
                'total_spent' => $totalSpent,
                'average_order_value' => $totalOrders > 0 ? $totalSpent / $totalOrders : 0
            ];
        }
    }


    // 14. Trả kết quả
    sendSuccess('Lay bao cao xep hang khach hang thanh cong', [
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
            'total_customers' => (int) $summary['total_customers'],
            'all_total_orders' => (int) $summary['all_total_orders'],
            'all_total_spent' => (float) $summary['all_total_spent'],
            'average_spent_per_customer' => (float) $summary['average_spent_per_customer'],
            'top_customer' => $topCustomer
        ],

        'customers' => $formattedCustomers,

        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_customers' => $totalCustomers,
            'total_pages' => $totalPages
        ],

        'filters' => [
            'sort' => $sort
        ]
    ]);

} catch (PDOException $e) {
    sendError('Lay bao cao xep hang khach hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}