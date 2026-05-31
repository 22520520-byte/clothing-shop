<?php
// =========================================================
// File: api/admin/orders/update-payment-status.php
// Mục đích: API admin cập nhật trạng thái thanh toán đơn hàng
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
    sendError('Vui long dang nhap de cap nhat thanh toan', 401);
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

$paymentStatus = trim($input['payment_status'] ?? '');
$transactionCode = trim($input['transaction_code'] ?? '');
$note = trim($input['note'] ?? '');


// 6. Validate dữ liệu
$errors = [];

if ($orderId <= 0 && $orderCode === '') {
    $errors['order'] = 'Vui long truyen order_id hoac order_code';
}

$allowedPaymentStatuses = [
    'unpaid',
    'paid',
    'failed',
    'refunded'
];

if (!in_array($paymentStatus, $allowedPaymentStatuses)) {
    $errors['payment_status'] = 'Trang thai thanh toan khong hop le';
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
        sendError('Ban khong co quyen cap nhat thanh toan', 403);
    }


    // 9. Tìm đơn hàng
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

    $sql = "
        SELECT
            o.id,
            o.user_id,
            o.order_code,
            o.receiver_name,
            o.receiver_phone,
            o.final_total,
            o.payment_method,
            o.order_status,
            o.note
        FROM orders o
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


    // 10. Lấy thanh toán hiện tại
    $sql = "
        SELECT
            id,
            order_id,
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


    // 11. Nếu chưa có payment thì tạo mới
    if (!$payment) {
        $conn->beginTransaction();

        $sql = "
            INSERT INTO payments (
                order_id,
                payment_method,
                payment_status,
                amount,
                transaction_code,
                paid_at
            )
            VALUES (
                :order_id,
                :payment_method,
                :payment_status,
                :amount,
                :transaction_code,
                CASE
                    WHEN :paid_status_check = 'paid' THEN CURRENT_TIMESTAMP
                    ELSE NULL
                END
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':order_id' => $currentOrderId,
            ':payment_method' => $order['payment_method'],
            ':payment_status' => $paymentStatus,
            ':amount' => $order['final_total'],
            ':transaction_code' => $transactionCode !== '' ? $transactionCode : null,
            ':paid_status_check' => $paymentStatus
        ]);

        $paymentId = (int) $conn->lastInsertId();
        $oldPaymentStatus = null;

    } else {
        $paymentId = (int) $payment['id'];
        $oldPaymentStatus = $payment['payment_status'];

        if ($oldPaymentStatus === $paymentStatus) {
            sendSuccess('Trang thai thanh toan khong thay doi', [
                'order' => [
                    'id' => $currentOrderId,
                    'order_code' => $order['order_code']
                ],
                'payment' => [
                    'id' => $paymentId,
                    'old_status' => $oldPaymentStatus,
                    'new_status' => $paymentStatus
                ]
            ]);
        }

        $conn->beginTransaction();


        // 12. Cập nhật thanh toán
        $sql = "
            UPDATE payments
            SET
                payment_status = :payment_status,
                transaction_code = CASE
                    WHEN :transaction_code_empty = '' THEN transaction_code
                    ELSE :transaction_code
                END,
                paid_at = CASE
                    WHEN :payment_status_paid = 'paid' THEN CURRENT_TIMESTAMP
                    WHEN :payment_status_not_paid IN ('unpaid', 'failed') THEN NULL
                    ELSE paid_at
                END
            WHERE id = :payment_id
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':payment_status' => $paymentStatus,
            ':transaction_code_empty' => $transactionCode,
            ':transaction_code' => $transactionCode,
            ':payment_status_paid' => $paymentStatus,
            ':payment_status_not_paid' => $paymentStatus,
            ':payment_id' => $paymentId
        ]);
    }


    // 13. Nếu thanh toán thất bại hoặc hoàn tiền thì không tự hủy đơn
    // Chỉ cập nhật note nếu admin nhập ghi chú
    if ($note !== '') {
        $sql = "
            UPDATE orders
            SET
                note = :note,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :order_id
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':note' => $note,
            ':order_id' => $currentOrderId
        ]);
    }


    // 14. Ghi log hoạt động nhân viên nếu có bảng staff_activity_logs
    try {
        $description = 'Cap nhat thanh toan don hang ' . $order['order_code'] . ' sang ' . $paymentStatus;

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
                'update_payment',
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


    // 15. Lấy lại payment mới nhất
    $sql = "
        SELECT
            id,
            order_id,
            payment_method,
            payment_status,
            amount,
            transaction_code,
            paid_at
        FROM payments
        WHERE id = :payment_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':payment_id' => $paymentId
    ]);

    $updatedPayment = $stmt->fetch();


    // 16. Hoàn tất transaction
    $conn->commit();


    // 17. Nhãn hiển thị
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


    // 18. Trả kết quả
    sendSuccess('Admin cap nhat thanh toan thanh cong', [
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
            'order_status' => $order['order_status']
        ],

        'payment' => [
            'id' => (int) $updatedPayment['id'],
            'method' => $updatedPayment['payment_method'],
            'method_label' => $paymentMethodLabels[$updatedPayment['payment_method']] ?? $updatedPayment['payment_method'],

            'old_status' => $oldPaymentStatus,
            'new_status' => $updatedPayment['payment_status'],
            'new_status_label' => $paymentStatusLabels[$updatedPayment['payment_status']] ?? $updatedPayment['payment_status'],

            'amount' => (float) $updatedPayment['amount'],
            'transaction_code' => $updatedPayment['transaction_code'],
            'paid_at' => $updatedPayment['paid_at']
        ],

        'note' => $note
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Admin cap nhat thanh toan that bai', 500, [
        'error' => $e->getMessage()
    ]);
}