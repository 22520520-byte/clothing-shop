<?php
// =========================================================
// File: BackEnd/php/api/orders/get-my-orders.php
// Muc dich: Lay danh sach don hang cua khach hang
// Cap nhat: Ho tro user dang nhap va don khach vang lai
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

// 3. Chuan hoa so
function getQueryInt($key, $default = 1)
{
    $value = isset($_GET[$key]) ? (int) $_GET[$key] : $default;

    if ($value < 1) {
        return $default;
    }

    return $value;
}

// 4. Kiem tra role khach hang
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

// 5. Lay user khach hang dang dang nhap neu co
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

// 6. Lay nhan trang thai
function getOrderStatusLabel($status)
{
    $labels = [
        'pending' => 'Chờ xác nhận',
        'confirmed' => 'Đã xác nhận',
        'shipping' => 'Đang giao',
        'completed' => 'Hoàn thành',
        'cancelled' => 'Đã hủy'
    ];

    return $labels[$status] ?? 'Chờ xác nhận';
}

// 7. Lay nhan thanh toan
function getPaymentMethodLabel($method)
{
    $labels = [
        'cod' => 'Thanh toán khi nhận hàng',
        'bank_transfer' => 'Chuyển khoản qua mã QR',
        'momo' => 'Ví MoMo',
        'vnpay' => 'VNPay'
    ];

    return $labels[$method] ?? 'Thanh toán khi nhận hàng';
}

// 8. Lay nhan trang thai thanh toan
function getPaymentStatusLabel($status)
{
    $labels = [
        'unpaid' => 'Chưa thanh toán',
        'paid' => 'Đã thanh toán',
        'failed' => 'Thanh toán thất bại',
        'refunded' => 'Đã hoàn tiền'
    ];

    return $labels[$status] ?? 'Chưa thanh toán';
}

// 9. Lay items cua tung don hang
function getOrderItems($conn, $orderIds)
{
    if (count($orderIds) === 0) {
        return [];
    }

    $placeholders = [];

    foreach ($orderIds as $index => $orderId) {
        $placeholders[] = ':order_id_' . $index;
    }

    $inSql = implode(',', $placeholders);

    $sql = "
        SELECT
            id,
            order_id,
            variant_id,
            product_name,
            color_name,
            size_name,
            product_image,
            sku,
            price,
            quantity,
            total_price
        FROM order_items
        WHERE order_id IN ($inSql)
        ORDER BY id ASC
    ";

    $stmt = $conn->prepare($sql);

    foreach ($orderIds as $index => $orderId) {
        $stmt->bindValue(':order_id_' . $index, (int) $orderId, PDO::PARAM_INT);
    }

    $stmt->execute();
    $rows = $stmt->fetchAll();

    $itemsByOrder = [];

    foreach ($rows as $row) {
        $orderId = (int) $row['order_id'];

        if (!isset($itemsByOrder[$orderId])) {
            $itemsByOrder[$orderId] = [];
        }

        $itemsByOrder[$orderId][] = [
            'id' => (int) $row['id'],
            'order_id' => $orderId,
            'variant_id' => $row['variant_id'] !== null ? (int) $row['variant_id'] : null,
            'product_name' => $row['product_name'],
            'name' => $row['product_name'],
            'color_name' => $row['color_name'],
            'color' => $row['color_name'],
            'size_name' => $row['size_name'],
            'size' => $row['size_name'],
            'product_image' => $row['product_image'],
            'image' => $row['product_image'],
            'sku' => $row['sku'],
            'price' => (float) $row['price'],
            'quantity' => (int) $row['quantity'],
            'total_price' => (float) $row['total_price']
        ];
    }

    return $itemsByOrder;
}

// 10. Build dieu kien loc
function buildOrderWhere($customer, $status, $keyword, $receiverPhone, $receiverEmail)
{
    $where = [];
    $params = [];

    if ($customer) {
        $where[] = "(
            o.user_id = :user_id
            OR o.receiver_phone = :customer_phone
            OR o.receiver_name = :customer_name
        )";

        $params[':user_id'] = (int) $customer['id'];
        $params[':customer_phone'] = $customer['phone'] ?? '';
        $params[':customer_name'] = $customer['full_name'] ?? '';

        if (!empty($customer['email'])) {
            $where[] = "1 = 1";
        }
    } else {
        // Khi khong co session khach hang:
        // - Neu frontend truyen phone/email thi loc theo phone/email.
        // - Neu khong truyen thi lay don guest user_id IS NULL de my-order.js loc tiep bang localStorage.
        if ($receiverPhone !== '') {
            $where[] = "o.receiver_phone = :receiver_phone";
            $params[':receiver_phone'] = $receiverPhone;
        } elseif ($receiverEmail !== '') {
            // Bang orders hien tai co the chua co receiver_email,
            // nen email chu yeu dung cho frontend localStorage.
            $where[] = "o.user_id IS NULL";
        } else {
            $where[] = "o.user_id IS NULL";
        }
    }

    if ($status !== '' && $status !== 'all') {
        $where[] = "o.order_status = :status";
        $params[':status'] = $status;
    }

    if ($keyword !== '') {
        $where[] = "(
            o.order_code LIKE :keyword
            OR o.receiver_name LIKE :keyword
            OR o.receiver_phone LIKE :keyword
        )";

        $params[':keyword'] = '%' . $keyword . '%';
    }

    return [
        'where_sql' => count($where) > 0 ? implode(' AND ', $where) : '1 = 1',
        'params' => $params
    ];
}

// 11. Xu ly chinh
$conn = getDatabaseConnection();

try {
    $customer = getCurrentCustomer($conn);

    $page = getQueryInt('page', 1);
    $limit = getQueryInt('limit', 10);
    $status = getQueryValue('status', getQueryValue('order_status', 'all'));
    $keyword = getQueryValue('keyword', '');
    $sort = getQueryValue('sort', 'latest');
    $receiverPhone = getQueryValue('phone', getQueryValue('receiver_phone', ''));
    $receiverEmail = getQueryValue('email', getQueryValue('receiver_email', ''));

    if ($limit > 100) {
        $limit = 100;
    }

    $offset = ($page - 1) * $limit;

    $whereData = buildOrderWhere($customer, $status, $keyword, $receiverPhone, $receiverEmail);
    $whereSql = $whereData['where_sql'];
    $params = $whereData['params'];

    $orderBy = "o.created_at DESC";

    if ($sort === 'oldest') {
        $orderBy = "o.created_at ASC";
    }

    if ($sort === 'total_desc') {
        $orderBy = "o.final_total DESC";
    }

    if ($sort === 'total_asc') {
        $orderBy = "o.final_total ASC";
    }

    // 12. Dem tong don
    $countSql = "
        SELECT COUNT(*) AS total
        FROM orders o
        WHERE $whereSql
    ";

    $countStmt = $conn->prepare($countSql);

    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }

    $countStmt->execute();
    $totalOrders = (int) $countStmt->fetch()['total'];

    // 13. Lay danh sach don
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
            p.payment_status,
            p.transaction_code,
            p.paid_at
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE $whereSql
        ORDER BY $orderBy
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $conn->prepare($sql);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();

    $orderIds = [];

    foreach ($rows as $row) {
        $orderIds[] = (int) $row['id'];
    }

    $itemsByOrder = getOrderItems($conn, $orderIds);

    $orders = [];

    foreach ($rows as $row) {
        $orderId = (int) $row['id'];
        $items = $itemsByOrder[$orderId] ?? [];

        $orders[] = [
            'id' => $orderId,
            'user_id' => $row['user_id'] !== null ? (int) $row['user_id'] : null,
            'customer_type' => $row['user_id'] !== null ? 'member' : 'guest',
            'order_code' => $row['order_code'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],

            'receiver' => [
                'name' => $row['receiver_name'],
                'phone' => $row['receiver_phone'],
                'shipping_address' => $row['shipping_address']
            ],

            'receiver_name' => $row['receiver_name'],
            'receiver_phone' => $row['receiver_phone'],
            'shipping_address' => $row['shipping_address'],
            'note' => $row['note'],

            'money' => [
                'total_product_price' => (float) $row['total_product_price'],
                'shipping_fee' => (float) $row['shipping_fee'],
                'discount_amount' => (float) $row['discount_amount'],
                'points_discount' => (float) $row['points_discount'],
                'final_total' => (float) $row['final_total']
            ],

            'total_product_price' => (float) $row['total_product_price'],
            'shipping_fee' => (float) $row['shipping_fee'],
            'discount_amount' => (float) $row['discount_amount'],
            'points_discount' => (float) $row['points_discount'],
            'final_total' => (float) $row['final_total'],

            'payment' => [
                'method' => $row['payment_method'],
                'method_label' => getPaymentMethodLabel($row['payment_method']),
                'status' => $row['payment_status'] ?: 'unpaid',
                'status_label' => getPaymentStatusLabel($row['payment_status'] ?: 'unpaid'),
                'transaction_code' => $row['transaction_code'],
                'paid_at' => $row['paid_at']
            ],

            'payment_method' => $row['payment_method'],
            'payment_method_label' => getPaymentMethodLabel($row['payment_method']),

            'status' => [
                'code' => $row['order_status'],
                'label' => getOrderStatusLabel($row['order_status'])
            ],

            'order_status' => $row['order_status'],
            'order_status_label' => getOrderStatusLabel($row['order_status']),

            'items' => $items,
            'item_count' => count($items)
        ];
    }

    $totalPages = $limit > 0 ? (int) ceil($totalOrders / $limit) : 1;

    sendSuccess('Lay danh sach don hang cua toi thanh cong', [
        'orders' => $orders,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_orders' => $totalOrders,
            'total_pages' => $totalPages
        ],
        'customer' => $customer ? [
            'id' => (int) $customer['id'],
            'full_name' => $customer['full_name'],
            'email' => $customer['email'],
            'phone' => $customer['phone']
        ] : null
    ]);
} catch (Exception $e) {
    sendError('Khong lay duoc danh sach don hang cua toi', 500, [
        'error' => $e->getMessage()
    ]);
}