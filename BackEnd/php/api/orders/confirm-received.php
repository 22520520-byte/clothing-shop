<?php
// =========================================================
// File: BackEnd/php/api/orders/confirm-received.php
// Muc dich: Khach hang xac nhan da nhan hang
// =========================================================

session_start();

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/response.php';

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

// 4. Lay user hien tai neu co
function getCurrentUserId()
{
    if (isset($_SESSION['user_id'])) {
        return (int) $_SESSION['user_id'];
    }

    return 0;
}

// 5. Lay thong tin don hang
function getOrder($conn, $orderId, $orderCode)
{
    if ($orderId > 0) {
        $sql = "
            SELECT
                id,
                user_id,
                order_code,
                receiver_name,
                receiver_phone,
                order_status,
                payment_method,
                final_total
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
                order_status,
                payment_method,
                final_total
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

// 6. Cap nhat diem thuong khi hoan thanh don neu co user_id
function addRewardPoints($conn, $orderId, $orderCode, $userId, $finalTotal)
{
    if (!$userId) {
        return 0;
    }

    // Demo: 10.000d = 1 diem
    $rewardPoints = (int) floor((float) $finalTotal / 10000);

    if ($rewardPoints <= 0) {
        return 0;
    }

    $sql = "
        INSERT INTO customer_profiles (
            user_id,
            membership_level,
            points_balance,
            total_orders,
            total_spent
        )
        VALUES (
            :user_id,
            'normal',
            :reward_points,
            0,
            0
        )
        ON DUPLICATE KEY UPDATE
            points_balance = points_balance + VALUES(points_balance),
            updated_at = CURRENT_TIMESTAMP
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId,
        ':reward_points' => $rewardPoints
    ]);

    try {
        $sql = "
            INSERT INTO points_history (
                user_id,
                order_id,
                type,
                points,
                description
            )
            VALUES (
                :user_id,
                :order_id,
                'earn',
                :points,
                :description
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':order_id' => $orderId,
            ':points' => $rewardPoints,
            ':description' => 'Nhan ' . $rewardPoints . ' diem khi hoan thanh don hang ' . $orderCode
        ]);
    } catch (PDOException $error) {
        // Bo qua neu bang points_history khac cau truc
    }

    return $rewardPoints;
}

// 7. Xu ly chinh
$data = getJsonBody();
$conn = getDatabaseConnection();

try {
    $orderId = (int) getValue($data, ['order_id', 'orderId', 'id'], 0);
    $orderCode = trim((string) getValue($data, ['order_code', 'orderCode', 'code'], ''));

    if ($orderId <= 0 && $orderCode === '') {
        sendError('Thieu ma don hang can xac nhan', 422);
    }

    $order = getOrder($conn, $orderId, $orderCode);

    if (!$order) {
        sendError('Khong tim thay don hang', 404);
    }

    $currentStatus = $order['order_status'];

    if ($currentStatus === 'completed') {
        sendSuccess('Don hang da duoc xac nhan hoan thanh truoc do', [
            'order' => [
                'id' => (int) $order['id'],
                'order_code' => $order['order_code'],
                'order_status' => 'completed'
            ]
        ]);
    }

    if ($currentStatus !== 'shipping') {
        sendError('Chi co don dang giao moi co the xac nhan da nhan', 422, [
            'current_status' => $currentStatus
        ]);
    }

    $conn->beginTransaction();

    $sql = "
        UPDATE orders
        SET order_status = 'completed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :order_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':order_id' => (int) $order['id']
    ]);

    // COD thi khi khach da nhan hang xem nhu da thanh toan
    if ($order['payment_method'] === 'cod') {
        $sql = "
            UPDATE payments
            SET payment_status = 'paid',
                paid_at = CURRENT_TIMESTAMP
            WHERE order_id = :order_id
              AND payment_status = 'unpaid'
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':order_id' => (int) $order['id']
        ]);
    }

    $rewardPoints = addRewardPoints(
        $conn,
        (int) $order['id'],
        $order['order_code'],
        $order['user_id'] ? (int) $order['user_id'] : 0,
        (float) $order['final_total']
    );

    $conn->commit();

    sendSuccess('Xac nhan da nhan hang thanh cong', [
        'order' => [
            'id' => (int) $order['id'],
            'order_code' => $order['order_code'],
            'old_status' => $currentStatus,
            'order_status' => 'completed',
            'status' => [
                'code' => 'completed',
                'label' => 'Hoàn thành'
            ]
        ],
        'points' => [
            'reward_points' => $rewardPoints
        ]
    ]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Xac nhan da nhan hang that bai', 500, [
        'error' => $e->getMessage()
    ]);
}