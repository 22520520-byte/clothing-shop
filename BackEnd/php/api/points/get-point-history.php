<?php
// =========================================================
// File: BackEnd/php/api/points/get-point-history.php
// Muc dich: Lay diem hien tai va lich su diem cua khach hang
// =========================================================

session_start();

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/response.php';

// 1. Chi cho phep GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Phuong thuc khong hop le', 405);
}

// 2. Lay query param
function getQueryValue($key, $default = '')
{
    return isset($_GET[$key]) ? trim((string) $_GET[$key]) : $default;
}

function getQueryInt($key, $default = 1)
{
    $value = isset($_GET[$key]) ? (int) $_GET[$key] : $default;

    if ($value < 1) {
        return $default;
    }

    return $value;
}

// 3. Kiem tra role khach hang
function isCustomerRole($roleCode)
{
    $roleCode = strtolower(trim((string) $roleCode));

    return in_array($roleCode, [
        'customer',
        'member',
        'khach_hang',
        'khachhang',
        'khach'
    ]);
}

// 4. Lay khach hang dang dang nhap neu co
function getCurrentCustomer($conn)
{
    $userId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;

    if ($userId <= 0) {
        return null;
    }

    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.phone,
            u.status,
            r.code AS role_code
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = :user_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId
    ]);

    $user = $stmt->fetch();

    if (!$user) {
        return null;
    }

    if ($user['status'] !== 'active') {
        return null;
    }

    if (!isCustomerRole($user['role_code'])) {
        return null;
    }

    return $user;
}

// 5. Tim khach hang bang email hoac so dien thoai neu session bi de
function findCustomerByContact($conn, $email, $phone)
{
    if ($email === '' && $phone === '') {
        return null;
    }

    $where = [];
    $params = [];

    if ($email !== '') {
        $where[] = 'u.email = :email';
        $params[':email'] = $email;
    }

    if ($phone !== '') {
        $where[] = 'u.phone = :phone';
        $params[':phone'] = $phone;
    }

    $whereSql = implode(' OR ', $where);

    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.phone,
            u.status,
            r.code AS role_code
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE ($whereSql)
          AND u.status = 'active'
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $user = $stmt->fetch();

    if (!$user) {
        return null;
    }

    if (!isCustomerRole($user['role_code'])) {
        return null;
    }

    return $user;
}

// 6. Lay diem hien tai
function getCustomerPointBalance($conn, $userId)
{
    $sql = "
        SELECT
            points_balance,
            membership_level,
            total_orders,
            total_spent
        FROM customer_profiles
        WHERE user_id = :user_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId
    ]);

    $profile = $stmt->fetch();

    if (!$profile) {
        return [
            'points_balance' => 0,
            'membership_level' => 'normal',
            'total_orders' => 0,
            'total_spent' => 0
        ];
    }

    return [
        'points_balance' => (int) $profile['points_balance'],
        'membership_level' => $profile['membership_level'] ?: 'normal',
        'total_orders' => (int) $profile['total_orders'],
        'total_spent' => (float) $profile['total_spent']
    ];
}

// 7. Doi loai giao dich diem sang nhan hien thi
function getPointTypeLabel($type)
{
    $labels = [
        'earn' => 'Cộng điểm',
        'redeem' => 'Trừ điểm',
        'use' => 'Trừ điểm',
        'refund' => 'Hoàn điểm',
        'adjust' => 'Điều chỉnh',
        'lucky' => 'Vòng xoay',
        'review' => 'Đánh giá'
    ];

    return $labels[$type] ?? 'Giao dịch điểm';
}

// 8. Lay class diem
function getPointDirection($points)
{
    $points = (int) $points;

    if ($points > 0) {
        return 'plus';
    }

    if ($points < 0) {
        return 'minus';
    }

    return 'neutral';
}

// 9. Lay lich su diem
function getPointHistory($conn, $userId, $page, $limit)
{
    $offset = ($page - 1) * $limit;

    $countSql = "
        SELECT COUNT(*) AS total
        FROM points_history
        WHERE user_id = :user_id
    ";

    $countStmt = $conn->prepare($countSql);
    $countStmt->execute([
        ':user_id' => $userId
    ]);

    $totalRows = (int) $countStmt->fetch()['total'];

    $sql = "
        SELECT
            ph.id,
            ph.user_id,
            ph.order_id,
            ph.type,
            ph.points,
            ph.description,
            ph.created_at,
            o.order_code
        FROM points_history ph
        LEFT JOIN orders o ON ph.order_id = o.id
        WHERE ph.user_id = :user_id
        ORDER BY ph.created_at DESC, ph.id DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $histories = [];

    foreach ($rows as $row) {
        $points = (int) $row['points'];

        $histories[] = [
            'id' => (int) $row['id'],
            'user_id' => (int) $row['user_id'],
            'order_id' => $row['order_id'] !== null ? (int) $row['order_id'] : null,
            'order_code' => $row['order_code'],
            'type' => $row['type'],
            'type_label' => getPointTypeLabel($row['type']),
            'points' => $points,
            'point' => $points,
            'direction' => getPointDirection($points),
            'description' => $row['description'],
            'content' => $row['description'],
            'status' => 'Thành công',
            'created_at' => $row['created_at'],
            'date' => $row['created_at']
        ];
    }

    return [
        'histories' => $histories,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_rows' => $totalRows,
            'total_pages' => $limit > 0 ? (int) ceil($totalRows / $limit) : 1
        ]
    ];
}

// 10. Xu ly chinh
$conn = getDatabaseConnection();

try {
    $page = getQueryInt('page', 1);
    $limit = getQueryInt('limit', 50);

    if ($limit > 100) {
        $limit = 100;
    }

    $email = getQueryValue('email', '');
    $phone = getQueryValue('phone', '');

    $customer = getCurrentCustomer($conn);

    if (!$customer) {
        $customer = findCustomerByContact($conn, $email, $phone);
    }

    if (!$customer) {
        sendError('Vui long dang nhap de xem lich su diem', 401);
    }

    $userId = (int) $customer['id'];
    $profile = getCustomerPointBalance($conn, $userId);
    $historyData = getPointHistory($conn, $userId, $page, $limit);

    sendSuccess('Lay lich su diem thanh cong', [
        'customer' => [
            'id' => $userId,
            'full_name' => $customer['full_name'],
            'email' => $customer['email'],
            'phone' => $customer['phone']
        ],
        'points' => [
            'balance' => $profile['points_balance'],
            'points_balance' => $profile['points_balance'],
            'membership_level' => $profile['membership_level'],
            'total_orders' => $profile['total_orders'],
            'total_spent' => $profile['total_spent']
        ],
        'histories' => $historyData['histories'],
        'history' => $historyData['histories'],
        'pagination' => $historyData['pagination']
    ]);
} catch (Exception $e) {
    sendError('Khong lay duoc lich su diem', 500, [
        'error' => $e->getMessage()
    ]);
}