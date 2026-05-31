<?php
// =========================================================
// File: api/admin/customers/get-customer-detail.php
// Mục đích: API admin lấy chi tiết khách hàng
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
    sendError('Vui long dang nhap de xem chi tiet khach hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy customer id
$customerId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($customerId <= 0) {
    sendError('Vui long truyen ma khach hang', 422);
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
        sendError('Ban khong co quyen xem chi tiet khach hang', 403);
    }


    // 7. Lấy thông tin khách hàng
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
            COALESCE(cp.points_balance, 0) AS points_balance

        FROM users u

        JOIN roles r
            ON u.role_id = r.id

        LEFT JOIN customer_profiles cp
            ON u.id = cp.user_id

        WHERE u.id = :customer_id
        AND r.code = 'customer'
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':customer_id' => $customerId
    ]);

    $customer = $stmt->fetch();

    if (!$customer) {
        sendError('Khong tim thay khach hang', 404);
    }


    // 8. Lấy thống kê đơn hàng của khách
    $sql = "
        SELECT
            COUNT(id) AS total_orders,
            SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
            SUM(CASE WHEN order_status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_orders,
            SUM(CASE WHEN order_status = 'shipping' THEN 1 ELSE 0 END) AS shipping_orders,
            SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
            SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,

            COALESCE(SUM(CASE WHEN order_status = 'completed' THEN final_total ELSE 0 END), 0) AS total_spent,
            COALESCE(AVG(CASE WHEN order_status = 'completed' THEN final_total ELSE NULL END), 0) AS average_order_value,

            MIN(created_at) AS first_order_at,
            MAX(created_at) AS last_order_at
        FROM orders
        WHERE user_id = :customer_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':customer_id' => $customerId
    ]);

    $orderSummary = $stmt->fetch();


    // 9. Lấy danh sách đơn hàng gần đây
    $sql = "
        SELECT
            o.id,
            o.order_code,
            o.receiver_name,
            o.receiver_phone,
            o.shipping_address,
            o.final_total,
            o.payment_method,
            o.order_status,
            o.created_at,
            o.updated_at,

            pa.payment_status,
            pa.amount AS payment_amount,

            COALESCE(item_summary.total_items, 0) AS total_items,
            COALESCE(item_summary.total_quantity, 0) AS total_quantity

        FROM orders o

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

        WHERE o.user_id = :customer_id
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT 10
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':customer_id' => $customerId
    ]);

    $recentOrders = $stmt->fetchAll();


    // 10. Lấy địa chỉ của khách nếu bảng user_addresses tồn tại đúng cấu trúc
    $addresses = [];

    try {
        $sql = "
            SELECT
                id,
                user_id,
                receiver_name,
                receiver_phone,
                address_detail,
                ward,
                district,
                province,
                is_default,
                created_at,
                updated_at
            FROM user_addresses
            WHERE user_id = :customer_id
            ORDER BY is_default DESC, id DESC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':customer_id' => $customerId
        ]);

        $addresses = $stmt->fetchAll();
    } catch (PDOException $addressError) {
        $addresses = [];
    }


    // 11. Nhãn hiển thị
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


    // 12. Format đơn hàng gần đây
    $formattedRecentOrders = array_map(function ($order) use (
        $orderStatusLabels,
        $paymentMethodLabels,
        $paymentStatusLabels
    ) {
        $orderStatus = $order['order_status'];
        $paymentMethod = $order['payment_method'];
        $paymentStatus = $order['payment_status'] ?: 'unpaid';

        return [
            'id' => (int) $order['id'],
            'order_code' => $order['order_code'],

            'receiver' => [
                'name' => $order['receiver_name'],
                'phone' => $order['receiver_phone'],
                'shipping_address' => $order['shipping_address']
            ],

            'money' => [
                'final_total' => (float) $order['final_total']
            ],

            'payment' => [
                'method' => $paymentMethod,
                'method_label' => $paymentMethodLabels[$paymentMethod] ?? $paymentMethod,
                'status' => $paymentStatus,
                'status_label' => $paymentStatusLabels[$paymentStatus] ?? $paymentStatus,
                'amount' => $order['payment_amount'] !== null ? (float) $order['payment_amount'] : null
            ],

            'status' => [
                'code' => $orderStatus,
                'label' => $orderStatusLabels[$orderStatus] ?? $orderStatus
            ],

            'summary' => [
                'total_items' => (int) $order['total_items'],
                'total_quantity' => (int) $order['total_quantity']
            ],

            'created_at' => $order['created_at'],
            'updated_at' => $order['updated_at']
        ];
    }, $recentOrders);


    // 13. Format địa chỉ
    $formattedAddresses = array_map(function ($address) {
        return [
            'id' => (int) $address['id'],
            'user_id' => (int) $address['user_id'],
            'receiver_name' => $address['receiver_name'],
            'receiver_phone' => $address['receiver_phone'],
            'address_detail' => $address['address_detail'],
            'ward' => $address['ward'],
            'district' => $address['district'],
            'province' => $address['province'],
            'is_default' => (int) $address['is_default'],
            'created_at' => $address['created_at'],
            'updated_at' => $address['updated_at']
        ];
    }, $addresses);


    // 14. Format khách hàng
    $membership = $customer['membership_level'] ?: 'normal';
    $status = $customer['status'];
    $gender = $customer['gender'];

    $customerData = [
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
            'total_orders' => (int) ($orderSummary['total_orders'] ?? 0),
            'pending_orders' => (int) ($orderSummary['pending_orders'] ?? 0),
            'confirmed_orders' => (int) ($orderSummary['confirmed_orders'] ?? 0),
            'shipping_orders' => (int) ($orderSummary['shipping_orders'] ?? 0),
            'completed_orders' => (int) ($orderSummary['completed_orders'] ?? 0),
            'cancelled_orders' => (int) ($orderSummary['cancelled_orders'] ?? 0),
            'total_spent' => (float) ($orderSummary['total_spent'] ?? 0),
            'average_order_value' => (float) ($orderSummary['average_order_value'] ?? 0),
            'first_order_at' => $orderSummary['first_order_at'] ?? null,
            'last_order_at' => $orderSummary['last_order_at'] ?? null
        ],

        'addresses' => $formattedAddresses,
        'recent_orders' => $formattedRecentOrders,

        'created_at' => $customer['created_at'],
        'updated_at' => $customer['updated_at']
    ];


    // 15. Trả kết quả
    sendSuccess('Admin lay chi tiet khach hang thanh cong', [
        'current_user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => [
                'code' => $user['role_code'],
                'name' => $user['role_name']
            ]
        ],

        'customer' => $customerData
    ]);

} catch (PDOException $e) {
    sendError('Admin lay chi tiet khach hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}