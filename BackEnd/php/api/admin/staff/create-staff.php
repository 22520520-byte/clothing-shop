<?php
// =========================================================
// File: api/admin/staff/create-staff.php
// Mục đích: API admin thêm nhân viên mới
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
    sendError('Vui long dang nhap de them nhan vien', 401);
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
$fullName = trim($input['full_name'] ?? '');
$email = trim($input['email'] ?? '');
$phone = trim($input['phone'] ?? '');
$password = trim($input['password'] ?? '');

$gender = trim($input['gender'] ?? 'other');
$dateOfBirth = trim($input['date_of_birth'] ?? '');

$roleCode = trim($input['role_code'] ?? 'staff');

$staffCode = strtoupper(trim($input['staff_code'] ?? ''));
$positionName = trim($input['position_name'] ?? '');
$department = trim($input['department'] ?? '');
$workStatus = trim($input['work_status'] ?? 'working');

$status = trim($input['status'] ?? 'active');


// 7. Tự tạo mã nhân viên nếu chưa nhập
if ($staffCode === '') {
    $staffCode = 'NV' . date('YmdHis');
}


// 8. Validate dữ liệu
$errors = [];

if ($fullName === '') {
    $errors['full_name'] = 'Vui long nhap ho ten nhan vien';
}

if ($email === '') {
    $errors['email'] = 'Vui long nhap email';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Email khong hop le';
}

if ($phone === '') {
    $errors['phone'] = 'Vui long nhap so dien thoai';
}

if ($password === '') {
    $errors['password'] = 'Vui long nhap mat khau';
} elseif (strlen($password) < 6) {
    $errors['password'] = 'Mat khau phai co it nhat 6 ky tu';
}

$allowedGenders = [
    'male',
    'female',
    'other'
];

if (!in_array($gender, $allowedGenders)) {
    $errors['gender'] = 'Gioi tinh khong hop le';
}

if ($dateOfBirth !== '') {
    $dateObj = DateTime::createFromFormat('Y-m-d', $dateOfBirth);

    if (!$dateObj || $dateObj->format('Y-m-d') !== $dateOfBirth) {
        $errors['date_of_birth'] = 'Ngay sinh khong hop le';
    }
}

$allowedRoleCodes = [
    'owner',
    'admin',
    'staff'
];

if (!in_array($roleCode, $allowedRoleCodes)) {
    $errors['role_code'] = 'Vai tro nhan vien khong hop le';
}

$allowedWorkStatuses = [
    'working',
    'on_leave',
    'resigned'
];

if (!in_array($workStatus, $allowedWorkStatuses)) {
    $errors['work_status'] = 'Trang thai lam viec khong hop le';
}

$allowedStatuses = [
    'active',
    'inactive',
    'blocked'
];

if (!in_array($status, $allowedStatuses)) {
    $errors['status'] = 'Trang thai tai khoan khong hop le';
}

if (!empty($errors)) {
    sendError('Du lieu khong hop le', 422, $errors);
}


// 9. Kết nối database
$conn = getDatabaseConnection();

try {
    // 10. Kiểm tra quyền người đang đăng nhập
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
        sendError('Ban khong co quyen them nhan vien', 403);
    }


    // 11. Không cho admin thường tạo owner
    if ($currentUser['role_code'] !== 'owner' && $roleCode === 'owner') {
        sendError('Chi owner moi co the tao tai khoan owner', 403);
    }


    // 12. Lấy role_id theo role_code
    $sql = "
        SELECT
            id,
            code,
            name
        FROM roles
        WHERE code = :role_code
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':role_code' => $roleCode
    ]);

    $role = $stmt->fetch();

    if (!$role) {
        sendError('Khong tim thay vai tro nhan vien', 404);
    }


    // 13. Kiểm tra email trùng
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
        sendError('Email da ton tai', 409, [
            'email' => 'Email da duoc su dung'
        ]);
    }


    // 14. Kiểm tra số điện thoại trùng nếu có
    if ($phone !== '') {
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
            sendError('So dien thoai da ton tai', 409, [
                'phone' => 'So dien thoai da duoc su dung'
            ]);
        }
    }


    // 15. Kiểm tra mã nhân viên trùng nếu bảng staff_profiles có cột staff_code
    $staffProfileColumns = getTableColumns($conn, 'staff_profiles');

    if (in_array('staff_code', $staffProfileColumns)) {
        $sql = "
            SELECT id
            FROM staff_profiles
            WHERE staff_code = :staff_code
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':staff_code' => $staffCode
        ]);

        if ($stmt->fetch()) {
            sendError('Ma nhan vien da ton tai', 409, [
                'staff_code' => 'Ma nhan vien da duoc su dung'
            ]);
        }
    }


    // 16. Kiểm tra cột password trong bảng users
    $userColumns = getTableColumns($conn, 'users');

    $passwordColumn = '';

    if (in_array('password_hash', $userColumns)) {
        $passwordColumn = 'password_hash';
    } elseif (in_array('password', $userColumns)) {
        $passwordColumn = 'password';
    }

    if ($passwordColumn === '') {
        sendError('Bang users chua co cot password hoac password_hash', 500);
    }


    // 17. Bắt đầu transaction
    $conn->beginTransaction();


    // 18. Thêm user mới
    $insertUserFields = [
        'role_id',
        'full_name',
        'email',
        'phone',
        $passwordColumn,
        'status'
    ];

    $insertUserParams = [
        ':role_id' => (int) $role['id'],
        ':full_name' => $fullName,
        ':email' => $email,
        ':phone' => $phone,
        ':password_value' => password_hash($password, PASSWORD_DEFAULT),
        ':status' => $status
    ];

    $insertUserValues = [
        ':role_id',
        ':full_name',
        ':email',
        ':phone',
        ':password_value',
        ':status'
    ];

    if (in_array('gender', $userColumns)) {
        $insertUserFields[] = 'gender';
        $insertUserValues[] = ':gender';
        $insertUserParams[':gender'] = $gender;
    }

    if (in_array('date_of_birth', $userColumns)) {
        $insertUserFields[] = 'date_of_birth';
        $insertUserValues[] = ':date_of_birth';
        $insertUserParams[':date_of_birth'] = $dateOfBirth !== '' ? $dateOfBirth : null;
    }

    $sql = "
        INSERT INTO users (
            " . implode(', ', $insertUserFields) . "
        )
        VALUES (
            " . implode(', ', $insertUserValues) . "
        )
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($insertUserParams);

    $newStaffUserId = (int) $conn->lastInsertId();


    // 19. Thêm staff profile nếu bảng staff_profiles tồn tại đúng cấu trúc
    $createdStaffProfile = null;

    if (!empty($staffProfileColumns) && in_array('user_id', $staffProfileColumns)) {
        $profileFields = [
            'user_id'
        ];

        $profileValues = [
            ':user_id'
        ];

        $profileParams = [
            ':user_id' => $newStaffUserId
        ];

        if (in_array('staff_code', $staffProfileColumns)) {
            $profileFields[] = 'staff_code';
            $profileValues[] = ':staff_code';
            $profileParams[':staff_code'] = $staffCode;
        }

        if (in_array('position_name', $staffProfileColumns)) {
            $profileFields[] = 'position_name';
            $profileValues[] = ':position_name';
            $profileParams[':position_name'] = $positionName !== '' ? $positionName : null;
        }

        if (in_array('department', $staffProfileColumns)) {
            $profileFields[] = 'department';
            $profileValues[] = ':department';
            $profileParams[':department'] = $department !== '' ? $department : null;
        }

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

        $createdStaffProfile = [
            'staff_code' => in_array('staff_code', $staffProfileColumns) ? $staffCode : null,
            'position_name' => in_array('position_name', $staffProfileColumns) ? $positionName : null,
            'department' => in_array('department', $staffProfileColumns) ? $department : null,
            'work_status' => in_array('work_status', $staffProfileColumns) ? $workStatus : null
        ];
    }


    // 20. Ghi log hoạt động nếu có bảng staff_activity_logs
    try {
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
                'create',
                'staff',
                :target_id,
                :description
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $currentUserId,
            ':target_id' => $newStaffUserId,
            ':description' => 'Them nhan vien moi: ' . $fullName
        ]);
    } catch (PDOException $logError) {
        // Bỏ qua nếu bảng log khác cấu trúc
    }


    // 21. Lấy lại thông tin nhân viên vừa tạo
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

        WHERE u.id = :new_staff_user_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':new_staff_user_id' => $newStaffUserId
    ]);

    $createdStaff = $stmt->fetch();


    // 22. Hoàn tất transaction
    $conn->commit();


    // 23. Nhãn hiển thị
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


    // 24. Trả kết quả
    sendSuccess('Admin them nhan vien thanh cong', [
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
            'id' => (int) $createdStaff['id'],
            'full_name' => $createdStaff['full_name'],
            'email' => $createdStaff['email'],
            'phone' => $createdStaff['phone'],
            'avatar' => $createdStaff['avatar'],

            'gender' => $createdStaff['gender'],
            'gender_label' => $genderLabels[$createdStaff['gender']] ?? $createdStaff['gender'],

            'date_of_birth' => $createdStaff['date_of_birth'],

            'status' => $createdStaff['status'],
            'status_label' => $statusLabels[$createdStaff['status']] ?? $createdStaff['status'],

            'role' => [
                'code' => $createdStaff['role_code'],
                'name' => $createdStaff['role_name'],
                'label' => $roleLabels[$createdStaff['role_code']] ?? $createdStaff['role_name']
            ],

            'staff_profile' => [
                'staff_code' => $createdStaff['staff_code'],
                'position_name' => $createdStaff['position_name'],
                'department' => $createdStaff['department'],
                'work_status' => $createdStaff['work_status'],
                'work_status_label' => $workStatusLabels[$createdStaff['work_status']] ?? $createdStaff['work_status']
            ],

            'created_at' => $createdStaff['created_at'],
            'updated_at' => $createdStaff['updated_at']
        ]
    ], 201);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Admin them nhan vien that bai', 500, [
        'error' => $e->getMessage()
    ]);
}