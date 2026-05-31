<?php
// =========================================================
// File: api/auth/login.php
// Mục đích: API đăng nhập tài khoản
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


// 3. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 4. Lấy dữ liệu từ request
$account = trim($input['account'] ?? $input['email'] ?? $input['phone'] ?? '');
$password = trim($input['password'] ?? '');


// 5. Validate dữ liệu
$errors = [];

if ($account === '') {
    $errors['account'] = 'Vui long nhap email hoac so dien thoai';
}

if ($password === '') {
    $errors['password'] = 'Vui long nhap mat khau';
}

if (!empty($errors)) {
    sendError('Du lieu khong hop le', 422, $errors);
}


// 6. Kết nối database
$conn = getDatabaseConnection();

try {
    // 7. Tìm tài khoản theo email hoặc số điện thoại
    // Lưu ý: không dùng trùng :account 2 lần để tránh lỗi SQLSTATE[HY093]
    $sql = "
        SELECT
            u.id,
            u.role_id,
            r.name AS role_name,
            r.code AS role_code,
            u.full_name,
            u.email,
            u.phone,
            u.password_hash,
            u.avatar,
            u.gender,
            u.date_of_birth,
            u.status,
            cp.membership_level,
            cp.points_balance,
            sp.staff_code,
            sp.position_name,
            sp.department,
            sp.work_status
        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        LEFT JOIN customer_profiles cp
            ON u.id = cp.user_id
        LEFT JOIN staff_profiles sp
            ON u.id = sp.user_id
        WHERE u.email = :email
        OR u.phone = :phone
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':email' => $account,
        ':phone' => $account
    ]);

    $user = $stmt->fetch();

    if (!$user) {
        sendError('Tai khoan hoac mat khau khong dung', 401);
    }


    // 8. Kiểm tra trạng thái tài khoản
    if ($user['status'] !== 'active') {
        sendError('Tai khoan dang bi khoa hoac chua duoc kich hoat', 403);
    }


    // 9. Kiểm tra mật khẩu
    if (!password_verify($password, $user['password_hash'])) {
        sendError('Tai khoan hoac mat khau khong dung', 401);
    }


    // 10. Lấy danh sách quyền của role
    $sql = "
        SELECT
            p.code
        FROM role_permissions rp
        JOIN permissions p
            ON rp.permission_id = p.id
        WHERE rp.role_id = :role_id
        AND p.status = 'active'
        ORDER BY p.module, p.code
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':role_id' => $user['role_id']
    ]);

    $permissions = $stmt->fetchAll(PDO::FETCH_COLUMN);


    // 11. Lưu thông tin vào PHP session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role_code'] = $user['role_code'];
    $_SESSION['full_name'] = $user['full_name'];
    $_SESSION['email'] = $user['email'];


    // 12. Cập nhật thời gian đăng nhập gần nhất
    $sql = "
        UPDATE users
        SET last_login_at = NOW()
        WHERE id = :user_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $user['id']
    ]);


    // 13. Ghi session vào bảng user_sessions
    $sessionTokenHash = hash('sha256', session_id());
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
    $deviceName = 'Web browser';

    $sql = "
        INSERT INTO user_sessions (
            user_id,
            session_token_hash,
            ip_address,
            user_agent,
            device_name,
            expires_at,
            revoked_at
        )
        VALUES (
            :user_id,
            :session_token_hash,
            :ip_address,
            :user_agent,
            :device_name,
            DATE_ADD(NOW(), INTERVAL 7 DAY),
            NULL
        )
        ON DUPLICATE KEY UPDATE
            user_id = VALUES(user_id),
            ip_address = VALUES(ip_address),
            user_agent = VALUES(user_agent),
            device_name = VALUES(device_name),
            expires_at = VALUES(expires_at),
            revoked_at = NULL,
            updated_at = CURRENT_TIMESTAMP
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $user['id'],
        ':session_token_hash' => $sessionTokenHash,
        ':ip_address' => $ipAddress,
        ':user_agent' => $userAgent,
        ':device_name' => $deviceName
    ]);


    // 14. Chuẩn bị dữ liệu user trả về
    $userData = [
        'id' => (int) $user['id'],
        'full_name' => $user['full_name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'avatar' => $user['avatar'],
        'gender' => $user['gender'],
        'date_of_birth' => $user['date_of_birth'],
        'status' => $user['status'],
        'role' => [
            'id' => (int) $user['role_id'],
            'name' => $user['role_name'],
            'code' => $user['role_code']
        ],
        'permissions' => $permissions
    ];


    // 15. Nếu là khách hàng thì trả thêm thông tin customer profile
    if ($user['role_code'] === 'customer') {
        $userData['customer_profile'] = [
            'membership_level' => $user['membership_level'],
            'points_balance' => (int) ($user['points_balance'] ?? 0)
        ];
    }


    // 16. Nếu là nhân viên/admin/owner thì trả thêm thông tin staff profile
    if (in_array($user['role_code'], ['staff', 'admin', 'owner'])) {
        $userData['staff_profile'] = [
            'staff_code' => $user['staff_code'],
            'position_name' => $user['position_name'],
            'department' => $user['department'],
            'work_status' => $user['work_status']
        ];
    }


    // 17. Trả kết quả
    sendSuccess('Dang nhap thanh cong', [
        'user' => $userData
    ]);

} catch (PDOException $e) {
    sendError('Dang nhap that bai', 500, [
        'database' => $e->getMessage()
    ]);
}