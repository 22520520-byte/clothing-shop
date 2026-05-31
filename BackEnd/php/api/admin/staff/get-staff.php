<?php
// =========================================================
// File: api/admin/staff/get-staff.php
// Mục đích: API admin lấy danh sách nhân viên / admin / owner
// Method: GET
// =========================================================

session_start();

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../helpers/response.php';


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
    sendError('Vui long dang nhap de quan ly nhan vien', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số lọc
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;

$keyword = trim($_GET['keyword'] ?? '');
$roleCode = trim($_GET['role_code'] ?? 'all');
$status = trim($_GET['status'] ?? 'all');
$workStatus = trim($_GET['work_status'] ?? 'all');
$department = trim($_GET['department'] ?? '');

$sort = trim($_GET['sort'] ?? 'latest');


// 5. Chuẩn hóa phân trang
if ($page < 1) {
    $page = 1;
}

if ($limit < 1) {
    $limit = 10;
}

if ($limit > 50) {
    $limit = 50;
}

$offset = ($page - 1) * $limit;


// 6. Validate filter
$allowedRoleCodes = [
    'all',
    'owner',
    'admin',
    'staff'
];

if (!in_array($roleCode, $allowedRoleCodes)) {
    sendError('Vai tro nhan vien khong hop le', 422);
}

$allowedStatuses = [
    'all',
    'active',
    'inactive',
    'blocked'
];

if (!in_array($status, $allowedStatuses)) {
    sendError('Trang thai tai khoan khong hop le', 422);
}

$allowedWorkStatuses = [
    'all',
    'working',
    'on_leave',
    'resigned'
];

if (!in_array($workStatus, $allowedWorkStatuses)) {
    sendError('Trang thai lam viec khong hop le', 422);
}

$allowedSorts = [
    'latest',
    'oldest',
    'name_asc',
    'activity_desc',
    'role_asc'
];

if (!in_array($sort, $allowedSorts)) {
    sendError('Kieu sap xep khong hop le', 422);
}


// 7. Kết nối database
$conn = getDatabaseConnection();

try {
    // 8. Kiểm tra quyền admin/staff
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

    $allowedRoles = ['owner', 'admin', 'staff'];

    if (!in_array($user['role_code'], $allowedRoles)) {
        sendError('Ban khong co quyen quan ly nhan vien', 403);
    }


    // 9. Tạo điều kiện lọc
    $where = [];
    $params = [];

    $where[] = "r.code IN ('owner', 'admin', 'staff')";

    if ($keyword !== '') {
        $where[] = "(
            u.full_name LIKE :keyword_name
            OR u.email LIKE :keyword_email
            OR u.phone LIKE :keyword_phone
            OR sp.staff_code LIKE :keyword_staff_code
            OR sp.position_name LIKE :keyword_position
            OR sp.department LIKE :keyword_department
        )";

        $params[':keyword_name'] = '%' . $keyword . '%';
        $params[':keyword_email'] = '%' . $keyword . '%';
        $params[':keyword_phone'] = '%' . $keyword . '%';
        $params[':keyword_staff_code'] = '%' . $keyword . '%';
        $params[':keyword_position'] = '%' . $keyword . '%';
        $params[':keyword_department'] = '%' . $keyword . '%';
    }

    if ($roleCode !== 'all') {
        $where[] = "r.code = :role_code";
        $params[':role_code'] = $roleCode;
    }

    if ($status !== 'all') {
        $where[] = "u.status = :status";
        $params[':status'] = $status;
    }

    if ($workStatus !== 'all') {
        $where[] = "COALESCE(sp.work_status, 'working') = :work_status";
        $params[':work_status'] = $workStatus;
    }

    if ($department !== '') {
        $where[] = "sp.department LIKE :department";
        $params[':department'] = '%' . $department . '%';
    }

    $whereSql = implode(' AND ', $where);


    // 10. Sắp xếp
    $orderBy = "u.created_at DESC, u.id DESC";

    if ($sort === 'oldest') {
        $orderBy = "u.created_at ASC, u.id ASC";
    } elseif ($sort === 'name_asc') {
        $orderBy = "u.full_name ASC, u.id ASC";
    } elseif ($sort === 'activity_desc') {
        $orderBy = "total_activities DESC, last_activity_at DESC, u.id DESC";
    } elseif ($sort === 'role_asc') {
        $orderBy = "r.code ASC, u.full_name ASC";
    }


    // 11. Đếm tổng nhân viên sau lọc
    $countSql = "
        SELECT COUNT(DISTINCT u.id) AS total
        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        LEFT JOIN staff_profiles sp
            ON u.id = sp.user_id
        WHERE $whereSql
    ";

    $countStmt = $conn->prepare($countSql);
    $countStmt->execute($params);

    $totalStaff = (int) $countStmt->fetch()['total'];
    $totalPages = (int) ceil($totalStaff / $limit);


    // 12. Lấy danh sách nhân viên
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
            sp.work_status,

            COALESCE(activity_summary.total_activities, 0) AS total_activities,
            activity_summary.last_activity_at

        FROM users u

        JOIN roles r
            ON u.role_id = r.id

        LEFT JOIN staff_profiles sp
            ON u.id = sp.user_id

        LEFT JOIN (
            SELECT
                user_id,
                COUNT(id) AS total_activities,
                MAX(created_at) AS last_activity_at
            FROM staff_activity_logs
            GROUP BY user_id
        ) activity_summary
            ON u.id = activity_summary.user_id

        WHERE $whereSql
        ORDER BY $orderBy
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $staffList = $stmt->fetchAll();


    // 13. Thống kê nhanh toàn bộ nhân viên/admin/owner
    $sql = "
        SELECT
            COUNT(u.id) AS total_staff,
            SUM(CASE WHEN r.code = 'owner' THEN 1 ELSE 0 END) AS total_owner,
            SUM(CASE WHEN r.code = 'admin' THEN 1 ELSE 0 END) AS total_admin,
            SUM(CASE WHEN r.code = 'staff' THEN 1 ELSE 0 END) AS total_staff_role,

            SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END) AS active_accounts,
            SUM(CASE WHEN u.status != 'active' THEN 1 ELSE 0 END) AS inactive_accounts,

            SUM(CASE WHEN COALESCE(sp.work_status, 'working') = 'working' THEN 1 ELSE 0 END) AS working_staff,
            SUM(CASE WHEN COALESCE(sp.work_status, 'working') = 'on_leave' THEN 1 ELSE 0 END) AS on_leave_staff,
            SUM(CASE WHEN COALESCE(sp.work_status, 'working') = 'resigned' THEN 1 ELSE 0 END) AS resigned_staff

        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        LEFT JOIN staff_profiles sp
            ON u.id = sp.user_id
        WHERE r.code IN ('owner', 'admin', 'staff')
    ";

    $summaryStmt = $conn->prepare($sql);
    $summaryStmt->execute();

    $summary = $summaryStmt->fetch();


    // 14. Nhãn hiển thị
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


    // 15. Format danh sách nhân viên
    $formattedStaff = array_map(function ($staff) use (
        $roleLabels,
        $statusLabels,
        $workStatusLabels,
        $genderLabels
    ) {
        $roleCode = $staff['role_code'];
        $status = $staff['status'];
        $workStatus = $staff['work_status'] ?: 'working';
        $gender = $staff['gender'];

        return [
            'id' => (int) $staff['id'],
            'full_name' => $staff['full_name'],
            'email' => $staff['email'],
            'phone' => $staff['phone'],
            'avatar' => $staff['avatar'],

            'gender' => $gender,
            'gender_label' => $genderLabels[$gender] ?? $gender,

            'date_of_birth' => $staff['date_of_birth'],

            'status' => $status,
            'status_label' => $statusLabels[$status] ?? $status,

            'role' => [
                'code' => $roleCode,
                'name' => $staff['role_name'],
                'label' => $roleLabels[$roleCode] ?? $staff['role_name']
            ],

            'staff_profile' => [
                'staff_code' => $staff['staff_code'],
                'position_name' => $staff['position_name'],
                'department' => $staff['department'],
                'work_status' => $workStatus,
                'work_status_label' => $workStatusLabels[$workStatus] ?? $workStatus
            ],

            'activity_summary' => [
                'total_activities' => (int) $staff['total_activities'],
                'last_activity_at' => $staff['last_activity_at']
            ],

            'created_at' => $staff['created_at'],
            'updated_at' => $staff['updated_at']
        ];
    }, $staffList);


    // 16. Trả kết quả
    sendSuccess('Admin lay danh sach nhan vien thanh cong', [
        'current_user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => [
                'code' => $user['role_code'],
                'name' => $user['role_name']
            ]
        ],

        'summary' => [
            'total_staff' => (int) ($summary['total_staff'] ?? 0),
            'total_owner' => (int) ($summary['total_owner'] ?? 0),
            'total_admin' => (int) ($summary['total_admin'] ?? 0),
            'total_staff_role' => (int) ($summary['total_staff_role'] ?? 0),

            'active_accounts' => (int) ($summary['active_accounts'] ?? 0),
            'inactive_accounts' => (int) ($summary['inactive_accounts'] ?? 0),

            'working_staff' => (int) ($summary['working_staff'] ?? 0),
            'on_leave_staff' => (int) ($summary['on_leave_staff'] ?? 0),
            'resigned_staff' => (int) ($summary['resigned_staff'] ?? 0)
        ],

        'staff' => $formattedStaff,

        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_staff' => $totalStaff,
            'total_pages' => $totalPages
        ],

        'filters' => [
            'keyword' => $keyword,
            'role_code' => $roleCode,
            'status' => $status,
            'work_status' => $workStatus,
            'department' => $department,
            'sort' => $sort
        ]
    ]);

} catch (PDOException $e) {
    sendError('Admin lay danh sach nhan vien that bai', 500, [
        'database' => $e->getMessage()
    ]);
}