<?php
// =========================================================
// File: api/auth/register.php
// Mục đích: API đăng ký tài khoản khách hàng
// Method: POST
// =========================================================

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
$fullName = trim($input['full_name'] ?? $input['fullName'] ?? $input['name'] ?? '');
$email = trim($input['email'] ?? '');
$phone = trim($input['phone'] ?? '');
$password = trim($input['password'] ?? '');
$confirmPassword = trim($input['confirm_password'] ?? $input['confirmPassword'] ?? '');


// 5. Validate dữ liệu cơ bản
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

if ($password === '') {
    $errors['password'] = 'Vui long nhap mat khau';
} elseif (strlen($password) < 6) {
    $errors['password'] = 'Mat khau phai co it nhat 6 ky tu';
}

if ($confirmPassword !== '' && $password !== $confirmPassword) {
    $errors['confirm_password'] = 'Mat khau xac nhan khong khop';
}

if (!empty($errors)) {
    sendError('Du lieu khong hop le', 422, $errors);
}


// 6. Kết nối database
$conn = getDatabaseConnection();

try {
    // 7. Kiểm tra email đã tồn tại chưa
    $sql = "
        SELECT id
        FROM users
        WHERE email = :email
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':email' => $email
    ]);

    if ($stmt->fetch()) {
        sendError('Email da duoc su dung', 409, [
            'email' => 'Email da ton tai trong he thong'
        ]);
    }


    // 8. Kiểm tra số điện thoại đã tồn tại chưa
    $sql = "
        SELECT id
        FROM users
        WHERE phone = :phone
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':phone' => $phone
    ]);

    if ($stmt->fetch()) {
        sendError('So dien thoai da duoc su dung', 409, [
            'phone' => 'So dien thoai da ton tai trong he thong'
        ]);
    }


    // 9. Lấy role customer
    $sql = "
        SELECT id
        FROM roles
        WHERE code = 'customer'
        AND status = 'active'
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $role = $stmt->fetch();

    if (!$role) {
        sendError('Khong tim thay vai tro khach hang', 500);
    }


    // 10. Mã hóa mật khẩu
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);


    // 11. Bắt đầu transaction
    $conn->beginTransaction();


    // 12. Thêm tài khoản vào bảng users
    $sql = "
        INSERT INTO users (
            role_id,
            full_name,
            email,
            phone,
            password_hash,
            avatar,
            gender,
            date_of_birth,
            status
        )
        VALUES (
            :role_id,
            :full_name,
            :email,
            :phone,
            :password_hash,
            NULL,
            'other',
            NULL,
            'active'
        )
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':role_id' => $role['id'],
        ':full_name' => $fullName,
        ':email' => $email,
        ':phone' => $phone,
        ':password_hash' => $passwordHash
    ]);

    $userId = $conn->lastInsertId();


    // 13. Tạo profile khách hàng
    $sql = "
        INSERT INTO customer_profiles (
            user_id,
            membership_level,
            points_balance,
            total_orders,
            total_spent,
            note
        )
        VALUES (
            :user_id,
            'normal',
            0,
            0,
            0,
            NULL
        )
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId
    ]);


    // 14. Hoàn tất transaction
    $conn->commit();


    // 15. Trả kết quả
    sendSuccess('Dang ky tai khoan thanh cong', [
        'user' => [
            'id' => (int) $userId,
            'full_name' => $fullName,
            'email' => $email,
            'phone' => $phone,
            'role' => 'customer',
            'status' => 'active'
        ]
    ], 201);

} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Dang ky tai khoan that bai', 500, [
        'database' => $e->getMessage()
    ]);
}