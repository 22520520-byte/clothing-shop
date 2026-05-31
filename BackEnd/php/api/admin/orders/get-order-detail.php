<?php
// =========================================================
// File: api/admin/orders/get-order-detail.php
// Mục đích: API admin lấy chi tiết đơn hàng
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
    sendError('Vui long dang nhap de xem chi tiet don hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số đơn hàng
$orderId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$orderCode = trim($_GET['order_code'] ?? '');

if ($orderId <= 0 && $orderCode === '') {
    sendError('Vui long truyen id hoac ma don hang', 422);
}


// 5. Kết nối database
$conn = getDatabaseConnection();

try {
    // 6. Kiểm tra quyền admin/staff
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
        sendError('Ban khong co quyen xem chi tiet don hang', 403);
    }


    // 7. Tạo điều kiện tìm đơn hàng
    if ($orderId > 0) {
        $whereSql = "o.id = :order_id";
        $params = [
            ':order_id' => $orderId
        ];
    } else {
        $whereSql = "o.order_code = :order_code";
        $params = [
            ':order_code' => $orderCode
        ];
    }


    // 8. Lấy thông tin đơn hàng
    $sql = "
        SELECT
            o.id,
            o.user_id,
            o.order_code,

            u.full_name AS user_full_name,
            u.email AS user_email,
            u.phone AS user_phone,

            o.receiver_name,
            o.receiver_phone,
            o.shipping_address,

            o.total_product_price,
            o.shipping_fee,
            o.discount_amount,
            o.points_discount,
            o.final_total,

            o.payment_method,
            o.order_status,
            o.note,

            o.created_at,
            o.updated_at,

            pa.id AS payment_id,
            pa.payment_method AS payment_method_saved,
            pa.payment_status,
            pa.amount AS payment_amount,
            pa.transaction_code,
            pa.paid_at

        FROM orders o

        LEFT JOIN users u
            ON o.user_id = u.id

        LEFT JOIN payments pa
            ON o.id = pa.order_id

        WHERE $whereSql
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $order = $stmt->fetch();

    if (!$order) {
        sendError('Khong tim thay don hang', 404);
    }

    $currentOrderId = (int) $order['id'];


    // 9. Lấy danh sách sản phẩm trong đơn
    // Lưu ý: bảng order_items hiện tại không có cột price_at_time
    // nên tạm lấy p.base_price làm price_at_time để tránh lỗi database.
    $sql = "
        SELECT
            oi.id,
            oi.order_id,
            oi.variant_id,
            oi.quantity,

            p.base_price AS price_at_time,
            (oi.quantity * p.base_price) AS total_price,

            pv.sku,
            pv.stock_quantity,
            pv.status AS variant_status,

            p.id AS product_id,
            p.name AS product_name,
            p.slug AS product_slug,
            p.base_price,
            p.old_price,
            p.status AS product_status,

            c.name AS category_name,
            c.slug AS category_slug,

            co.name AS color_name,
            co.code AS color_code,
            co.hex_code AS color_hex_code,

            s.name AS size_name,
            s.code AS size_code,

            COALESCE(pi.image_url, '../img/products/default.jpg') AS product_image

        FROM order_items oi

        JOIN product_variants pv
            ON oi.variant_id = pv.id

        JOIN products p
            ON pv.product_id = p.id

        JOIN categories c
            ON p.category_id = c.id

        LEFT JOIN colors co
            ON pv.color_id = co.id

        LEFT JOIN sizes s
            ON pv.size_id = s.id

        LEFT JOIN (
            SELECT
                product_id,
                MIN(image_url) AS image_url
            FROM product_images
            WHERE is_main = 1
            GROUP BY product_id
        ) pi
            ON p.id = pi.product_id

        WHERE oi.order_id = :order_id_items
        ORDER BY oi.id ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':order_id_items' => $currentOrderId
    ]);

    $items = $stmt->fetchAll();


    // 10. Nhãn hiển thị
    $orderStatusLabels = [
        'pending' => 'Chờ xác nhận',
        'confirmed' => 'Đã xác nhận',
        'shipping' => 'Đang giao hàng',
        'completed' => 'Hoàn thành',
        'cancelled' => 'Đã hủy'
    ];

    $paymentMethodLabels = [
        'cod' => 'Thanh toán khi nhận hàng',
        'bank_transfer' => 'Chuyển khoản ngân hàng',
        'momo' => 'Ví MoMo',
        'vnpay' => 'VNPay'
    ];

    $paymentStatusLabels = [
        'unpaid' => 'Chưa thanh toán',
        'paid' => 'Đã thanh toán',
        'failed' => 'Thanh toán thất bại',
        'refunded' => 'Đã hoàn tiền'
    ];


    // 11. Format sản phẩm trong đơn
    $totalItems = 0;
    $totalQuantity = 0;

    $formattedItems = array_map(function ($item) use (&$totalItems, &$totalQuantity) {
        $quantity = (int) $item['quantity'];

        $totalItems++;
        $totalQuantity += $quantity;

        return [
            'id' => (int) $item['id'],
            'order_id' => (int) $item['order_id'],
            'variant_id' => (int) $item['variant_id'],

            'product' => [
                'id' => (int) $item['product_id'],
                'name' => $item['product_name'],
                'slug' => $item['product_slug'],
                'image_url' => $item['product_image'],
                'base_price' => (float) $item['base_price'],
                'old_price' => $item['old_price'] !== null ? (float) $item['old_price'] : null,
                'status' => $item['product_status']
            ],

            'category' => [
                'name' => $item['category_name'],
                'slug' => $item['category_slug']
            ],

            'variant' => [
                'sku' => $item['sku'],
                'stock_quantity' => (int) $item['stock_quantity'],
                'status' => $item['variant_status'],

                'color' => [
                    'name' => $item['color_name'],
                    'code' => $item['color_code'],
                    'hex_code' => $item['color_hex_code']
                ],

                'size' => [
                    'name' => $item['size_name'],
                    'code' => $item['size_code']
                ]
            ],

            'quantity' => $quantity,
            'price_at_time' => (float) $item['price_at_time'],
            'total_price' => (float) $item['total_price']
        ];
    }, $items);


    // 12. Xác định các trạng thái có thể chuyển tiếp
    $currentStatus = $order['order_status'];

    $nextStatuses = [];

    if ($currentStatus === 'pending') {
        $nextStatuses = ['confirmed', 'cancelled'];
    } elseif ($currentStatus === 'confirmed') {
        $nextStatuses = ['shipping', 'cancelled'];
    } elseif ($currentStatus === 'shipping') {
        $nextStatuses = ['completed'];
    }


    // 13. Format dữ liệu đơn hàng
    $paymentMethod = $order['payment_method_saved'] ?: $order['payment_method'];
    $paymentStatus = $order['payment_status'] ?: 'unpaid';

    $orderData = [
        'id' => (int) $order['id'],
        'user_id' => $order['user_id'] !== null ? (int) $order['user_id'] : null,
        'order_code' => $order['order_code'],

        'customer' => [
            'id' => $order['user_id'] !== null ? (int) $order['user_id'] : null,
            'full_name' => $order['user_full_name'] ?: $order['receiver_name'],
            'email' => $order['user_email'],
            'phone' => $order['user_phone']
        ],

        'receiver' => [
            'name' => $order['receiver_name'],
            'phone' => $order['receiver_phone'],
            'shipping_address' => $order['shipping_address']
        ],

        'money' => [
            'total_product_price' => (float) $order['total_product_price'],
            'shipping_fee' => (float) $order['shipping_fee'],
            'discount_amount' => (float) $order['discount_amount'],
            'points_discount' => (float) $order['points_discount'],
            'final_total' => (float) $order['final_total']
        ],

        'payment' => [
            'id' => $order['payment_id'] !== null ? (int) $order['payment_id'] : null,
            'method' => $paymentMethod,
            'method_label' => $paymentMethodLabels[$paymentMethod] ?? $paymentMethod,
            'status' => $paymentStatus,
            'status_label' => $paymentStatusLabels[$paymentStatus] ?? $paymentStatus,
            'amount' => $order['payment_amount'] !== null ? (float) $order['payment_amount'] : null,
            'transaction_code' => $order['transaction_code'],
            'paid_at' => $order['paid_at']
        ],

        'status' => [
            'code' => $currentStatus,
            'label' => $orderStatusLabels[$currentStatus] ?? $currentStatus,
            'next_statuses' => $nextStatuses
        ],

        'summary' => [
            'total_items' => $totalItems,
            'total_quantity' => $totalQuantity
        ],

        'items' => $formattedItems,

        'note' => $order['note'],

        'created_at' => $order['created_at'],
        'updated_at' => $order['updated_at']
    ];


    // 14. Trả kết quả
    sendSuccess('Admin lay chi tiet don hang thanh cong', [
        'current_user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => [
                'code' => $user['role_code'],
                'name' => $user['role_name']
            ]
        ],
        'order' => $orderData
    ]);

} catch (PDOException $e) {
    sendError('Admin lay chi tiet don hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}