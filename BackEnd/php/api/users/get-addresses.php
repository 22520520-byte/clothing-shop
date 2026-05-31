<?php
// =========================================================
// File: api/users/get-addresses.php
// Mục đích: API lấy danh sách địa chỉ giao hàng của user
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
    sendError('Vui long dang nhap de xem dia chi giao hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Kết nối database
$conn = getDatabaseConnection();

try {
    // 5. Kiểm tra user
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


    // 6. Lấy danh sách địa chỉ giao hàng
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
        WHERE user_id = :user_id_address
        ORDER BY is_default DESC, id DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_address' => $userId
    ]);

    $addresses = $stmt->fetchAll();


    // 7. Format dữ liệu địa chỉ
    $formattedAddresses = array_map(function ($address) {
        $fullAddressParts = array_filter([
            $address['address_detail'],
            $address['ward'],
            $address['district'],
            $address['province']
        ]);

        return [
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
    }, $addresses);


    // 8. Lấy địa chỉ mặc định
    $defaultAddress = null;

    foreach ($formattedAddresses as $address) {
        if ((int) $address['is_default'] === 1) {
            $defaultAddress = $address;
            break;
        }
    }


    // 9. Trả kết quả
    sendSuccess('Lay danh sach dia chi thanh cong', [
        'user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email']
        ],
        'addresses' => $formattedAddresses,
        'default_address' => $defaultAddress,
        'summary' => [
            'total_addresses' => count($formattedAddresses),
            'has_default_address' => $defaultAddress !== null
        ]
    ]);

} catch (PDOException $e) {
    sendError('Lay danh sach dia chi that bai', 500, [
        'database' => $e->getMessage()
    ]);
}