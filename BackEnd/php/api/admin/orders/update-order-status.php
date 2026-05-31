<?php
// =========================================================
// File: api/admin/orders/update-order-status.php
// Mục đích: API admin cập nhật trạng thái đơn hàng
// Method: POST
// =========================================================

session_start();

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../helpers/response.php';


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
    sendError('Vui long dang nhap de cap nhat trang thai don hang', 401);
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
$newStatus = trim($input['order_status'] ?? '');
$note = trim($input['note'] ?? '');


// 6. Validate dữ liệu
$errors = [];

if ($orderId <= 0 && $orderCode === '') {
    $errors['order'] = 'Vui long truyen order_id hoac order_code';
}

$allowedStatuses = [
    'pending',
    'confirmed',
    'shipping',
    'completed',
    'cancelled'
];

if (!in_array($newStatus, $allowedStatuses)) {
    $errors['order_status'] = 'Trang thai don hang khong hop le';
}

if (!empty($errors)) {
    sendError('Du lieu khong hop le', 422, $errors);
}


// 7. Kết nối database
$conn = getDatabaseConnection();

try {
    // 8. Kiểm tra quyền admin/staff
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
        sendError('Ban khong co quyen cap nhat trang thai don hang', 403);
    }


    // 9. Tìm đơn hàng
    if ($orderId > 0) {
        $whereSql = "id = :order_id";
        $params = [
            ':order_id' => $orderId
        ];
    } else {
        $whereSql = "order_code = :order_code";
        $params = [
            ':order_code' => $orderCode
        ];
    }

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
    $oldStatus = $order['order_status'];


    // 10. Nếu trạng thái không đổi
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


    // 11. Kiểm tra luồng chuyển trạng thái hợp lệ
    $allowedTransitions = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['shipping', 'cancelled'],
        'shipping' => ['completed'],
        'completed' => [],
        'cancelled' => []
    ];

    if (!in_array($newStatus, $allowedTransitions[$oldStatus] ?? [])) {
        sendError('Khong the chuyen trang thai don hang tu ' . $oldStatus . ' sang ' . $newStatus, 422, [
            'old_status' => $oldStatus,
            'new_status' => $newStatus
        ]);
    }


    // 12. Bắt đầu transaction
    $conn->beginTransaction();


    // 13. Nếu hủy đơn thì hoàn lại tồn kho
    $restoredItems = [];

    if ($newStatus === 'cancelled') {
        $sql = "
            SELECT
                oi.id,
                oi.variant_id,
                oi.quantity,
                pv.sku,
                pv.stock_quantity,
                p.name AS product_name
            FROM order_items oi
            JOIN product_variants pv
                ON oi.variant_id = pv.id
            JOIN products p
                ON pv.product_id = p.id
            WHERE oi.order_id = :order_id_items
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':order_id_items' => $currentOrderId
        ]);

        $orderItems = $stmt->fetchAll();

        foreach ($orderItems as $item) {
            $variantId = (int) $item['variant_id'];
            $quantity = (int) $item['quantity'];
            $stockBefore = (int) $item['stock_quantity'];
            $stockAfter = $stockBefore + $quantity;

            // Cập nhật tồn kho
            $sql = "
                UPDATE product_variants
                SET
                    stock_quantity = :stock_after,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :variant_id
            ";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':stock_after' => $stockAfter,
                ':variant_id' => $variantId
            ]);

            // Ghi log kho
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
                ':user_id' => $userId,
                ':quantity_change' => $quantity,
                ':quantity_before' => $stockBefore,
                ':quantity_after' => $stockAfter,
                ':note' => 'Hoan kho khi admin huy don hang ' . $order['order_code']
            ]);

            $restoredItems[] = [
                'variant_id' => $variantId,
                'sku' => $item['sku'],
                'product_name' => $item['product_name'],
                'quantity_restored' => $quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter
            ];
        }
    }


    // 14. Cập nhật trạng thái đơn hàng
    $updatedNote = $order['note'];

    if ($note !== '') {
        $updatedNote = $note;
    }

    $sql = "
        UPDATE orders
        SET
            order_status = :order_status,
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


    // 15. Nếu đơn bị hủy thì cập nhật thanh toán thất bại nếu đang chưa thanh toán
    if ($newStatus === 'cancelled') {
        $sql = "
            UPDATE payments
            SET
                payment_status = CASE
                    WHEN payment_status = 'unpaid' THEN 'failed'
                    ELSE payment_status
                END
            WHERE order_id = :order_id_payment
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':order_id_payment' => $currentOrderId
        ]);
    }


    // 16. Nếu đơn hoàn thành và thanh toán COD thì cập nhật đã thanh toán
    if ($newStatus === 'completed' && $order['payment_method'] === 'cod') {
        $sql = "
            UPDATE payments
            SET
                payment_status = 'paid',
                paid_at = CURRENT_TIMESTAMP
            WHERE order_id = :order_id_payment
            AND payment_status = 'unpaid'
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':order_id_payment' => $currentOrderId
        ]);
    }


    // 17. Ghi log hoạt động nhân viên nếu có bảng staff_activity_logs
    try {
        $description = 'Cap nhat trang thai don hang ' . $order['order_code'] . ' tu ' . $oldStatus . ' sang ' . $newStatus;

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
            ':user_id' => $userId,
            ':target_id' => $currentOrderId,
            ':description' => $description
        ]);
    } catch (PDOException $logError) {
        // Bỏ qua nếu bảng log khác cấu trúc
    }


    // 18. Lấy lại payment mới nhất
    $sql = "
        SELECT
            id,
            payment_method,
            payment_status,
            amount,
            transaction_code,
            paid_at
        FROM payments
        WHERE order_id = :order_id_payment_select
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':order_id_payment_select' => $currentOrderId
    ]);

    $payment = $stmt->fetch();


    // 19. Hoàn tất transaction
    $conn->commit();


    // 20. Nhãn hiển thị
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


    // 21. Trả kết quả
    sendSuccess('Admin cap nhat trang thai don hang thanh cong', [
        'current_user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => [
                'code' => $user['role_code'],
                'name' => $user['role_name']
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

    sendError('Admin cap nhat trang thai don hang that bai', 500, [
        'error' => $e->getMessage()
    ]);
}