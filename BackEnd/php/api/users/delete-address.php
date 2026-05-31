<?php
// =========================================================
// File: api/users/delete-address.php
// Mục đích: API xóa địa chỉ giao hàng
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
    sendError('Vui long dang nhap de xoa dia chi giao hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy dữ liệu request
$addressId = isset($input['address_id']) ? (int) $input['address_id'] : 0;


// 6. Validate dữ liệu
if ($addressId <= 0) {
    sendError('Vui long truyen ma dia chi', 422, [
        'address_id' => 'Address ID khong hop le'
    ]);
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
            receiver_name,
            receiver_phone,
            province,
            district,
            ward,
            address_detail,
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

    $address = $stmt->fetch();

    if (!$address) {
        sendError('Khong tim thay dia chi giao hang', 404);
    }


    // 10. Bắt đầu transaction
    $conn->beginTransaction();


    // 11. Xóa địa chỉ
    $sql = "
        DELETE FROM user_addresses
        WHERE id = :address_id_delete
        AND user_id = :user_id_delete
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':address_id_delete' => $addressId,
        ':user_id_delete' => $userId
    ]);


    // 12. Nếu địa chỉ bị xóa là mặc định thì đặt địa chỉ mới làm mặc định
    $newDefaultAddress = null;

    if ((int) $address['is_default'] === 1) {
        $sql = "
            SELECT
                id
            FROM user_addresses
            WHERE user_id = :user_id_find_default
            ORDER BY id DESC
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id_find_default' => $userId
        ]);

        $nextAddress = $stmt->fetch();

        if ($nextAddress) {
            $sql = "
                UPDATE user_addresses
                SET
                    is_default = 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :new_default_address_id
                AND user_id = :user_id_new_default
            ";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':new_default_address_id' => (int) $nextAddress['id'],
                ':user_id_new_default' => $userId
            ]);

            $newDefaultAddress = (int) $nextAddress['id'];
        }
    }


    // 13. Đếm lại số địa chỉ còn lại
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


    // 14. Hoàn tất transaction
    $conn->commit();


    // 15. Format địa chỉ đã xóa
    $fullAddressParts = array_filter([
        $address['address_detail'],
        $address['ward'],
        $address['district'],
        $address['province']
    ]);

    $deletedAddress = [
        'id' => (int) $address['id'],
        'receiver_name' => $address['receiver_name'],
        'receiver_phone' => $address['receiver_phone'],
        'province' => $address['province'],
        'district' => $address['district'],
        'ward' => $address['ward'],
        'address_detail' => $address['address_detail'],
        'full_address' => implode(', ', $fullAddressParts),
        'was_default' => (int) $address['is_default']
    ];


    // 16. Trả kết quả
    sendSuccess('Xoa dia chi giao hang thanh cong', [
        'deleted_address' => $deletedAddress,
        'summary' => [
            'total_addresses' => $totalAddresses,
            'new_default_address_id' => $newDefaultAddress
        ]
    ]);

} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Xoa dia chi giao hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}