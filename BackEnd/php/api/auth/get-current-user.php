<?php
// =========================================================
// File: api/auth/get-current-user.php
// Mục đích: Lấy thông tin người dùng đang đăng nhập
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


// 3. Kiểm tra session đăng nhập
if (empty($_SESSION['user_id'])) {
    sendError('Nguoi dung chua dang nhap', 401);
}

$userId = $_SESSION['user_id'];


// 4. Kết nối database
$conn = getDatabaseConnection();

try {
    // 5. Lấy thông tin user hiện tại
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

            cp.membership_level,
            cp.points_balance,
            cp.total_orders,
            cp.total_spent,

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
        WHERE u.id = :user_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId
    ]);

    $user = $stmt->fetch();

    if (!$user) {
        session_unset();
        session_destroy();

        sendError('Khong tim thay nguoi dung', 404);
    }


    // 6. Kiểm tra trạng thái tài khoản
    if ($user['status'] !== 'active') {
        session_unset();
        session_destroy();

        sendError('Tai khoan dang bi khoa hoac chua duoc kich hoat', 403);
    }


    // 7. Lấy danh sách quyền của role
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


    // 8. Chuẩn bị dữ liệu trả về
    $userData = [
        'id' => (int) $user['id'],
        'full_name' => $user['full_name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'avatar' => $user['avatar'],
        'gender' => $user['gender'],
        'date_of_birth' => $user['date_of_birth'],
        'status' => $user['status'],
        'last_login_at' => $user['last_login_at'],

        'role' => [
            'id' => (int) $user['role_id'],
            'name' => $user['role_name'],
            'code' => $user['role_code']
        ],

        'permissions' => $permissions
    ];


    // 9. Nếu là khách hàng thì trả thêm customer profile
    if ($user['role_code'] === 'customer') {
        $userData['customer_profile'] = [
            'membership_level' => $user['membership_level'],
            'points_balance' => (int) ($user['points_balance'] ?? 0),
            'total_orders' => (int) ($user['total_orders'] ?? 0),
            'total_spent' => (float) ($user['total_spent'] ?? 0)
        ];
    }


    // 10. Nếu là nhân viên/admin/owner thì trả thêm staff profile
    if (in_array($user['role_code'], ['staff', 'admin', 'owner'])) {
        $userData['staff_profile'] = [
            'staff_code' => $user['staff_code'],
            'position_name' => $user['position_name'],
            'department' => $user['department'],
            'work_status' => $user['work_status']
        ];
    }


    // 11. Trả kết quả
    sendSuccess('Lay thong tin nguoi dung thanh cong', [
        'user' => $userData
    ]);

} catch (PDOException $e) {
    sendError('Lay thong tin nguoi dung that bai', 500, [
        'database' => $e->getMessage()
    ]);
}