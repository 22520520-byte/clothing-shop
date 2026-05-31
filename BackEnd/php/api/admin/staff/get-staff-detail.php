<?php
// =========================================================
// File: api/admin/staff/get-staff-detail.php
// Mục đích: API admin lấy chi tiết nhân viên và lịch sử hoạt động
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
    sendError('Vui long dang nhap de xem chi tiet nhan vien', 401);
}

$currentUserId = (int) $_SESSION['user_id'];


// 4. Lấy staff id
$staffId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($staffId <= 0) {
    sendError('Vui long truyen ma nhan vien', 422);
}


// 5. Kết nối database
$conn = getDatabaseConnection();

try {
    // 6. Kiểm tra quyền người đang đăng nhập
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

    $allowedRoles = ['owner', 'admin', 'staff'];

    if (!in_array($currentUser['role_code'], $allowedRoles)) {
        sendError('Ban khong co quyen xem chi tiet nhan vien', 403);
    }


    // 7. Lấy thông tin nhân viên
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


    // 8. Kiểm tra cấu trúc bảng staff_activity_logs
    $activityColumns = [];

    try {
        $columnStmt = $conn->query("SHOW COLUMNS FROM staff_activity_logs");
        $columns = $columnStmt->fetchAll();

        foreach ($columns as $column) {
            $activityColumns[] = $column['Field'];
        }
    } catch (PDOException $columnError) {
        $activityColumns = [];
    }

    $hasActivityTable = !empty($activityColumns);
    $hasActionType = in_array('action_type', $activityColumns);
    $hasTargetType = in_array('target_type', $activityColumns);
    $hasTargetId = in_array('target_id', $activityColumns);
    $hasDescription = in_array('description', $activityColumns);
    $hasCreatedAt = in_array('created_at', $activityColumns);


    // 9. Lấy thống kê hoạt động
    $activitySummary = [
        'total_activities' => 0,
        'create_activities' => 0,
        'update_activities' => 0,
        'update_status_activities' => 0,
        'update_payment_activities' => 0,
        'first_activity_at' => null,
        'last_activity_at' => null
    ];

    if ($hasActivityTable) {
        try {
            if ($hasActionType && $hasCreatedAt) {
                $sql = "
                    SELECT
                        COUNT(id) AS total_activities,
                        SUM(CASE WHEN action_type = 'create' THEN 1 ELSE 0 END) AS create_activities,
                        SUM(CASE WHEN action_type = 'update' THEN 1 ELSE 0 END) AS update_activities,
                        SUM(CASE WHEN action_type = 'update_status' THEN 1 ELSE 0 END) AS update_status_activities,
                        SUM(CASE WHEN action_type = 'update_payment' THEN 1 ELSE 0 END) AS update_payment_activities,
                        MIN(created_at) AS first_activity_at,
                        MAX(created_at) AS last_activity_at
                    FROM staff_activity_logs
                    WHERE user_id = :staff_id
                ";
            } elseif ($hasCreatedAt) {
                $sql = "
                    SELECT
                        COUNT(id) AS total_activities,
                        0 AS create_activities,
                        0 AS update_activities,
                        0 AS update_status_activities,
                        0 AS update_payment_activities,
                        MIN(created_at) AS first_activity_at,
                        MAX(created_at) AS last_activity_at
                    FROM staff_activity_logs
                    WHERE user_id = :staff_id
                ";
            } else {
                $sql = "
                    SELECT
                        COUNT(id) AS total_activities,
                        0 AS create_activities,
                        0 AS update_activities,
                        0 AS update_status_activities,
                        0 AS update_payment_activities,
                        NULL AS first_activity_at,
                        NULL AS last_activity_at
                    FROM staff_activity_logs
                    WHERE user_id = :staff_id
                ";
            }

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':staff_id' => $staffId
            ]);

            $activitySummary = $stmt->fetch();
        } catch (PDOException $summaryError) {
            $activitySummary = [
                'total_activities' => 0,
                'create_activities' => 0,
                'update_activities' => 0,
                'update_status_activities' => 0,
                'update_payment_activities' => 0,
                'first_activity_at' => null,
                'last_activity_at' => null
            ];
        }
    }


    // 10. Lấy lịch sử hoạt động gần đây
    $activities = [];

    if ($hasActivityTable) {
        try {
            if ($hasCreatedAt) {
                $sql = "
                    SELECT *
                    FROM staff_activity_logs
                    WHERE user_id = :staff_id
                    ORDER BY created_at DESC, id DESC
                    LIMIT 30
                ";
            } else {
                $sql = "
                    SELECT *
                    FROM staff_activity_logs
                    WHERE user_id = :staff_id
                    ORDER BY id DESC
                    LIMIT 30
                ";
            }

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':staff_id' => $staffId
            ]);

            $activities = $stmt->fetchAll();
        } catch (PDOException $activityError) {
            $activities = [];
        }
    }


    // 11. Nhãn hiển thị
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

    $actionTypeLabels = [
        'create' => 'Thêm mới',
        'update' => 'Cập nhật',
        'update_status' => 'Cập nhật trạng thái',
        'update_payment' => 'Cập nhật thanh toán',
        'delete' => 'Xóa',
        'login' => 'Đăng nhập',
        'logout' => 'Đăng xuất',
        'activity' => 'Hoạt động'
    ];

    $targetTypeLabels = [
        'product' => 'Sản phẩm',
        'order' => 'Đơn hàng',
        'customer' => 'Khách hàng',
        'voucher' => 'Voucher',
        'staff' => 'Nhân viên',
        'user' => 'Người dùng',
        'system' => 'Hệ thống'
    ];


    // 12. Format lịch sử hoạt động
    $formattedActivities = array_map(function ($activity) use (
        $actionTypeLabels,
        $targetTypeLabels,
        $hasActionType,
        $hasTargetType,
        $hasTargetId,
        $hasDescription,
        $hasCreatedAt
    ) {
        $actionType = 'activity';

        if ($hasActionType && isset($activity['action_type']) && $activity['action_type'] !== '') {
            $actionType = $activity['action_type'];
        } elseif (isset($activity['action']) && $activity['action'] !== '') {
            $actionType = $activity['action'];
        }

        $targetType = 'system';

        if ($hasTargetType && isset($activity['target_type']) && $activity['target_type'] !== '') {
            $targetType = $activity['target_type'];
        } elseif (isset($activity['table_name']) && $activity['table_name'] !== '') {
            $targetType = $activity['table_name'];
        }

        $targetId = null;

        if ($hasTargetId && isset($activity['target_id']) && $activity['target_id'] !== null) {
            $targetId = (int) $activity['target_id'];
        } elseif (isset($activity['record_id']) && $activity['record_id'] !== null) {
            $targetId = (int) $activity['record_id'];
        }

        $description = 'Hoạt động nhân viên';

        if ($hasDescription && isset($activity['description']) && $activity['description'] !== '') {
            $description = $activity['description'];
        } elseif (isset($activity['note']) && $activity['note'] !== '') {
            $description = $activity['note'];
        } elseif (isset($activity['content']) && $activity['content'] !== '') {
            $description = $activity['content'];
        }

        return [
            'id' => isset($activity['id']) ? (int) $activity['id'] : null,
            'user_id' => isset($activity['user_id']) ? (int) $activity['user_id'] : null,

            'action_type' => $actionType,
            'action_type_label' => $actionTypeLabels[$actionType] ?? $actionType,

            'target_type' => $targetType,
            'target_type_label' => $targetTypeLabels[$targetType] ?? $targetType,

            'target_id' => $targetId,
            'description' => $description,
            'created_at' => $hasCreatedAt && isset($activity['created_at']) ? $activity['created_at'] : null
        ];
    }, $activities);


    // 13. Format thông tin nhân viên
    $roleCode = $staff['role_code'];
    $status = $staff['status'];
    $workStatus = $staff['work_status'] ?: 'working';
    $gender = $staff['gender'];

    $staffData = [
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
            'total_activities' => (int) ($activitySummary['total_activities'] ?? 0),
            'create_activities' => (int) ($activitySummary['create_activities'] ?? 0),
            'update_activities' => (int) ($activitySummary['update_activities'] ?? 0),
            'update_status_activities' => (int) ($activitySummary['update_status_activities'] ?? 0),
            'update_payment_activities' => (int) ($activitySummary['update_payment_activities'] ?? 0),
            'first_activity_at' => $activitySummary['first_activity_at'] ?? null,
            'last_activity_at' => $activitySummary['last_activity_at'] ?? null
        ],

        'activities' => $formattedActivities,

        'created_at' => $staff['created_at'],
        'updated_at' => $staff['updated_at']
    ];


    // 14. Trả kết quả
    sendSuccess('Admin lay chi tiet nhan vien thanh cong', [
        'current_user' => [
            'id' => (int) $currentUser['id'],
            'full_name' => $currentUser['full_name'],
            'email' => $currentUser['email'],
            'role' => [
                'code' => $currentUser['role_code'],
                'name' => $currentUser['role_name']
            ]
        ],

        'staff' => $staffData
    ]);

} catch (PDOException $e) {
    sendError('Admin lay chi tiet nhan vien that bai', 500, [
        'database' => $e->getMessage()
    ]);
}