<?php
// =========================================================
// File: api/reports/get-payment-summary.php
// Mục đích: API lấy báo cáo thanh toán
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
    sendError('Vui long dang nhap de xem bao cao thanh toan', 401);
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
        sendError('Ban khong co quyen xem bao cao thanh toan', 403);
    }


    // 6. Lấy dữ liệu thống kê thanh toán từ view
    $sql = "
        SELECT
            payment_method,
            payment_status,
            total_payments,
            total_amount
        FROM vw_payment_summary
        ORDER BY payment_method ASC, payment_status ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $payments = $stmt->fetchAll();


    // 7. Tạo nhãn hiển thị
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


    // 8. Format dữ liệu thanh toán
    $formattedPayments = [];
    $summaryByMethod = [];
    $summaryByStatus = [];

    $totalPayments = 0;
    $totalAmount = 0;

    foreach ($payments as $payment) {
        $method = $payment['payment_method'];
        $status = $payment['payment_status'];

        $paymentCount = (int) $payment['total_payments'];
        $paymentAmount = (float) $payment['total_amount'];

        $formattedPayments[] = [
            'payment_method' => $method,
            'payment_method_label' => $paymentMethodLabels[$method] ?? $method,

            'payment_status' => $status,
            'payment_status_label' => $paymentStatusLabels[$status] ?? $status,

            'total_payments' => $paymentCount,
            'total_amount' => $paymentAmount
        ];

        $totalPayments += $paymentCount;
        $totalAmount += $paymentAmount;

        if (!isset($summaryByMethod[$method])) {
            $summaryByMethod[$method] = [
                'payment_method' => $method,
                'payment_method_label' => $paymentMethodLabels[$method] ?? $method,
                'total_payments' => 0,
                'total_amount' => 0
            ];
        }

        $summaryByMethod[$method]['total_payments'] += $paymentCount;
        $summaryByMethod[$method]['total_amount'] += $paymentAmount;

        if (!isset($summaryByStatus[$status])) {
            $summaryByStatus[$status] = [
                'payment_status' => $status,
                'payment_status_label' => $paymentStatusLabels[$status] ?? $status,
                'total_payments' => 0,
                'total_amount' => 0
            ];
        }

        $summaryByStatus[$status]['total_payments'] += $paymentCount;
        $summaryByStatus[$status]['total_amount'] += $paymentAmount;
    }


    // 9. Chuyển object về mảng
    $summaryByMethod = array_values($summaryByMethod);
    $summaryByStatus = array_values($summaryByStatus);


    // 10. Trả kết quả
    sendSuccess('Lay bao cao thanh toan thanh cong', [
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
            'total_payments' => $totalPayments,
            'total_amount' => $totalAmount
        ],

        'payment_summary' => $formattedPayments,
        'summary_by_method' => $summaryByMethod,
        'summary_by_status' => $summaryByStatus
    ]);

} catch (PDOException $e) {
    sendError('Lay bao cao thanh toan that bai', 500, [
        'database' => $e->getMessage()
    ]);
}