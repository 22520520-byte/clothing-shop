<?php
// =========================================================
// File: api/customer-features/get-points.php
// Mục đích: API lấy điểm tích lũy và lịch sử điểm của user
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
    sendError('Vui long dang nhap de xem diem tich luy', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số phân trang
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;
$type = trim($_GET['type'] ?? '');

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


// 5. Validate loại giao dịch điểm nếu có
$allowedTypes = ['earn', 'use', 'refund', 'bonus'];

if ($type !== '' && !in_array($type, $allowedTypes)) {
    sendError('Loai giao dich diem khong hop le', 422);
}


// 6. Kết nối database
$conn = getDatabaseConnection();

try {
    // 7. Kiểm tra user + customer profile
    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.status,

            cp.membership_level,
            cp.points_balance,
            cp.total_orders,
            cp.total_spent
        FROM users u
        LEFT JOIN customer_profiles cp
            ON u.id = cp.user_id
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


    // 8. Tạo điều kiện lọc lịch sử điểm
    $where = [];
    $params = [];

    $where[] = "ph.user_id = :user_id_history";
    $params[':user_id_history'] = $userId;

    if ($type !== '') {
        $where[] = "ph.type = :type";
        $params[':type'] = $type;
    }

    $whereSql = implode(' AND ', $where);


    // 9. Đếm tổng lịch sử điểm
    $sql = "
        SELECT COUNT(*) AS total
        FROM points_history ph
        WHERE $whereSql
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $totalHistories = (int) $stmt->fetch()['total'];
    $totalPages = (int) ceil($totalHistories / $limit);


    // 10. Lấy lịch sử điểm
    $sql = "
        SELECT
            ph.id,
            ph.user_id,
            ph.order_id,
            ph.type,
            ph.points,
            ph.description,
            ph.created_at,

            o.order_code,
            o.final_total,
            o.order_status
        FROM points_history ph
        LEFT JOIN orders o
            ON ph.order_id = o.id
        WHERE $whereSql
        ORDER BY ph.created_at DESC, ph.id DESC
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $histories = $stmt->fetchAll();


    // 11. Thống kê điểm theo loại
    $sql = "
        SELECT
            type,
            COUNT(*) AS total_transactions,
            COALESCE(SUM(points), 0) AS total_points
        FROM points_history
        WHERE user_id = :user_id_summary
        GROUP BY type
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_summary' => $userId
    ]);

    $typeSummaries = $stmt->fetchAll();

    $summaryByType = [
        'earn' => [
            'total_transactions' => 0,
            'total_points' => 0
        ],
        'use' => [
            'total_transactions' => 0,
            'total_points' => 0
        ],
        'refund' => [
            'total_transactions' => 0,
            'total_points' => 0
        ],
        'bonus' => [
            'total_transactions' => 0,
            'total_points' => 0
        ]
    ];

    foreach ($typeSummaries as $item) {
        $summaryByType[$item['type']] = [
            'total_transactions' => (int) $item['total_transactions'],
            'total_points' => (int) $item['total_points']
        ];
    }


    // 12. Format lịch sử điểm
    $typeLabels = [
        'earn' => 'Cộng điểm',
        'use' => 'Dùng điểm',
        'refund' => 'Hoàn điểm',
        'bonus' => 'Thưởng điểm'
    ];

    $formattedHistories = array_map(function ($history) use ($typeLabels) {
        return [
            'id' => (int) $history['id'],
            'type' => $history['type'],
            'type_label' => $typeLabels[$history['type']] ?? $history['type'],
            'points' => (int) $history['points'],
            'description' => $history['description'],

            'order' => [
                'id' => $history['order_id'] !== null ? (int) $history['order_id'] : null,
                'order_code' => $history['order_code'],
                'final_total' => $history['final_total'] !== null ? (float) $history['final_total'] : null,
                'order_status' => $history['order_status']
            ],

            'created_at' => $history['created_at']
        ];
    }, $histories);


    // 13. Tính điểm từ lịch sử để kiểm tra khớp với customer_profiles
    $sql = "
        SELECT COALESCE(SUM(points), 0) AS calculated_points
        FROM points_history
        WHERE user_id = :user_id_calculate
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_calculate' => $userId
    ]);

    $calculatedPoints = (int) $stmt->fetch()['calculated_points'];
    $profilePoints = (int) ($user['points_balance'] ?? 0);


    // 14. Trả kết quả
    sendSuccess('Lay diem tich luy thanh cong', [
        'user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email']
        ],

        'points' => [
            'membership_level' => $user['membership_level'],
            'points_balance' => $profilePoints,
            'calculated_points_from_history' => $calculatedPoints,
            'is_points_matched' => $profilePoints === $calculatedPoints,
            'total_orders' => (int) ($user['total_orders'] ?? 0),
            'total_spent' => (float) ($user['total_spent'] ?? 0)
        ],

        'summary_by_type' => $summaryByType,

        'histories' => $formattedHistories,

        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_histories' => $totalHistories,
            'total_pages' => $totalPages
        ],

        'filters' => [
            'type' => $type
        ]
    ]);

} catch (PDOException $e) {
    sendError('Lay diem tich luy that bai', 500, [
        'database' => $e->getMessage()
    ]);
}