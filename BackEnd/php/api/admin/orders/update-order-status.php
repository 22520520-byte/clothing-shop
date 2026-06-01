<?php
// =========================================================
// File: BackEnd/php/api/admin/orders/update-order-status.php
// Muc dich: Admin cap nhat trang thai don hang
// Cap nhat: Nhan linh hoat order_id/order_code/status/new_status/order_status
// =========================================================

session_start();

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../helpers/response.php';

// 1. Chi cho phep POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Phuong thuc khong hop le', 405);
}

// 2. Doc JSON body
function getJsonBody()
{
    $rawBody = file_get_contents('php://input');

    if (!$rawBody) {
        return [];
    }

    $data = json_decode($rawBody, true);

    if (!is_array($data)) {
        sendError('Du lieu JSON khong hop le', 400);
    }

    return $data;
}

// 3. Lay gia tri tu nhieu key
function getValue($data, $keys, $default = null)
{
    foreach ($keys as $key) {
        if (isset($data[$key]) && $data[$key] !== '') {
            return $data[$key];
        }
    }

    return $default;
}

// 4. Lay id admin dang dang nhap
function getCurrentAdminId()
{
    if (isset($_SESSION['user_id'])) {
        return (int) $_SESSION['user_id'];
    }

    if (isset($_SESSION['admin_id'])) {
        return (int) $_SESSION['admin_id'];
    }

    if (isset($_SESSION['admin_user_id'])) {
        return (int) $_SESSION['admin_user_id'];
    }

    return 0;
}

// 5. Kiem tra quyen admin
function getCurrentAdminUser($conn)
{
    $userId = getCurrentAdminId();

    if ($userId <= 0) {
        sendError('Ban chua dang nhap admin', 401);
    }

    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.phone,
            u.status,
            r.code AS role_code,
            r.name AS role_name
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
        sendError('Khong tim thay nguoi dung', 404);
    }

    if ($user['status'] !== 'active') {
        sendError('Tai khoan dang bi khoa hoac khong hoat dong', 403);
    }

    $allowedRoles = ['owner', 'admin', 'staff'];

    if (!in_array($user['role_code'], $allowedRoles)) {
        sendError('Ban khong co quyen cap nhat trang thai don hang', 403);
    }

    return $user;
}

// 6. Lay thong tin don hang
function getOrderByIdOrCode($conn, $orderId, $orderCode)
{
    if ($orderId > 0) {
        $sql = "
            SELECT
                id,
                user_id,
                order_code,
                receiver_name,
                receiver_phone,
                final_total,
                payment_method,
                order_status,
                note
            FROM orders
            WHERE id = :order_id
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':order_id' => $orderId
        ]);

        return $stmt->fetch();
    }

    if ($orderCode !== '') {
        $sql = "
            SELECT
                id,
                user_id,
                order_code,
                receiver_name,
                receiver_phone,
                final_total,
                payment_method,
                order_status,
                note
            FROM orders
            WHERE order_code = :order_code
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':order_code' => $orderCode
        ]);

        return $stmt->fetch();
    }

    return null;
}

// 7. Kiem tra trang thai hop le
function isValidStatus($status)
{
    return in_array($status, [
        'pending',
        'confirmed',
        'shipping',
        'completed',
        'cancelled'
    ]);
}

// 8. Lay danh sach trang thai tiep theo
function getAllowedTransitions()
{
    return [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['shipping', 'cancelled'],
        'shipping' => ['completed'],
        'completed' => [],
        'cancelled' => []
    ];
}

// 9. Lay nhan trang thai
function getOrderStatusLabels()
{
    return [
        'pending' => 'Chờ xác nhận',
        'confirmed' => 'Đã xác nhận',
        'shipping' => 'Đang giao hàng',
        'completed' => 'Hoàn thành',
        'cancelled' => 'Đã hủy'
    ];
}

// 10. Lay nhan thanh toan
function getPaymentStatusLabels()
{
    return [
        'unpaid' => 'Chưa thanh toán',
        'paid' => 'Đã thanh toán',
        'failed' => 'Thanh toán thất bại',
        'refunded' => 'Đã hoàn tiền'
    ];
}

// 11. Hoan kho khi huy don
function restoreStockWhenCancel($conn, $orderId, $orderCode, $adminUserId)
{
    $restoredItems = [];

    $sql = "
        SELECT
            oi.id,
            oi.variant_id,
            oi.quantity,
            oi.product_name,
            oi.sku,
            pv.stock_quantity
        FROM order_items oi
        LEFT JOIN product_variants pv ON oi.variant_id = pv.id
        WHERE oi.order_id = :order_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':order_id' => $orderId
    ]);

    $items = $stmt->fetchAll();

    foreach ($items as $item) {
        if (!$item['variant_id']) {
            continue;
        }

        $variantId = (int) $item['variant_id'];
        $quantity = (int) $item['quantity'];
        $stockBefore = (int) $item['stock_quantity'];
        $stockAfter = $stockBefore + $quantity;

        $sql = "
            UPDATE product_variants
            SET stock_quantity = :stock_after,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :variant_id
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':stock_after' => $stockAfter,
            ':variant_id' => $variantId
        ]);

        try {
            $sql = "
                INSERT INTO product_stock_logs (
                    variant_id,
                    user_id,
                    change_type,
                    quantity_change,
                    quantity_before,
                    quantity_after,
                    note
                )
                VALUES (
                    :variant_id,
                    :user_id,
                    'cancel',
                    :quantity_change,
                    :quantity_before,
                    :quantity_after,
                    :note
                )
            ";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':variant_id' => $variantId,
                ':user_id' => $adminUserId,
                ':quantity_change' => $quantity,
                ':quantity_before' => $stockBefore,
                ':quantity_after' => $stockAfter,
                ':note' => 'Hoan kho khi admin huy don hang ' . $orderCode
            ]);
        } catch (PDOException $error) {
            // Bo qua neu bang log khac cau truc
        }

        $restoredItems[] = [
            'variant_id' => $variantId,
            'sku' => $item['sku'],
            'product_name' => $item['product_name'],
            'quantity_restored' => $quantity,
            'stock_before' => $stockBefore,
            'stock_after' => $stockAfter
        ];
    }

    return $restoredItems;
}

// 12. Ghi log nhan vien
function saveStaffActivityLog($conn, $adminUserId, $orderId, $orderCode, $oldStatus, $newStatus)
{
    try {
        $description = 'Cap nhat trang thai don hang ' . $orderCode . ' tu ' . $oldStatus . ' sang ' . $newStatus;

        $sql = "
            INSERT INTO staff_activity_logs (
                user_id,
                action_type,
                target_type,
                target_id,
                description
            )
            VALUES (
                :user_id,
                'update_status',
                'order',
                :target_id,
                :description
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $adminUserId,
            ':target_id' => $orderId,
            ':description' => $description
        ]);
    } catch (PDOException $error) {
        // Bo qua neu bang log khac cau truc
    }
}

// 13. Xu ly chinh
$data = getJsonBody();
$conn = getDatabaseConnection();

try {
    $adminUser = getCurrentAdminUser($conn);
    $adminUserId = (int) $adminUser['id'];

    $orderId = (int) getValue($data, ['order_id', 'orderId', 'id'], 0);
    $orderCode = trim((string) getValue($data, ['order_code', 'orderCode', 'code'], ''));
    $newStatus = trim((string) getValue($data, ['new_status', 'newStatus', 'order_status', 'orderStatus', 'status'], ''));
    $note = trim((string) getValue($data, ['note', 'admin_note', 'adminNote'], ''));

    if ($orderId <= 0 && $orderCode === '') {
        sendError('Thieu ma don hang can cap nhat', 422);
    }

    if ($newStatus === '') {
        sendError('Thieu trang thai moi', 422);
    }

    if (!isValidStatus($newStatus)) {
        sendError('Trang thai moi khong hop le', 422, [
            'new_status' => $newStatus
        ]);
    }

    $order = getOrderByIdOrCode($conn, $orderId, $orderCode);

    if (!$order) {
        sendError('Khong tim thay don hang', 404);
    }

    $currentOrderId = (int) $order['id'];
    $oldStatus = $order['order_status'];

    if (!isValidStatus($oldStatus)) {
        sendError('Trang thai hien tai cua don hang khong hop le', 422, [
            'old_status' => $oldStatus
        ]);
    }

    if ($oldStatus === $newStatus) {
        sendSuccess('Trang thai don hang khong thay doi', [
            'order' => [
                'id' => $currentOrderId,
                'order_code' => $order['order_code'],
                'old_status' => $oldStatus,
                'new_status' => $newStatus
            ]
        ]);
    }

    $allowedTransitions = getAllowedTransitions();
    $nextStatuses = $allowedTransitions[$oldStatus] ?? [];

    if (!in_array($newStatus, $nextStatuses)) {
        sendError('Khong the chuyen trang thai don hang tu ' . $oldStatus . ' sang ' . $newStatus, 422, [
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'next_statuses' => $nextStatuses
        ]);
    }

    $conn->beginTransaction();

    $restoredItems = [];

    if ($newStatus === 'cancelled') {
        $restoredItems = restoreStockWhenCancel($conn, $currentOrderId, $order['order_code'], $adminUserId);
    }

    $updatedNote = $order['note'];

    if ($note !== '') {
        $updatedNote = $note;
    }

    $sql = "
        UPDATE orders
        SET order_status = :order_status,
            note = :note,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :order_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':order_status' => $newStatus,
        ':note' => $updatedNote,
        ':order_id' => $currentOrderId
    ]);

    if ($newStatus === 'cancelled') {
        $sql = "
            UPDATE payments
            SET payment_status = CASE
                WHEN payment_status = 'unpaid' THEN 'failed'
                ELSE payment_status
            END
            WHERE order_id = :order_id
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':order_id' => $currentOrderId
        ]);
    }

    if ($newStatus === 'completed' && $order['payment_method'] === 'cod') {
        $sql = "
            UPDATE payments
            SET payment_status = 'paid',
                paid_at = CURRENT_TIMESTAMP
            WHERE order_id = :order_id
              AND payment_status = 'unpaid'
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':order_id' => $currentOrderId
        ]);
    }

    saveStaffActivityLog($conn, $adminUserId, $currentOrderId, $order['order_code'], $oldStatus, $newStatus);

    $sql = "
        SELECT
            id,
            payment_method,
            payment_status,
            amount,
            transaction_code,
            paid_at
        FROM payments
        WHERE order_id = :order_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':order_id' => $currentOrderId
    ]);

    $payment = $stmt->fetch();

    $conn->commit();

    $orderStatusLabels = getOrderStatusLabels();
    $paymentStatusLabels = getPaymentStatusLabels();

    sendSuccess('Cap nhat trang thai don hang thanh cong', [
        'current_user' => [
            'id' => $adminUserId,
            'full_name' => $adminUser['full_name'],
            'email' => $adminUser['email'],
            'role' => [
                'code' => $adminUser['role_code'],
                'name' => $adminUser['role_name']
            ]
        ],
        'order' => [
            'id' => $currentOrderId,
            'order_code' => $order['order_code'],
            'receiver_name' => $order['receiver_name'],
            'receiver_phone' => $order['receiver_phone'],
            'final_total' => (float) $order['final_total'],
            'old_status' => $oldStatus,
            'old_status_label' => $orderStatusLabels[$oldStatus] ?? $oldStatus,
            'new_status' => $newStatus,
            'new_status_label' => $orderStatusLabels[$newStatus] ?? $newStatus,
            'note' => $updatedNote
        ],
        'payment' => $payment ? [
            'id' => (int) $payment['id'],
            'method' => $payment['payment_method'],
            'status' => $payment['payment_status'],
            'status_label' => $paymentStatusLabels[$payment['payment_status']] ?? $payment['payment_status'],
            'amount' => (float) $payment['amount'],
            'transaction_code' => $payment['transaction_code'],
            'paid_at' => $payment['paid_at']
        ] : null,
        'stock' => [
            'restored_items' => $restoredItems
        ]
    ]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Cap nhat trang thai don hang that bai', 500, [
        'error' => $e->getMessage()
    ]);
}