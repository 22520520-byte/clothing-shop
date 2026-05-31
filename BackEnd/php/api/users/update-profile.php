<?php
// =========================================================
// File: api/users/update-profile.php
// Mục đích: API cập nhật thông tin tài khoản đang đăng nhập
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
    sendError('Vui long dang nhap de cap nhat thong tin tai khoan', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Kết nối database
$conn = getDatabaseConnection();

try {
    // 6. Lấy thông tin user hiện tại
    $sql = "
        SELECT
            id,
            full_name,
            email,
            phone,
            avatar,
            gender,
            date_of_birth,
            status
        FROM users
        WHERE id = :user_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId
    ]);

    $currentUser = $stmt->fetch();

    if (!$currentUser) {
        sendError('Khong tim thay nguoi dung', 404);
    }

    if ($currentUser['status'] !== 'active') {
        sendError('Tai khoan dang bi khoa hoac khong hoat dong', 403);
    }


    // 7. Lấy dữ liệu mới, nếu không gửi thì giữ dữ liệu cũ
    $fullName = trim($input['full_name'] ?? $currentUser['full_name']);
    $email = trim($input['email'] ?? $currentUser['email']);
    $phone = trim($input['phone'] ?? $currentUser['phone']);
    $avatar = trim($input['avatar'] ?? $currentUser['avatar']);
    $gender = trim($input['gender'] ?? $currentUser['gender']);
    $dateOfBirth = trim($input['date_of_birth'] ?? ($currentUser['date_of_birth'] ?? ''));


    // 8. Validate dữ liệu
    $errors = [];

    if ($fullName === '') {
        $errors['full_name'] = 'Vui long nhap ho ten';
    }

    if ($email === '') {
        $errors['email'] = 'Vui long nhap email';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Email khong hop le';
    }

    if ($phone === '') {
        $errors['phone'] = 'Vui long nhap so dien thoai';
    } elseif (!preg_match('/^[0-9]{9,11}$/', $phone)) {
        $errors['phone'] = 'So dien thoai khong hop le';
    }

    $allowedGenders = ['male', 'female', 'other'];

    if ($gender !== '' && !in_array($gender, $allowedGenders)) {
        $errors['gender'] = 'Gioi tinh khong hop le';
    }

    if ($dateOfBirth !== '') {
        $date = DateTime::createFromFormat('Y-m-d', $dateOfBirth);

        if (!$date || $date->format('Y-m-d') !== $dateOfBirth) {
            $errors['date_of_birth'] = 'Ngay sinh khong hop le';
        }
    } else {
        $dateOfBirth = null;
    }

    if (!empty($errors)) {
        sendError('Du lieu khong hop le', 422, $errors);
    }


    // 9. Kiểm tra email có bị trùng user khác không
    $sql = "
        SELECT id
        FROM users
        WHERE email = :email_check
        AND id != :user_id_email
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':email_check' => $email,
        ':user_id_email' => $userId
    ]);

    if ($stmt->fetch()) {
        sendError('Email da duoc su dung boi tai khoan khac', 409, [
            'email' => 'Email da ton tai'
        ]);
    }


    // 10. Kiểm tra số điện thoại có bị trùng user khác không
    $sql = "
        SELECT id
        FROM users
        WHERE phone = :phone_check
        AND id != :user_id_phone
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':phone_check' => $phone,
        ':user_id_phone' => $userId
    ]);

    if ($stmt->fetch()) {
        sendError('So dien thoai da duoc su dung boi tai khoan khac', 409, [
            'phone' => 'So dien thoai da ton tai'
        ]);
    }


    // 11. Cập nhật thông tin user
    $sql = "
        UPDATE users
        SET
            full_name = :full_name_update,
            email = :email_update,
            phone = :phone_update,
            avatar = :avatar_update,
            gender = :gender_update,
            date_of_birth = :date_of_birth_update,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :user_id_update
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':full_name_update' => $fullName,
        ':email_update' => $email,
        ':phone_update' => $phone,
        ':avatar_update' => $avatar !== '' ? $avatar : null,
        ':gender_update' => $gender !== '' ? $gender : null,
        ':date_of_birth_update' => $dateOfBirth,
        ':user_id_update' => $userId
    ]);


    // 12. Lấy lại thông tin sau khi cập nhật
    $sql = "
        SELECT
            u.id,
            u.role_id,
            r.name AS role_name,
            r.code AS role_code,

            u.full_name,
            u.email,
            u.phone,
            u.avatar,
            u.gender,
            u.date_of_birth,
            u.status,
            u.last_login_at,
            u.created_at,
            u.updated_at,

            cp.membership_level,
            cp.points_balance,
            cp.total_orders,
            cp.total_spent

        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        LEFT JOIN customer_profiles cp
            ON u.id = cp.user_id
        WHERE u.id = :user_id_select
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_select' => $userId
    ]);

    $updatedUser = $stmt->fetch();


    // 13. Cập nhật session
    $_SESSION['full_name'] = $updatedUser['full_name'];
    $_SESSION['email'] = $updatedUser['email'];


    // 14. Format dữ liệu trả về
    $userData = [
        'id' => (int) $updatedUser['id'],

        'role' => [
            'id' => (int) $updatedUser['role_id'],
            'name' => $updatedUser['role_name'],
            'code' => $updatedUser['role_code']
        ],

        'full_name' => $updatedUser['full_name'],
        'email' => $updatedUser['email'],
        'phone' => $updatedUser['phone'],
        'avatar' => $updatedUser['avatar'],
        'gender' => $updatedUser['gender'],
        'date_of_birth' => $updatedUser['date_of_birth'],
        'status' => $updatedUser['status'],

        'last_login_at' => $updatedUser['last_login_at'],
        'created_at' => $updatedUser['created_at'],
        'updated_at' => $updatedUser['updated_at']
    ];


    // 15. Nếu là khách hàng thì trả thêm customer profile
    if ($updatedUser['role_code'] === 'customer') {
        $userData['customer_profile'] = [
            'membership_level' => $updatedUser['membership_level'],
            'points_balance' => (int) ($updatedUser['points_balance'] ?? 0),
            'total_orders' => (int) ($updatedUser['total_orders'] ?? 0),
            'total_spent' => (float) ($updatedUser['total_spent'] ?? 0)
        ];
    }


    // 16. Trả kết quả
    sendSuccess('Cap nhat thong tin tai khoan thanh cong', [
        'user' => $userData
    ]);

} catch (PDOException $e) {
    sendError('Cap nhat thong tin tai khoan that bai', 500, [
        'database' => $e->getMessage()
    ]);
}