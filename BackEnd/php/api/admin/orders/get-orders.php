<?php
// =========================================================
// File: api/admin/orders/get-orders.php
// Mục đích: API admin lấy danh sách đơn hàng
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
    sendError('Vui long dang nhap de quan ly don hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số lọc
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;

$keyword = trim($_GET['keyword'] ?? '');
$orderStatus = trim($_GET['order_status'] ?? 'all');
$paymentStatus = trim($_GET['payment_status'] ?? 'all');
$paymentMethod = trim($_GET['payment_method'] ?? 'all');

$fromDate = trim($_GET['from_date'] ?? '');
$toDate = trim($_GET['to_date'] ?? '');

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
$allowedOrderStatuses = [
    'all',
    'pending',
    'confirmed',
    'shipping',
    'completed',
    'cancelled'
];

if (!in_array($orderStatus, $allowedOrderStatuses)) {
    sendError('Trang thai don hang khong hop le', 422);
}

$allowedPaymentStatuses = [
    'all',
    'unpaid',
    'paid',
    'failed',
    'refunded'
];

if (!in_array($paymentStatus, $allowedPaymentStatuses)) {
    sendError('Trang thai thanh toan khong hop le', 422);
}

$allowedPaymentMethods = [
    'all',
    'cod',
    'bank_transfer',
    'momo',
    'vnpay'
];

if (!in_array($paymentMethod, $allowedPaymentMethods)) {
    sendError('Phuong thuc thanh toan khong hop le', 422);
}

$allowedSorts = [
    'latest',
    'oldest',
    'total_desc',
    'total_asc'
];

if (!in_array($sort, $allowedSorts)) {
    sendError('Kieu sap xep khong hop le', 422);
}


// 7. Validate ngày nếu có truyền
if ($fromDate !== '') {
    $fromDateObj = DateTime::createFromFormat('Y-m-d', $fromDate);

    if (!$fromDateObj || $fromDateObj->format('Y-m-d') !== $fromDate) {
        sendError('Tu ngay khong hop le', 422);
    }
}

if ($toDate !== '') {
    $toDateObj = DateTime::createFromFormat('Y-m-d', $toDate);

    if (!$toDateObj || $toDateObj->format('Y-m-d') !== $toDate) {
        sendError('Den ngay khong hop le', 422);
    }
}

if ($fromDate !== '' && $toDate !== '') {
    if ($fromDateObj > $toDateObj) {
        sendError('Tu ngay khong duoc lon hon den ngay', 422);
    }
}


// 8. Kết nối database
$conn = getDatabaseConnection();

try {
    // 9. Kiểm tra quyền admin/staff
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
        sendError('Ban khong co quyen quan ly don hang', 403);
    }


    // 10. Tạo điều kiện lọc
    $where = [];
    $params = [];

    if ($keyword !== '') {
        $where[] = "(
            o.order_code LIKE :keyword_order_code
            OR o.receiver_name LIKE :keyword_receiver_name
            OR o.receiver_phone LIKE :keyword_receiver_phone
            OR u.full_name LIKE :keyword_user_name
            OR u.email LIKE :keyword_email
        )";

        $params[':keyword_order_code'] = '%' . $keyword . '%';
        $params[':keyword_receiver_name'] = '%' . $keyword . '%';
        $params[':keyword_receiver_phone'] = '%' . $keyword . '%';
        $params[':keyword_user_name'] = '%' . $keyword . '%';
        $params[':keyword_email'] = '%' . $keyword . '%';
    }

    if ($orderStatus !== 'all') {
        $where[] = "o.order_status = :order_status";
        $params[':order_status'] = $orderStatus;
    }

    if ($paymentStatus !== 'all') {
        $where[] = "pa.payment_status = :payment_status";
        $params[':payment_status'] = $paymentStatus;
    }

    if ($paymentMethod !== 'all') {
        $where[] = "o.payment_method = :payment_method";
        $params[':payment_method'] = $paymentMethod;
    }

    if ($fromDate !== '') {
        $where[] = "DATE(o.created_at) >= :from_date";
        $params[':from_date'] = $fromDate;
    }

    if ($toDate !== '') {
        $where[] = "DATE(o.created_at) <= :to_date";
        $params[':to_date'] = $toDate;
    }

    if (empty($where)) {
        $where[] = "1 = 1";
    }

    $whereSql = implode(' AND ', $where);


    // 11. Sắp xếp
    $orderBy = "o.created_at DESC, o.id DESC";

    if ($sort === 'oldest') {
        $orderBy = "o.created_at ASC, o.id ASC";
    } elseif ($sort === 'total_desc') {
        $orderBy = "o.final_total DESC, o.id DESC";
    } elseif ($sort === 'total_asc') {
        $orderBy = "o.final_total ASC, o.id ASC";
    }


    // 12. Đếm tổng đơn hàng
    $countSql = "
        SELECT COUNT(DISTINCT o.id) AS total
        FROM orders o
        LEFT JOIN users u
            ON o.user_id = u.id
        LEFT JOIN payments pa
            ON o.id = pa.order_id
        WHERE $whereSql
    ";

    $countStmt = $conn->prepare($countSql);
    $countStmt->execute($params);

    $totalOrders = (int) $countStmt->fetch()['total'];
    $totalPages = (int) ceil($totalOrders / $limit);


    // 13. Lấy danh sách đơn hàng
    $sql = "
        SELECT
            o.id,
            o.user_id,
            o.order_code,

            COALESCE(u.full_name, o.receiver_name) AS customer_name,
            u.email AS customer_email,

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
            pa.payment_status,
            pa.amount AS payment_amount,
            pa.transaction_code,
            pa.paid_at,

            COALESCE(item_summary.total_items, 0) AS total_items,
            COALESCE(item_summary.total_quantity, 0) AS total_quantity

        FROM orders o

        LEFT JOIN users u
            ON o.user_id = u.id

        LEFT JOIN payments pa
            ON o.id = pa.order_id

        LEFT JOIN (
            SELECT
                order_id,
                COUNT(id) AS total_items,
                COALESCE(SUM(quantity), 0) AS total_quantity
            FROM order_items
            GROUP BY order_id
        ) item_summary
            ON o.id = item_summary.order_id

        WHERE $whereSql
        ORDER BY $orderBy
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $orders = $stmt->fetchAll();


    // 14. Thống kê nhanh toàn bộ đơn hàng
    $sql = "
        SELECT
            COUNT(*) AS total_orders,
            SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
            SUM(CASE WHEN order_status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_orders,
            SUM(CASE WHEN order_status = 'shipping' THEN 1 ELSE 0 END) AS shipping_orders,
            SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
            SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
            COALESCE(SUM(CASE WHEN order_status = 'completed' THEN final_total ELSE 0 END), 0) AS completed_revenue
        FROM orders
    ";

    $summaryStmt = $conn->prepare($sql);
    $summaryStmt->execute();

    $summary = $summaryStmt->fetch();


    // 15. Nhãn hiển thị
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


    // 16. Format danh sách đơn hàng
    $formattedOrders = array_map(function ($order) use (
        $orderStatusLabels,
        $paymentMethodLabels,
        $paymentStatusLabels
    ) {
        $currentOrderStatus = $order['order_status'];
        $currentPaymentMethod = $order['payment_method'];
        $currentPaymentStatus = $order['payment_status'] ?? 'unpaid';

        return [
            'id' => (int) $order['id'],
            'user_id' => $order['user_id'] !== null ? (int) $order['user_id'] : null,
            'order_code' => $order['order_code'],

            'customer' => [
                'name' => $order['customer_name'],
                'email' => $order['customer_email']
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
                'method' => $currentPaymentMethod,
                'method_label' => $paymentMethodLabels[$currentPaymentMethod] ?? $currentPaymentMethod,
                'status' => $currentPaymentStatus,
                'status_label' => $paymentStatusLabels[$currentPaymentStatus] ?? $currentPaymentStatus,
                'amount' => $order['payment_amount'] !== null ? (float) $order['payment_amount'] : null,
                'transaction_code' => $order['transaction_code'],
                'paid_at' => $order['paid_at']
            ],

            'status' => [
                'code' => $currentOrderStatus,
                'label' => $orderStatusLabels[$currentOrderStatus] ?? $currentOrderStatus
            ],

            'summary' => [
                'total_items' => (int) $order['total_items'],
                'total_quantity' => (int) $order['total_quantity']
            ],

            'note' => $order['note'],
            'cancel_reason' => null,

            'created_at' => $order['created_at'],
            'updated_at' => $order['updated_at']
        ];
    }, $orders);


    // 17. Trả kết quả
    sendSuccess('Admin lay danh sach don hang thanh cong', [
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
            'total_orders' => (int) ($summary['total_orders'] ?? 0),
            'pending_orders' => (int) ($summary['pending_orders'] ?? 0),
            'confirmed_orders' => (int) ($summary['confirmed_orders'] ?? 0),
            'shipping_orders' => (int) ($summary['shipping_orders'] ?? 0),
            'completed_orders' => (int) ($summary['completed_orders'] ?? 0),
            'cancelled_orders' => (int) ($summary['cancelled_orders'] ?? 0),
            'completed_revenue' => (float) ($summary['completed_revenue'] ?? 0)
        ],

        'orders' => $formattedOrders,

        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_orders' => $totalOrders,
            'total_pages' => $totalPages
        ],

        'filters' => [
            'keyword' => $keyword,
            'order_status' => $orderStatus,
            'payment_status' => $paymentStatus,
            'payment_method' => $paymentMethod,
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'sort' => $sort
        ]
    ]);

} catch (PDOException $e) {
    sendError('Admin lay danh sach don hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}