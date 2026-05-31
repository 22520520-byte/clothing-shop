<?php
// =========================================================
// File: api/orders/get-my-orders.php
// Mục đích: API lấy danh sách đơn hàng của người dùng đang đăng nhập
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
    sendError('Vui long dang nhap de xem don hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số lọc từ URL
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;

$status = trim($_GET['status'] ?? '');
$type = trim($_GET['type'] ?? 'all');

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


// 5. Kết nối database
$conn = getDatabaseConnection();

try {
    // 6. Kiểm tra user
    $sql = "
        SELECT
            id,
            full_name,
            email,
            status
        FROM users
        WHERE id = :user_id
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


    // 7. Tạo điều kiện lọc
    $where = [];
    $params = [];

    $where[] = "o.user_id = :user_id";
    $params[':user_id'] = $userId;

    $allowedStatuses = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];

    if ($status !== '') {
        if (!in_array($status, $allowedStatuses)) {
            sendError('Trang thai don hang khong hop le', 422);
        }

        $where[] = "o.order_status = :order_status";
        $params[':order_status'] = $status;
    } else {
        if ($type === 'current') {
            $where[] = "o.order_status IN ('pending', 'confirmed', 'shipping')";
        } elseif ($type === 'history') {
            $where[] = "o.order_status IN ('completed', 'cancelled')";
        }
    }

    $whereSql = implode(' AND ', $where);


    // 8. Đếm tổng số đơn hàng
    $countSql = "
        SELECT COUNT(*) AS total
        FROM orders o
        WHERE $whereSql
    ";

    $countStmt = $conn->prepare($countSql);
    $countStmt->execute($params);

    $totalOrders = (int) $countStmt->fetch()['total'];
    $totalPages = (int) ceil($totalOrders / $limit);


    // 9. Lấy danh sách đơn hàng
    $sql = "
        SELECT
            o.id,
            o.order_code,
            o.receiver_name,
            o.receiver_phone,
            o.shipping_address,
            o.note,

            o.total_product_price,
            o.shipping_fee,
            o.discount_amount,
            o.points_discount,
            o.final_total,

            o.payment_method,
            o.order_status,

            pay.payment_status,
            pay.paid_at,

            COALESCE(item_summary.total_items, 0) AS total_items,
            COALESCE(item_summary.total_quantity, 0) AS total_quantity,
            item_summary.first_product_name,
            item_summary.first_product_image,

            o.created_at,
            o.updated_at
        FROM orders o

        LEFT JOIN payments pay
            ON o.id = pay.order_id

        LEFT JOIN (
            SELECT
                order_id,
                COUNT(id) AS total_items,
                SUM(quantity) AS total_quantity,
                MIN(product_name) AS first_product_name,
                MIN(product_image) AS first_product_image
            FROM order_items
            GROUP BY order_id
        ) item_summary
            ON o.id = item_summary.order_id

        WHERE $whereSql
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $orders = $stmt->fetchAll();


    // 10. Format dữ liệu trả về
    $formattedOrders = array_map(function ($order) {
        return [
            'id' => (int) $order['id'],
            'order_code' => $order['order_code'],

            'receiver_name' => $order['receiver_name'],
            'receiver_phone' => $order['receiver_phone'],
            'shipping_address' => $order['shipping_address'],
            'note' => $order['note'],

            'total_product_price' => (float) $order['total_product_price'],
            'shipping_fee' => (float) $order['shipping_fee'],
            'discount_amount' => (float) $order['discount_amount'],
            'points_discount' => (float) $order['points_discount'],
            'final_total' => (float) $order['final_total'],

            'payment_method' => $order['payment_method'],
            'payment_status' => $order['payment_status'],
            'paid_at' => $order['paid_at'],

            'order_status' => $order['order_status'],

            'total_items' => (int) $order['total_items'],
            'total_quantity' => (int) $order['total_quantity'],

            'first_product_name' => $order['first_product_name'],
            'first_product_image' => $order['first_product_image'],

            'created_at' => $order['created_at'],
            'updated_at' => $order['updated_at']
        ];
    }, $orders);


    // 11. Trả kết quả
    sendSuccess('Lay danh sach don hang thanh cong', [
        'user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email']
        ],
        'orders' => $formattedOrders,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_orders' => $totalOrders,
            'total_pages' => $totalPages
        ],
        'filters' => [
            'status' => $status,
            'type' => $type
        ]
    ]);

} catch (PDOException $e) {
    sendError('Lay danh sach don hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}