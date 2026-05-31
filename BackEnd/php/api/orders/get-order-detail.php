<?php
// =========================================================
// File: api/orders/get-order-detail.php
// Mục đích: API lấy chi tiết một đơn hàng của người dùng đang đăng nhập
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
    sendError('Vui long dang nhap de xem chi tiet don hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số từ URL
$orderId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$orderCode = trim($_GET['order_code'] ?? '');

if ($orderId <= 0 && $orderCode === '') {
    sendError('Vui long truyen id hoac ma don hang', 422);
}


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


    // 7. Tạo điều kiện lấy đơn hàng
    if ($orderId > 0) {
        $whereSql = "o.id = :order_id";
        $params = [
            ':order_id' => $orderId,
            ':user_id' => $userId
        ];
    } else {
        $whereSql = "o.order_code = :order_code";
        $params = [
            ':order_code' => $orderCode,
            ':user_id' => $userId
        ];
    }


    // 8. Lấy thông tin đơn hàng
    $sql = "
        SELECT
            o.id,
            o.user_id,
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

            o.created_at,
            o.updated_at,

            pay.id AS payment_id,
            pay.payment_method AS payment_method_detail,
            pay.amount AS payment_amount,
            pay.payment_status,
            pay.transaction_code,
            pay.paid_at

        FROM orders o
        LEFT JOIN payments pay
            ON o.id = pay.order_id
        WHERE $whereSql
        AND o.user_id = :user_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $order = $stmt->fetch();

    if (!$order) {
        sendError('Khong tim thay don hang', 404);
    }

    $currentOrderId = (int) $order['id'];


    // 9. Lấy danh sách sản phẩm trong đơn hàng
    $sql = "
        SELECT
            oi.id,
            oi.order_id,
            oi.variant_id,

            oi.product_name,
            oi.color_name,
            oi.size_name,
            oi.product_image,
            oi.sku,

            oi.price,
            oi.quantity,
            oi.total_price,

            pv.product_id,
            p.slug AS product_slug,
            p.status AS product_status

        FROM order_items oi
        LEFT JOIN product_variants pv
            ON oi.variant_id = pv.id
        LEFT JOIN products p
            ON pv.product_id = p.id
        WHERE oi.order_id = :order_id
        ORDER BY oi.id ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':order_id' => $currentOrderId
    ]);

    $orderItems = $stmt->fetchAll();


    // 10. Format sản phẩm trong đơn hàng
    $formattedItems = [];
    $totalItems = 0;
    $totalQuantity = 0;

    foreach ($orderItems as $item) {
        $totalItems++;
        $totalQuantity += (int) $item['quantity'];

        $formattedItems[] = [
            'id' => (int) $item['id'],
            'order_id' => (int) $item['order_id'],
            'variant_id' => $item['variant_id'] !== null ? (int) $item['variant_id'] : null,

            'product' => [
                'id' => $item['product_id'] !== null ? (int) $item['product_id'] : null,
                'name' => $item['product_name'],
                'slug' => $item['product_slug'],
                'image_url' => $item['product_image'],
                'status' => $item['product_status']
            ],

            'color_name' => $item['color_name'],
            'size_name' => $item['size_name'],
            'sku' => $item['sku'],

            'price' => (float) $item['price'],
            'quantity' => (int) $item['quantity'],
            'total_price' => (float) $item['total_price']
        ];
    }


    // 11. Tạo nhãn trạng thái đơn hàng
    $orderStatusLabels = [
        'pending' => 'Chờ xác nhận',
        'confirmed' => 'Đã xác nhận',
        'shipping' => 'Đang giao hàng',
        'completed' => 'Hoàn thành',
        'cancelled' => 'Đã hủy'
    ];

    $paymentStatusLabels = [
        'unpaid' => 'Chưa thanh toán',
        'paid' => 'Đã thanh toán',
        'failed' => 'Thanh toán thất bại',
        'refunded' => 'Đã hoàn tiền'
    ];

    $paymentMethodLabels = [
        'cod' => 'Thanh toán khi nhận hàng',
        'bank_transfer' => 'Chuyển khoản ngân hàng',
        'momo' => 'Ví MoMo',
        'vnpay' => 'VNPay'
    ];


    // 12. Kiểm tra đơn có thể hủy không
    $canCancel = in_array($order['order_status'], ['pending', 'confirmed']);

    if ($order['payment_status'] === 'paid' && $order['order_status'] === 'confirmed') {
        $canCancel = false;
    }


    // 13. Format dữ liệu đơn hàng
    $orderData = [
        'id' => (int) $order['id'],
        'order_code' => $order['order_code'],

        'receiver' => [
            'name' => $order['receiver_name'],
            'phone' => $order['receiver_phone'],
            'shipping_address' => $order['shipping_address']
        ],

        'note' => $order['note'],

        'money' => [
            'total_product_price' => (float) $order['total_product_price'],
            'shipping_fee' => (float) $order['shipping_fee'],
            'discount_amount' => (float) $order['discount_amount'],
            'points_discount' => (float) $order['points_discount'],
            'final_total' => (float) $order['final_total']
        ],

        'payment' => [
            'id' => $order['payment_id'] !== null ? (int) $order['payment_id'] : null,
            'method' => $order['payment_method'],
            'method_label' => $paymentMethodLabels[$order['payment_method']] ?? $order['payment_method'],
            'amount' => $order['payment_amount'] !== null ? (float) $order['payment_amount'] : 0,
            'status' => $order['payment_status'],
            'status_label' => $paymentStatusLabels[$order['payment_status']] ?? $order['payment_status'],
            'transaction_code' => $order['transaction_code'],
            'paid_at' => $order['paid_at']
        ],

        'status' => [
            'code' => $order['order_status'],
            'label' => $orderStatusLabels[$order['order_status']] ?? $order['order_status'],
            'can_cancel' => $canCancel
        ],

        'summary' => [
            'total_items' => $totalItems,
            'total_quantity' => $totalQuantity
        ],

        'items' => $formattedItems,

        'created_at' => $order['created_at'],
        'updated_at' => $order['updated_at']
    ];


    // 14. Trả kết quả
    sendSuccess('Lay chi tiet don hang thanh cong', [
        'user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email']
        ],
        'order' => $orderData
    ]);

} catch (PDOException $e) {
    sendError('Lay chi tiet don hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}