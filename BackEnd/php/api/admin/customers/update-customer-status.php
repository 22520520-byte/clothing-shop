<?php
// =========================================================
// File: api/admin/customers/update-customer-status.php
// Mục đích: API admin cập nhật trạng thái khách hàng
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
    sendError('Vui long dang nhap de cap nhat trang thai khach hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy dữ liệu request
$customerId = isset($input['customer_id']) ? (int) $input['customer_id'] : 0;
$status = trim($input['status'] ?? '');
$note = trim($input['note'] ?? '');


// 6. Validate dữ liệu
$errors = [];

if ($customerId <= 0) {
    $errors['customer_id'] = 'Vui long truyen ma khach hang';
}

$allowedStatuses = [
    'active',
    'inactive',
    'blocked'
];

if (!in_array($status, $allowedStatuses)) {
    $errors['status'] = 'Trang thai khach hang khong hop le';
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
        sendError('Ban khong co quyen cap nhat trang thai khach hang', 403);
    }


    // 9. Kiểm tra khách hàng tồn tại
    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.phone,
            u.status,
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

    $oldStatus = $customer['status'];


    // 10. Nếu trạng thái không đổi
    if ($oldStatus === $status) {
        sendSuccess('Trang thai khach hang khong thay doi', [
            'customer' => [
                'id' => (int) $customer['id'],
                'full_name' => $customer['full_name'],
                'email' => $customer['email'],
                'old_status' => $oldStatus,
                'new_status' => $status
            ]
        ]);
    }


    // 11. Không cho tự khóa chính mình
    if ((int) $customer['id'] === $userId) {
        sendError('Khong the cap nhat trang thai cua chinh tai khoan dang dang nhap', 403);
    }


    // 12. Bắt đầu transaction
    $conn->beginTransaction();


    // 13. Cập nhật trạng thái khách hàng
    $sql = "
        UPDATE users
        SET
            status = :status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :customer_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':status' => $status,
        ':customer_id' => $customerId
    ]);


    // 14. Nếu khóa/chặn tài khoản thì xóa session đăng nhập của khách nếu có bảng user_sessions
    if ($status !== 'active') {
        try {
            $sql = "
                DELETE FROM user_sessions
                WHERE user_id = :customer_id
            ";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':customer_id' => $customerId
            ]);
        } catch (PDOException $sessionError) {
            // Bỏ qua nếu bảng user_sessions chưa có hoặc khác cấu trúc
        }
    }


    // 15. Ghi log hoạt động nhân viên nếu có bảng staff_activity_logs
    try {
        $description = 'Cap nhat trang thai khach hang ' . $customer['full_name'] . ' tu ' . $oldStatus . ' sang ' . $status;

        if ($note !== '') {
            $description .= '. Ghi chu: ' . $note;
        }

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
                'customer',
                :target_id,
                :description
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':target_id' => $customerId,
            ':description' => $description
        ]);
    } catch (PDOException $logError) {
        // Bỏ qua nếu bảng log khác cấu trúc
    }


    // 16. Lấy lại thông tin khách hàng sau cập nhật
    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.phone,
            u.status,
            u.updated_at,
            COALESCE(cp.membership_level, 'normal') AS membership_level,
            COALESCE(cp.points_balance, 0) AS points_balance
        FROM users u
        LEFT JOIN customer_profiles cp
            ON u.id = cp.user_id
        WHERE u.id = :customer_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':customer_id' => $customerId
    ]);

    $updatedCustomer = $stmt->fetch();


    // 17. Hoàn tất transaction
    $conn->commit();


    // 18. Nhãn hiển thị
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


    // 19. Trả kết quả
    sendSuccess('Admin cap nhat trang thai khach hang thanh cong', [
        'current_user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => [
                'code' => $user['role_code'],
                'name' => $user['role_name']
            ]
        ],

        'customer' => [
            'id' => (int) $updatedCustomer['id'],
            'full_name' => $updatedCustomer['full_name'],
            'email' => $updatedCustomer['email'],
            'phone' => $updatedCustomer['phone'],

            'old_status' => $oldStatus,
            'old_status_label' => $statusLabels[$oldStatus] ?? $oldStatus,

            'new_status' => $updatedCustomer['status'],
            'new_status_label' => $statusLabels[$updatedCustomer['status']] ?? $updatedCustomer['status'],

            'membership_level' => $updatedCustomer['membership_level'],
            'membership_label' => $membershipLabels[$updatedCustomer['membership_level']] ?? $updatedCustomer['membership_level'],

            'points_balance' => (int) $updatedCustomer['points_balance'],
            'updated_at' => $updatedCustomer['updated_at']
        ],

        'note' => $note
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Admin cap nhat trang thai khach hang that bai', 500, [
        'error' => $e->getMessage()
    ]);
}