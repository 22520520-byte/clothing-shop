<?php
// =========================================================
// File: api/users/add-address.php
// Mục đích: API thêm địa chỉ giao hàng
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
    sendError('Vui long dang nhap de them dia chi giao hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy dữ liệu request
$receiverName = trim($input['receiver_name'] ?? '');
$receiverPhone = trim($input['receiver_phone'] ?? '');

$province = trim($input['province'] ?? '');
$district = trim($input['district'] ?? '');
$ward = trim($input['ward'] ?? '');
$addressDetail = trim($input['address_detail'] ?? '');

$isDefault = isset($input['is_default']) ? (int) $input['is_default'] : 0;


// 6. Validate dữ liệu
$errors = [];

if ($receiverName === '') {
    $errors['receiver_name'] = 'Vui long nhap ten nguoi nhan';
}

if ($receiverPhone === '') {
    $errors['receiver_phone'] = 'Vui long nhap so dien thoai nguoi nhan';
} elseif (!preg_match('/^[0-9]{9,11}$/', $receiverPhone)) {
    $errors['receiver_phone'] = 'So dien thoai nguoi nhan khong hop le';
}

if ($province === '') {
    $errors['province'] = 'Vui long nhap tinh/thanh pho';
}

if ($district === '') {
    $errors['district'] = 'Vui long nhap quan/huyen';
}

if ($ward === '') {
    $errors['ward'] = 'Vui long nhap phuong/xa';
}

if ($addressDetail === '') {
    $errors['address_detail'] = 'Vui long nhap dia chi cu the';
}

if (!in_array($isDefault, [0, 1])) {
    $errors['is_default'] = 'Gia tri dia chi mac dinh khong hop le';
}

if (!empty($errors)) {
    sendError('Du lieu khong hop le', 422, $errors);
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


    // 9. Đếm số địa chỉ hiện tại
    $sql = "
        SELECT COUNT(*) AS total_addresses
        FROM user_addresses
        WHERE user_id = :user_id_count
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_count' => $userId
    ]);

    $totalAddresses = (int) $stmt->fetch()['total_addresses'];


    // 10. Nếu là địa chỉ đầu tiên thì tự động làm mặc định
    if ($totalAddresses === 0) {
        $isDefault = 1;
    }


    // 11. Bắt đầu transaction
    $conn->beginTransaction();


    // 12. Nếu địa chỉ mới là mặc định thì bỏ mặc định các địa chỉ cũ
    if ($isDefault === 1) {
        $sql = "
            UPDATE user_addresses
            SET
                is_default = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = :user_id_clear_default
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id_clear_default' => $userId
        ]);
    }


    // 13. Thêm địa chỉ mới
    $sql = "
        INSERT INTO user_addresses (
            user_id,
            receiver_name,
            receiver_phone,
            province,
            district,
            ward,
            address_detail,
            is_default
        )
        VALUES (
            :user_id_insert,
            :receiver_name,
            :receiver_phone,
            :province,
            :district,
            :ward,
            :address_detail,
            :is_default
        )
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_insert' => $userId,
        ':receiver_name' => $receiverName,
        ':receiver_phone' => $receiverPhone,
        ':province' => $province,
        ':district' => $district,
        ':ward' => $ward,
        ':address_detail' => $addressDetail,
        ':is_default' => $isDefault
    ]);

    $addressId = (int) $conn->lastInsertId();


    // 14. Lấy lại địa chỉ vừa thêm
    $sql = "
        SELECT
            id,
            user_id,
            receiver_name,
            receiver_phone,
            province,
            district,
            ward,
            address_detail,
            is_default,
            created_at,
            updated_at
        FROM user_addresses
        WHERE id = :address_id
        AND user_id = :user_id_select
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':address_id' => $addressId,
        ':user_id_select' => $userId
    ]);

    $address = $stmt->fetch();


    // 15. Hoàn tất transaction
    $conn->commit();


    // 16. Format địa chỉ
    $fullAddressParts = array_filter([
        $address['address_detail'],
        $address['ward'],
        $address['district'],
        $address['province']
    ]);

    $formattedAddress = [
        'id' => (int) $address['id'],
        'user_id' => (int) $address['user_id'],

        'receiver_name' => $address['receiver_name'],
        'receiver_phone' => $address['receiver_phone'],

        'province' => $address['province'],
        'district' => $address['district'],
        'ward' => $address['ward'],
        'address_detail' => $address['address_detail'],
        'full_address' => implode(', ', $fullAddressParts),

        'is_default' => (int) $address['is_default'],

        'created_at' => $address['created_at'],
        'updated_at' => $address['updated_at']
    ];


    // 17. Trả kết quả
    sendSuccess('Them dia chi giao hang thanh cong', [
        'address' => $formattedAddress
    ], 201);

} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Them dia chi giao hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}