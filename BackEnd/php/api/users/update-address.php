<?php
// =========================================================
// File: api/users/update-address.php
// Mục đích: API cập nhật địa chỉ giao hàng
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
    sendError('Vui long dang nhap de cap nhat dia chi giao hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy dữ liệu request
$addressId = isset($input['address_id']) ? (int) $input['address_id'] : 0;

$receiverName = trim($input['receiver_name'] ?? '');
$receiverPhone = trim($input['receiver_phone'] ?? '');

$province = trim($input['province'] ?? '');
$district = trim($input['district'] ?? '');
$ward = trim($input['ward'] ?? '');
$addressDetail = trim($input['address_detail'] ?? '');

$isDefault = isset($input['is_default']) ? (int) $input['is_default'] : 0;


// 6. Validate dữ liệu
$errors = [];

if ($addressId <= 0) {
    $errors['address_id'] = 'Vui long truyen ma dia chi';
}

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


    // 9. Kiểm tra địa chỉ có thuộc user hiện tại không
    $sql = "
        SELECT
            id,
            user_id,
            is_default
        FROM user_addresses
        WHERE id = :address_id_check
        AND user_id = :user_id_check
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':address_id_check' => $addressId,
        ':user_id_check' => $userId
    ]);

    $currentAddress = $stmt->fetch();

    if (!$currentAddress) {
        sendError('Khong tim thay dia chi giao hang', 404);
    }


    // 10. Bắt đầu transaction
    $conn->beginTransaction();


    // 11. Nếu đặt làm mặc định thì bỏ mặc định các địa chỉ khác
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


    // 12. Cập nhật địa chỉ
    $sql = "
        UPDATE user_addresses
        SET
            receiver_name = :receiver_name_update,
            receiver_phone = :receiver_phone_update,
            province = :province_update,
            district = :district_update,
            ward = :ward_update,
            address_detail = :address_detail_update,
            is_default = :is_default_update,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :address_id_update
        AND user_id = :user_id_update
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':receiver_name_update' => $receiverName,
        ':receiver_phone_update' => $receiverPhone,
        ':province_update' => $province,
        ':district_update' => $district,
        ':ward_update' => $ward,
        ':address_detail_update' => $addressDetail,
        ':is_default_update' => $isDefault,
        ':address_id_update' => $addressId,
        ':user_id_update' => $userId
    ]);


    // 13. Lấy lại địa chỉ sau khi cập nhật
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
        WHERE id = :address_id_select
        AND user_id = :user_id_select
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':address_id_select' => $addressId,
        ':user_id_select' => $userId
    ]);

    $address = $stmt->fetch();


    // 14. Hoàn tất transaction
    $conn->commit();


    // 15. Format dữ liệu trả về
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


    // 16. Trả kết quả
    sendSuccess('Cap nhat dia chi giao hang thanh cong', [
        'address' => $formattedAddress
    ]);

} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Cap nhat dia chi giao hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}