<?php
// =========================================================
// File: api/admin/staff/update-staff-status.php
// Mục đích: API admin cập nhật trạng thái nhân viên
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
    sendError('Vui long dang nhap de cap nhat trang thai nhan vien', 401);
}

$currentUserId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Hàm lấy danh sách cột của bảng
function getTableColumns($conn, $tableName)
{
    try {
        $stmt = $conn->query("SHOW COLUMNS FROM " . $tableName);
        $columns = $stmt->fetchAll();

        $result = [];

        foreach ($columns as $column) {
            $result[] = $column['Field'];
        }

        return $result;
    } catch (PDOException $e) {
        return [];
    }
}


// 6. Lấy dữ liệu request
$staffId = isset($input['staff_id']) ? (int) $input['staff_id'] : 0;
$status = trim($input['status'] ?? '');
$workStatus = trim($input['work_status'] ?? '');
$note = trim($input['note'] ?? '');


// 7. Validate dữ liệu
$errors = [];

if ($staffId <= 0) {
    $errors['staff_id'] = 'Vui long truyen ma nhan vien';
}

$allowedStatuses = [
    'active',
    'inactive',
    'blocked'
];

if (!in_array($status, $allowedStatuses)) {
    $errors['status'] = 'Trang thai tai khoan khong hop le';
}

$allowedWorkStatuses = [
    'working',
    'on_leave',
    'resigned'
];

if (!in_array($workStatus, $allowedWorkStatuses)) {
    $errors['work_status'] = 'Trang thai lam viec khong hop le';
}

if (!empty($errors)) {
    sendError('Du lieu khong hop le', 422, $errors);
}


// 8. Kết nối database
$conn = getDatabaseConnection();

try {
    // 9. Kiểm tra quyền người đang đăng nhập
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
        WHERE u.id = :current_user_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':current_user_id' => $currentUserId
    ]);

    $currentUser = $stmt->fetch();

    if (!$currentUser) {
        sendError('Khong tim thay nguoi dung dang dang nhap', 404);
    }

    if ($currentUser['status'] !== 'active') {
        sendError('Tai khoan dang bi khoa hoac khong hoat dong', 403);
    }

    $allowedCurrentRoles = ['owner', 'admin'];

    if (!in_array($currentUser['role_code'], $allowedCurrentRoles)) {
        sendError('Ban khong co quyen cap nhat trang thai nhan vien', 403);
    }


    // 10. Lấy thông tin nhân viên cần cập nhật
    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.phone,
            u.status,
            r.code AS role_code,
            r.name AS role_name,
            sp.staff_code,
            sp.position_name,
            sp.department,
            sp.work_status
        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        LEFT JOIN staff_profiles sp
            ON u.id = sp.user_id
        WHERE u.id = :staff_id
        AND r.code IN ('owner', 'admin', 'staff')
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':staff_id' => $staffId
    ]);

    $staff = $stmt->fetch();

    if (!$staff) {
        sendError('Khong tim thay nhan vien', 404);
    }


    // 11. Không cho tự khóa chính mình
    if ((int) $staff['id'] === $currentUserId && $status !== 'active') {
        sendError('Khong the khoa hoac chan chinh tai khoan dang dang nhap', 403);
    }


    // 12. Admin thường không được cập nhật owner
    if ($currentUser['role_code'] !== 'owner' && $staff['role_code'] === 'owner') {
        sendError('Chi owner moi co the cap nhat tai khoan owner', 403);
    }


    // 13. Admin thường không được cập nhật admin khác thành blocked/inactive nếu muốn chặt hơn
    if (
        $currentUser['role_code'] !== 'owner'
        && $staff['role_code'] === 'admin'
        && (int) $staff['id'] !== $currentUserId
    ) {
        sendError('Chi owner moi co the cap nhat tai khoan admin khac', 403);
    }

    $oldStatus = $staff['status'];
    $oldWorkStatus = $staff['work_status'] ?: 'working';


    // 14. Nếu không thay đổi gì
    if ($oldStatus === $status && $oldWorkStatus === $workStatus) {
        sendSuccess('Trang thai nhan vien khong thay doi', [
            'staff' => [
                'id' => (int) $staff['id'],
                'full_name' => $staff['full_name'],
                'email' => $staff['email'],
                'old_status' => $oldStatus,
                'new_status' => $status,
                'old_work_status' => $oldWorkStatus,
                'new_work_status' => $workStatus
            ]
        ]);
    }


    // 15. Bắt đầu transaction
    $conn->beginTransaction();


    // 16. Cập nhật trạng thái tài khoản trong bảng users
    $sql = "
        UPDATE users
        SET
            status = :status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :staff_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':status' => $status,
        ':staff_id' => $staffId
    ]);


    // 17. Cập nhật trạng thái làm việc trong staff_profiles nếu có bảng/cột
    $staffProfileColumns = getTableColumns($conn, 'staff_profiles');

    if (!empty($staffProfileColumns) && in_array('user_id', $staffProfileColumns)) {
        $sql = "
            SELECT id
            FROM staff_profiles
            WHERE user_id = :staff_id
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':staff_id' => $staffId
        ]);

        $staffProfile = $stmt->fetch();

        if ($staffProfile && in_array('work_status', $staffProfileColumns)) {
            $sql = "
                UPDATE staff_profiles
                SET
                    work_status = :work_status
                WHERE user_id = :staff_id
            ";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':work_status' => $workStatus,
                ':staff_id' => $staffId
            ]);
        } elseif (!$staffProfile) {
            $profileFields = ['user_id'];
            $profileValues = [':user_id'];
            $profileParams = [
                ':user_id' => $staffId
            ];

            if (in_array('work_status', $staffProfileColumns)) {
                $profileFields[] = 'work_status';
                $profileValues[] = ':work_status';
                $profileParams[':work_status'] = $workStatus;
            }

            $sql = "
                INSERT INTO staff_profiles (
                    " . implode(', ', $profileFields) . "
                )
                VALUES (
                    " . implode(', ', $profileValues) . "
                )
            ";

            $stmt = $conn->prepare($sql);
            $stmt->execute($profileParams);
        }
    }


    // 18. Nếu khóa/chặn/nghỉ việc thì xóa session đăng nhập của nhân viên nếu có bảng user_sessions
    if ($status !== 'active' || $workStatus === 'resigned') {
        try {
            $sql = "
                DELETE FROM user_sessions
                WHERE user_id = :staff_id
            ";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':staff_id' => $staffId
            ]);
        } catch (PDOException $sessionError) {
            // Bỏ qua nếu bảng user_sessions chưa có hoặc khác cấu trúc
        }
    }


    // 19. Ghi log hoạt động nếu có bảng staff_activity_logs
    try {
        $description = 'Cap nhat trang thai nhan vien ' . $staff['full_name']
            . ' tu account=' . $oldStatus . ', work=' . $oldWorkStatus
            . ' sang account=' . $status . ', work=' . $workStatus;

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
                'staff',
                :target_id,
                :description
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $currentUserId,
            ':target_id' => $staffId,
            ':description' => $description
        ]);
    } catch (PDOException $logError) {
        // Bỏ qua nếu bảng log khác cấu trúc
    }


    // 20. Lấy lại thông tin nhân viên sau cập nhật
    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.phone,
            u.avatar,
            u.gender,
            u.date_of_birth,
            u.status,
            u.created_at,
            u.updated_at,

            r.code AS role_code,
            r.name AS role_name,

            sp.staff_code,
            sp.position_name,
            sp.department,
            sp.work_status

        FROM users u

        JOIN roles r
            ON u.role_id = r.id

        LEFT JOIN staff_profiles sp
            ON u.id = sp.user_id

        WHERE u.id = :staff_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':staff_id' => $staffId
    ]);

    $updatedStaff = $stmt->fetch();


    // 21. Hoàn tất transaction
    $conn->commit();


    // 22. Nhãn hiển thị
    $roleLabels = [
        'owner' => 'Chủ cửa hàng',
        'admin' => 'Quản trị viên',
        'staff' => 'Nhân viên'
    ];

    $statusLabels = [
        'active' => 'Đang hoạt động',
        'inactive' => 'Tạm khóa',
        'blocked' => 'Bị chặn'
    ];

    $workStatusLabels = [
        'working' => 'Đang làm việc',
        'on_leave' => 'Đang nghỉ phép',
        'resigned' => 'Đã nghỉ việc'
    ];

    $genderLabels = [
        'male' => 'Nam',
        'female' => 'Nữ',
        'other' => 'Khác'
    ];


    // 23. Trả kết quả
    sendSuccess('Admin cap nhat trang thai nhan vien thanh cong', [
        'current_user' => [
            'id' => (int) $currentUser['id'],
            'full_name' => $currentUser['full_name'],
            'email' => $currentUser['email'],
            'role' => [
                'code' => $currentUser['role_code'],
                'name' => $currentUser['role_name']
            ]
        ],

        'staff' => [
            'id' => (int) $updatedStaff['id'],
            'full_name' => $updatedStaff['full_name'],
            'email' => $updatedStaff['email'],
            'phone' => $updatedStaff['phone'],
            'avatar' => $updatedStaff['avatar'],

            'gender' => $updatedStaff['gender'],
            'gender_label' => $genderLabels[$updatedStaff['gender']] ?? $updatedStaff['gender'],

            'date_of_birth' => $updatedStaff['date_of_birth'],

            'role' => [
                'code' => $updatedStaff['role_code'],
                'name' => $updatedStaff['role_name'],
                'label' => $roleLabels[$updatedStaff['role_code']] ?? $updatedStaff['role_name']
            ],

            'old_status' => $oldStatus,
            'old_status_label' => $statusLabels[$oldStatus] ?? $oldStatus,

            'new_status' => $updatedStaff['status'],
            'new_status_label' => $statusLabels[$updatedStaff['status']] ?? $updatedStaff['status'],

            'old_work_status' => $oldWorkStatus,
            'old_work_status_label' => $workStatusLabels[$oldWorkStatus] ?? $oldWorkStatus,

            'new_work_status' => $updatedStaff['work_status'] ?: 'working',
            'new_work_status_label' => $workStatusLabels[$updatedStaff['work_status'] ?: 'working'] ?? ($updatedStaff['work_status'] ?: 'working'),

            'staff_profile' => [
                'staff_code' => $updatedStaff['staff_code'],
                'position_name' => $updatedStaff['position_name'],
                'department' => $updatedStaff['department'],
                'work_status' => $updatedStaff['work_status'] ?: 'working'
            ],

            'updated_at' => $updatedStaff['updated_at']
        ],

        'note' => $note
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Admin cap nhat trang thai nhan vien that bai', 500, [
        'error' => $e->getMessage()
    ]);
}