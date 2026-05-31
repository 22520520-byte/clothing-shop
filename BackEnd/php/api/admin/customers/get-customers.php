<?php
// =========================================================
// File: api/admin/customers/get-customers.php
// Mục đích: API admin lấy danh sách khách hàng
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
    sendError('Vui long dang nhap de quan ly khach hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số lọc
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;

$keyword = trim($_GET['keyword'] ?? '');
$status = trim($_GET['status'] ?? 'all');
$membershipLevel = trim($_GET['membership_level'] ?? 'all');

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
$allowedStatuses = [
    'all',
    'active',
    'inactive',
    'blocked'
];

if (!in_array($status, $allowedStatuses)) {
    sendError('Trang thai tai khoan khong hop le', 422);
}

$allowedMembershipLevels = [
    'all',
    'normal',
    'silver',
    'gold',
    'diamond'
];

if (!in_array($membershipLevel, $allowedMembershipLevels)) {
    sendError('Hang thanh vien khong hop le', 422);
}

$allowedSorts = [
    'latest',
    'oldest',
    'name_asc',
    'spent_desc',
    'orders_desc',
    'points_desc'
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
        sendError('Ban khong co quyen quan ly khach hang', 403);
    }


    // 9. Tạo điều kiện lọc
    $where = [];
    $params = [];

    $where[] = "r.code = 'customer'";

    if ($keyword !== '') {
        $where[] = "(
            u.full_name LIKE :keyword_name
            OR u.email LIKE :keyword_email
            OR u.phone LIKE :keyword_phone
        )";

        $params[':keyword_name'] = '%' . $keyword . '%';
        $params[':keyword_email'] = '%' . $keyword . '%';
        $params[':keyword_phone'] = '%' . $keyword . '%';
    }

    if ($status !== 'all') {
        $where[] = "u.status = :status";
        $params[':status'] = $status;
    }

    if ($membershipLevel !== 'all') {
        $where[] = "COALESCE(cp.membership_level, 'normal') = :membership_level";
        $params[':membership_level'] = $membershipLevel;
    }

    $whereSql = implode(' AND ', $where);


    // 10. Sắp xếp
    $orderBy = "u.created_at DESC, u.id DESC";

    if ($sort === 'oldest') {
        $orderBy = "u.created_at ASC, u.id ASC";
    } elseif ($sort === 'name_asc') {
        $orderBy = "u.full_name ASC, u.id ASC";
    } elseif ($sort === 'spent_desc') {
        $orderBy = "total_spent DESC, total_orders DESC";
    } elseif ($sort === 'orders_desc') {
        $orderBy = "total_orders DESC, total_spent DESC";
    } elseif ($sort === 'points_desc') {
        $orderBy = "points_balance DESC, u.id DESC";
    }


    // 11. Đếm tổng khách hàng sau lọc
    $countSql = "
        SELECT COUNT(DISTINCT u.id) AS total
        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        LEFT JOIN customer_profiles cp
            ON u.id = cp.user_id
        WHERE $whereSql
    ";

    $countStmt = $conn->prepare($countSql);
    $countStmt->execute($params);

    $totalCustomers = (int) $countStmt->fetch()['total'];
    $totalPages = (int) ceil($totalCustomers / $limit);


    // 12. Lấy danh sách khách hàng
    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.phone,
            u.avatar,
            u.gender,
            u.date_of_birth,
            u.status,
            u.created_at,
            u.updated_at,

            r.code AS role_code,
            r.name AS role_name,

            COALESCE(cp.membership_level, 'normal') AS membership_level,
            COALESCE(cp.points_balance, 0) AS points_balance,

            COALESCE(order_summary.total_orders, 0) AS total_orders,
            COALESCE(order_summary.pending_orders, 0) AS pending_orders,
            COALESCE(order_summary.completed_orders, 0) AS completed_orders,
            COALESCE(order_summary.cancelled_orders, 0) AS cancelled_orders,
            COALESCE(order_summary.total_spent, 0) AS total_spent,
            order_summary.last_order_at

        FROM users u

        JOIN roles r
            ON u.role_id = r.id

        LEFT JOIN customer_profiles cp
            ON u.id = cp.user_id

        LEFT JOIN (
            SELECT
                user_id,
                COUNT(id) AS total_orders,
                SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
                SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
                SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
                COALESCE(SUM(CASE WHEN order_status = 'completed' THEN final_total ELSE 0 END), 0) AS total_spent,
                MAX(created_at) AS last_order_at
            FROM orders
            WHERE user_id IS NOT NULL
            GROUP BY user_id
        ) order_summary
            ON u.id = order_summary.user_id

        WHERE $whereSql
        ORDER BY $orderBy
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $customers = $stmt->fetchAll();


    // 13. Thống kê nhanh toàn bộ khách hàng
    $sql = "
        SELECT
            COUNT(u.id) AS total_customers,
            SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END) AS active_customers,
            SUM(CASE WHEN u.status != 'active' THEN 1 ELSE 0 END) AS inactive_customers,
            SUM(CASE WHEN COALESCE(cp.membership_level, 'normal') = 'normal' THEN 1 ELSE 0 END) AS normal_customers,
            SUM(CASE WHEN COALESCE(cp.membership_level, 'normal') = 'silver' THEN 1 ELSE 0 END) AS silver_customers,
            SUM(CASE WHEN COALESCE(cp.membership_level, 'normal') = 'gold' THEN 1 ELSE 0 END) AS gold_customers,
            SUM(CASE WHEN COALESCE(cp.membership_level, 'normal') = 'diamond' THEN 1 ELSE 0 END) AS diamond_customers
        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        LEFT JOIN customer_profiles cp
            ON u.id = cp.user_id
        WHERE r.code = 'customer'
    ";

    $summaryStmt = $conn->prepare($sql);
    $summaryStmt->execute();

    $summary = $summaryStmt->fetch();


    // 14. Nhãn hiển thị
    $statusLabels = [
        'active' => 'Đang hoạt động',
        'inactive' => 'Tạm khóa',
        'blocked' => 'Bị chặn'
    ];

    $membershipLabels = [
        'normal' => 'Thường',
        'silver' => 'Bạc',
        'gold' => 'Vàng',
        'diamond' => 'Kim cương'
    ];

    $genderLabels = [
        'male' => 'Nam',
        'female' => 'Nữ',
        'other' => 'Khác'
    ];


    // 15. Format danh sách khách hàng
    $formattedCustomers = array_map(function ($customer) use (
        $statusLabels,
        $membershipLabels,
        $genderLabels
    ) {
        $membership = $customer['membership_level'] ?: 'normal';
        $status = $customer['status'];
        $gender = $customer['gender'];

        return [
            'id' => (int) $customer['id'],
            'full_name' => $customer['full_name'],
            'email' => $customer['email'],
            'phone' => $customer['phone'],
            'avatar' => $customer['avatar'],

            'gender' => $gender,
            'gender_label' => $genderLabels[$gender] ?? $gender,

            'date_of_birth' => $customer['date_of_birth'],

            'status' => $status,
            'status_label' => $statusLabels[$status] ?? $status,

            'role' => [
                'code' => $customer['role_code'],
                'name' => $customer['role_name']
            ],

            'customer_profile' => [
                'membership_level' => $membership,
                'membership_label' => $membershipLabels[$membership] ?? $membership,
                'points_balance' => (int) $customer['points_balance']
            ],

            'order_summary' => [
                'total_orders' => (int) $customer['total_orders'],
                'pending_orders' => (int) $customer['pending_orders'],
                'completed_orders' => (int) $customer['completed_orders'],
                'cancelled_orders' => (int) $customer['cancelled_orders'],
                'total_spent' => (float) $customer['total_spent'],
                'last_order_at' => $customer['last_order_at']
            ],

            'created_at' => $customer['created_at'],
            'updated_at' => $customer['updated_at']
        ];
    }, $customers);


    // 16. Trả kết quả
    sendSuccess('Admin lay danh sach khach hang thanh cong', [
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
            'total_customers' => (int) ($summary['total_customers'] ?? 0),
            'active_customers' => (int) ($summary['active_customers'] ?? 0),
            'inactive_customers' => (int) ($summary['inactive_customers'] ?? 0),
            'normal_customers' => (int) ($summary['normal_customers'] ?? 0),
            'silver_customers' => (int) ($summary['silver_customers'] ?? 0),
            'gold_customers' => (int) ($summary['gold_customers'] ?? 0),
            'diamond_customers' => (int) ($summary['diamond_customers'] ?? 0)
        ],

        'customers' => $formattedCustomers,

        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_customers' => $totalCustomers,
            'total_pages' => $totalPages
        ],

        'filters' => [
            'keyword' => $keyword,
            'status' => $status,
            'membership_level' => $membershipLevel,
            'sort' => $sort
        ]
    ]);

} catch (PDOException $e) {
    sendError('Admin lay danh sach khach hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}