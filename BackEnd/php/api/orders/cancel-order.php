<?php
// =========================================================
// File: api/orders/cancel-order.php
// Mục đích: API hủy đơn hàng của người dùng đang đăng nhập
// Method: POST
// =========================================================

session_start();

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/response.php';


// 1. Cho phép gọi API từ frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}


// 2. Chỉ cho phép POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Phuong thuc khong hop le', 405);
}


// 3. Kiểm tra đăng nhập
if (empty($_SESSION['user_id'])) {
    sendError('Vui long dang nhap de huy don hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy dữ liệu request
$orderId = isset($input['order_id']) ? (int) $input['order_id'] : 0;
$orderCode = trim($input['order_code'] ?? '');
$cancelReason = trim($input['cancel_reason'] ?? 'Khach hang huy don hang');


// 6. Validate dữ liệu
if ($orderId <= 0 && $orderCode === '') {
    sendError('Vui long truyen id hoac ma don hang', 422);
}


// 7. Kết nối database
$conn = getDatabaseConnection();

try {
    // 8. Kiểm tra user
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


    // 9. Lấy thông tin đơn hàng
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

    $sql = "
        SELECT
            o.id,
            o.user_id,
            o.order_code,
            o.note,
            o.total_product_price,
            o.shipping_fee,
            o.discount_amount,
            o.points_discount,
            o.final_total,
            o.payment_method,
            o.order_status,

            pay.id AS payment_id,
            pay.payment_status

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


    // 10. Kiểm tra trạng thái đơn có được hủy không
    $allowedCancelStatuses = ['pending', 'confirmed'];

    if (!in_array($order['order_status'], $allowedCancelStatuses)) {
        sendError('Don hang hien khong the huy', 400, [
            'current_status' => $order['order_status'],
            'allowed_statuses' => $allowedCancelStatuses
        ]);
    }

    if ($order['payment_status'] === 'paid' && $order['order_status'] === 'confirmed') {
        sendError('Don hang da thanh toan va da xac nhan, vui long lien he cua hang de huy', 400);
    }


    // 11. Lấy danh sách sản phẩm trong đơn để hoàn kho
    $sql = "
        SELECT
            oi.id AS order_item_id,
            oi.variant_id,
            oi.product_name,
            oi.sku,
            oi.quantity,

            pv.stock_quantity AS current_stock_quantity
        FROM order_items oi
        JOIN product_variants pv
            ON oi.variant_id = pv.id
        WHERE oi.order_id = :order_id
        ORDER BY oi.id ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':order_id' => $currentOrderId
    ]);

    $orderItems = $stmt->fetchAll();

    if (count($orderItems) === 0) {
        sendError('Don hang khong co san pham de huy', 400);
    }


    // 12. Bắt đầu transaction
    $conn->beginTransaction();


    // 13. Cập nhật trạng thái đơn hàng
    $newNote = trim(($order['note'] ?? '') . "\n[Huy don] " . $cancelReason);

    $sql = "
        UPDATE orders
        SET
            order_status = 'cancelled',
            note = :new_note,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :order_id_update
        AND user_id = :user_id_update
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':new_note' => $newNote,
        ':order_id_update' => $currentOrderId,
        ':user_id_update' => $userId
    ]);


    // 14. Hoàn lại tồn kho và ghi lịch sử tồn kho
    $restoredItems = [];

    foreach ($orderItems as $item) {
        $variantId = (int) $item['variant_id'];
        $quantity = (int) $item['quantity'];

        $quantityBefore = (int) $item['current_stock_quantity'];
        $quantityAfter = $quantityBefore + $quantity;

        // 14.1 Cộng lại tồn kho
        $sql = "
            UPDATE product_variants
            SET
                stock_quantity = stock_quantity + :quantity_add,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :variant_id_update
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':quantity_add' => $quantity,
            ':variant_id_update' => $variantId
        ]);


        // 14.2 Ghi lịch sử hoàn kho
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
                :variant_id_log,
                :user_id_log,
                'cancel',
                :quantity_change,
                :quantity_before,
                :quantity_after,
                :note
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':variant_id_log' => $variantId,
            ':user_id_log' => $userId,
            ':quantity_change' => $quantity,
            ':quantity_before' => $quantityBefore,
            ':quantity_after' => $quantityAfter,
            ':note' => 'Hoan kho khi huy don hang ' . $order['order_code']
        ]);

        $restoredItems[] = [
            'variant_id' => $variantId,
            'sku' => $item['sku'],
            'product_name' => $item['product_name'],
            'quantity_restored' => $quantity,
            'stock_before' => $quantityBefore,
            'stock_after' => $quantityAfter
        ];
    }


    // 15. Cập nhật trạng thái thanh toán
    if (!empty($order['payment_id'])) {
        $newPaymentStatus = 'failed';

        if ($order['payment_status'] === 'paid') {
            $newPaymentStatus = 'refunded';
        }

        $sql = "
            UPDATE payments
            SET
                payment_status = :payment_status,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :payment_id
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':payment_status' => $newPaymentStatus,
            ':payment_id' => (int) $order['payment_id']
        ]);
    } else {
        $newPaymentStatus = null;
    }


    // 16. Hoàn lại voucher nếu đơn có dùng voucher
    $sql = "
        SELECT
            id,
            voucher_id
        FROM voucher_usages
        WHERE order_id = :order_id_voucher
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':order_id_voucher' => $currentOrderId
    ]);

    $voucherUsage = $stmt->fetch();

    $restoredVoucher = null;

    if ($voucherUsage) {
        $sql = "
            UPDATE vouchers
            SET
                used_quantity = GREATEST(used_quantity - 1, 0),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :voucher_id_update
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':voucher_id_update' => (int) $voucherUsage['voucher_id']
        ]);

        $sql = "
            DELETE FROM voucher_usages
            WHERE id = :voucher_usage_id
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':voucher_usage_id' => (int) $voucherUsage['id']
        ]);

        $restoredVoucher = [
            'voucher_id' => (int) $voucherUsage['voucher_id'],
            'voucher_usage_id' => (int) $voucherUsage['id']
        ];
    }


    // 17. Hoàn lại điểm nếu đơn có dùng điểm
    $pointValue = 1000;
    $pointsToRestore = 0;

    if ((float) $order['points_discount'] > 0) {
        $pointsToRestore = (int) ((float) $order['points_discount'] / $pointValue);

        if ($pointsToRestore > 0) {
            $sql = "
                UPDATE customer_profiles
                SET
                    points_balance = points_balance + :points_restore,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = :user_id_points
            ";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':points_restore' => $pointsToRestore,
                ':user_id_points' => $userId
            ]);

            $sql = "
                INSERT INTO points_history (
                    user_id,
                    order_id,
                    type,
                    points,
                    description
                )
                VALUES (
                    :user_id_history,
                    :order_id_history,
                    'earn',
                    :points_history,
                    :description_history
                )
            ";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':user_id_history' => $userId,
                ':order_id_history' => $currentOrderId,
                ':points_history' => $pointsToRestore,
                ':description_history' => 'Hoan lai diem khi huy don hang ' . $order['order_code']
            ]);
        }
    }


    // 18. Cập nhật thống kê khách hàng
    $sql = "
        UPDATE customer_profiles
        SET
            total_orders = GREATEST(total_orders - 1, 0),
            total_spent = GREATEST(total_spent - :final_total_cancel, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = :user_id_profile
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':final_total_cancel' => (float) $order['final_total'],
        ':user_id_profile' => $userId
    ]);


    // 19. Hoàn tất transaction
    $conn->commit();


    // 20. Trả kết quả
    sendSuccess('Huy don hang thanh cong', [
        'order' => [
            'id' => $currentOrderId,
            'order_code' => $order['order_code'],
            'old_status' => $order['order_status'],
            'new_status' => 'cancelled',
            'cancel_reason' => $cancelReason,
            'final_total' => (float) $order['final_total']
        ],
        'payment' => [
            'old_status' => $order['payment_status'],
            'new_status' => $newPaymentStatus
        ],
        'stock' => [
            'restored_items' => $restoredItems
        ],
        'voucher' => $restoredVoucher,
        'points' => [
            'restored_points' => $pointsToRestore
        ]
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Huy don hang that bai', 500, [
        'error' => $e->getMessage()
    ]);
}