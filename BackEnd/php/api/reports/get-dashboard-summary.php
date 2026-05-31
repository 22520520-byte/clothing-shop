<?php
// =========================================================
// File: api/reports/get-dashboard-summary.php
// Mục đích: API lấy dữ liệu tổng quan dashboard admin
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
    sendError('Vui long dang nhap de xem dashboard', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Kết nối database
$conn = getDatabaseConnection();

try {
    // 5. Kiểm tra quyền user hiện tại
    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.status,
            r.code AS role_code,
            r.name AS role_name,

            sp.staff_code,
            sp.position_name,
            sp.department,
            sp.work_status
        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        LEFT JOIN staff_profiles sp
            ON u.id = sp.user_id
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
        sendError('Ban khong co quyen xem dashboard admin', 403);
    }


    // 6. Lấy dữ liệu tổng quan từ view
    $sql = "
        SELECT
            total_orders,
            pending_orders,
            completed_orders,
            completed_revenue,
            active_products,
            total_customers,
            low_stock_variants
        FROM vw_dashboard_summary
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $summary = $stmt->fetch();

    if (!$summary) {
        $summary = [
            'total_orders' => 0,
            'pending_orders' => 0,
            'completed_orders' => 0,
            'completed_revenue' => 0,
            'active_products' => 0,
            'total_customers' => 0,
            'low_stock_variants' => 0
        ];
    }


    // 7. Lấy đơn hàng chờ xác nhận gần nhất
    $sql = "
        SELECT
            o.id,
            o.order_code,
            COALESCE(u.full_name, o.receiver_name) AS customer_name,
            o.receiver_phone,
            o.final_total,
            o.payment_method,
            o.order_status,
            o.created_at
        FROM orders o
        LEFT JOIN users u
            ON o.user_id = u.id
        WHERE o.order_status = 'pending'
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT 5
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $pendingOrders = $stmt->fetchAll();


    // 8. Lấy sản phẩm sắp hết hàng
    $sql = "
        SELECT
            variant_id,
            product_name,
            sku,
            color_name,
            size_name,
            stock_quantity,
            status
        FROM vw_low_stock_variants
        ORDER BY stock_quantity ASC, variant_id ASC
        LIMIT 5
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $lowStockVariants = $stmt->fetchAll();


    // 9. Lấy top sản phẩm bán chạy
    $sql = "
        SELECT
            product_name,
            sku,
            total_sold,
            total_revenue
        FROM vw_best_selling_products
        ORDER BY total_sold DESC, total_revenue DESC
        LIMIT 5
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $bestSellingProducts = $stmt->fetchAll();


    // 10. Lấy thống kê đơn hàng theo trạng thái
    $sql = "
        SELECT
            order_status,
            total_orders,
            total_amount
        FROM vw_orders_by_status
        ORDER BY total_orders DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $ordersByStatus = $stmt->fetchAll();


    // 11. Format đơn hàng chờ xác nhận
    $formattedPendingOrders = array_map(function ($order) {
        return [
            'id' => (int) $order['id'],
            'order_code' => $order['order_code'],
            'customer_name' => $order['customer_name'],
            'receiver_phone' => $order['receiver_phone'],
            'final_total' => (float) $order['final_total'],
            'payment_method' => $order['payment_method'],
            'order_status' => $order['order_status'],
            'created_at' => $order['created_at']
        ];
    }, $pendingOrders);


    // 12. Format sản phẩm sắp hết hàng
    $formattedLowStockVariants = array_map(function ($item) {
        return [
            'variant_id' => (int) $item['variant_id'],
            'product_name' => $item['product_name'],
            'sku' => $item['sku'],
            'color_name' => $item['color_name'],
            'size_name' => $item['size_name'],
            'stock_quantity' => (int) $item['stock_quantity'],
            'status' => $item['status']
        ];
    }, $lowStockVariants);


    // 13. Format sản phẩm bán chạy
    $formattedBestSellingProducts = array_map(function ($item) {
        return [
            'product_name' => $item['product_name'],
            'sku' => $item['sku'],
            'total_sold' => (int) $item['total_sold'],
            'total_revenue' => (float) $item['total_revenue']
        ];
    }, $bestSellingProducts);


    // 14. Format thống kê đơn theo trạng thái
    $orderStatusLabels = [
        'pending' => 'Chờ xác nhận',
        'confirmed' => 'Đã xác nhận',
        'shipping' => 'Đang giao hàng',
        'completed' => 'Hoàn thành',
        'cancelled' => 'Đã hủy'
    ];

    $formattedOrdersByStatus = array_map(function ($item) use ($orderStatusLabels) {
        return [
            'order_status' => $item['order_status'],
            'status_label' => $orderStatusLabels[$item['order_status']] ?? $item['order_status'],
            'total_orders' => (int) $item['total_orders'],
            'total_amount' => (float) $item['total_amount']
        ];
    }, $ordersByStatus);


    // 15. Trả kết quả
    sendSuccess('Lay du lieu dashboard thanh cong', [
        'current_user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => [
                'code' => $user['role_code'],
                'name' => $user['role_name']
            ],
            'staff_profile' => [
                'staff_code' => $user['staff_code'],
                'position_name' => $user['position_name'],
                'department' => $user['department'],
                'work_status' => $user['work_status']
            ]
        ],

        'summary' => [
            'total_orders' => (int) $summary['total_orders'],
            'pending_orders' => (int) $summary['pending_orders'],
            'completed_orders' => (int) $summary['completed_orders'],
            'completed_revenue' => (float) $summary['completed_revenue'],
            'active_products' => (int) $summary['active_products'],
            'total_customers' => (int) $summary['total_customers'],
            'low_stock_variants' => (int) $summary['low_stock_variants']
        ],

        'pending_orders' => $formattedPendingOrders,
        'low_stock_variants' => $formattedLowStockVariants,
        'best_selling_products' => $formattedBestSellingProducts,
        'orders_by_status' => $formattedOrdersByStatus
    ]);

} catch (PDOException $e) {
    sendError('Lay du lieu dashboard that bai', 500, [
        'database' => $e->getMessage()
    ]);
}