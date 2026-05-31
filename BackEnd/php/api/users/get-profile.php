<?php
// =========================================================
// File: api/users/get-profile.php
// Mục đích: API lấy thông tin tài khoản đang đăng nhập
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
    sendError('Vui long dang nhap de xem thong tin tai khoan', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Kết nối database
$conn = getDatabaseConnection();

try {
    // 5. Lấy thông tin user
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
            cp.total_spent,
            cp.note AS customer_note,

            sp.staff_code,
            sp.position_name,
            sp.department,
            sp.start_date,
            sp.end_date,
            sp.work_status,
            sp.note AS staff_note

        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        LEFT JOIN customer_profiles cp
            ON u.id = cp.user_id
        LEFT JOIN staff_profiles sp
            ON u.id = sp.user_id
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


    // 6. Lấy địa chỉ mặc định nếu có
    $sql = "
        SELECT
            id,
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
        AND is_default = 1
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_address' => $userId
    ]);

    $defaultAddress = $stmt->fetch();


    // 7. Đếm tổng số địa chỉ của user
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


    // 8. Format địa chỉ mặc định
    $formattedDefaultAddress = null;

    if ($defaultAddress) {
        $formattedDefaultAddress = [
            'id' => (int) $defaultAddress['id'],
            'receiver_name' => $defaultAddress['receiver_name'],
            'receiver_phone' => $defaultAddress['receiver_phone'],
            'province' => $defaultAddress['province'],
            'district' => $defaultAddress['district'],
            'ward' => $defaultAddress['ward'],
            'address_detail' => $defaultAddress['address_detail'],
            'is_default' => (int) $defaultAddress['is_default'],
            'created_at' => $defaultAddress['created_at'],
            'updated_at' => $defaultAddress['updated_at']
        ];
    }


    // 9. Format dữ liệu user
    $userData = [
        'id' => (int) $user['id'],

        'role' => [
            'id' => (int) $user['role_id'],
            'name' => $user['role_name'],
            'code' => $user['role_code']
        ],

        'full_name' => $user['full_name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'avatar' => $user['avatar'],
        'gender' => $user['gender'],
        'date_of_birth' => $user['date_of_birth'],
        'status' => $user['status'],

        'last_login_at' => $user['last_login_at'],
        'created_at' => $user['created_at'],
        'updated_at' => $user['updated_at'],

        'default_address' => $formattedDefaultAddress,
        'total_addresses' => $totalAddresses
    ];


    // 10. Nếu là khách hàng thì trả thêm customer profile
    if ($user['role_code'] === 'customer') {
        $userData['customer_profile'] = [
            'membership_level' => $user['membership_level'],
            'points_balance' => (int) ($user['points_balance'] ?? 0),
            'total_orders' => (int) ($user['total_orders'] ?? 0),
            'total_spent' => (float) ($user['total_spent'] ?? 0),
            'note' => $user['customer_note']
        ];
    }


    // 11. Nếu là nhân viên/admin/owner thì trả thêm staff profile
    if (in_array($user['role_code'], ['staff', 'admin', 'owner'])) {
        $userData['staff_profile'] = [
            'staff_code' => $user['staff_code'],
            'position_name' => $user['position_name'],
            'department' => $user['department'],
            'start_date' => $user['start_date'],
            'end_date' => $user['end_date'],
            'work_status' => $user['work_status'],
            'note' => $user['staff_note']
        ];
    }


    // 12. Trả kết quả
    sendSuccess('Lay thong tin tai khoan thanh cong', [
        'user' => $userData
    ]);

} catch (PDOException $e) {
    sendError('Lay thong tin tai khoan that bai', 500, [
        'database' => $e->getMessage()
    ]);
}