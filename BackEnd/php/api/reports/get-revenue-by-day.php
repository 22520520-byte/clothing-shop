<?php
// =========================================================
// File: api/reports/get-revenue-by-day.php
// Mục đích: API lấy báo cáo doanh thu theo ngày
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
    sendError('Vui long dang nhap de xem bao cao doanh thu', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số ngày
$fromDate = trim($_GET['from_date'] ?? '');
$toDate = trim($_GET['to_date'] ?? '');


// 5. Nếu không truyền ngày thì mặc định lấy 7 ngày gần nhất
if ($toDate === '') {
    $toDate = date('Y-m-d');
}

if ($fromDate === '') {
    $fromDate = date('Y-m-d', strtotime('-6 days'));
}


// 6. Validate ngày
$fromDateObj = DateTime::createFromFormat('Y-m-d', $fromDate);
$toDateObj = DateTime::createFromFormat('Y-m-d', $toDate);

if (!$fromDateObj || $fromDateObj->format('Y-m-d') !== $fromDate) {
    sendError('Tu ngay khong hop le', 422);
}

if (!$toDateObj || $toDateObj->format('Y-m-d') !== $toDate) {
    sendError('Den ngay khong hop le', 422);
}

if ($fromDateObj > $toDateObj) {
    sendError('Tu ngay khong duoc lon hon den ngay', 422);
}


// 7. Giới hạn khoảng ngày không quá 365 ngày
$diffDays = $fromDateObj->diff($toDateObj)->days;

if ($diffDays > 365) {
    sendError('Khoang thoi gian bao cao khong duoc vuot qua 365 ngay', 422);
}


// 8. Kết nối database
$conn = getDatabaseConnection();

try {
    // 9. Kiểm tra quyền user hiện tại
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
        sendError('Ban khong co quyen xem bao cao doanh thu', 403);
    }


    // 10. Lấy dữ liệu doanh thu từ view
    $sql = "
        SELECT
            report_date,
            total_orders,
            total_revenue
        FROM vw_revenue_by_day
        WHERE report_date BETWEEN :from_date AND :to_date
        ORDER BY report_date ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':from_date' => $fromDate,
        ':to_date' => $toDate
    ]);

    $rows = $stmt->fetchAll();


    // 11. Đưa dữ liệu từ database vào map theo ngày
    $revenueMap = [];

    foreach ($rows as $row) {
        $revenueMap[$row['report_date']] = [
            'report_date' => $row['report_date'],
            'total_orders' => (int) $row['total_orders'],
            'total_revenue' => (float) $row['total_revenue']
        ];
    }


    // 12. Tạo đủ ngày trong khoảng, ngày nào không có doanh thu thì để 0
    $chartData = [];
    $totalOrders = 0;
    $totalRevenue = 0;

    $currentDate = clone $fromDateObj;

    while ($currentDate <= $toDateObj) {
        $dateKey = $currentDate->format('Y-m-d');

        if (isset($revenueMap[$dateKey])) {
            $totalOrdersByDay = $revenueMap[$dateKey]['total_orders'];
            $totalRevenueByDay = $revenueMap[$dateKey]['total_revenue'];
        } else {
            $totalOrdersByDay = 0;
            $totalRevenueByDay = 0;
        }

        $chartData[] = [
            'report_date' => $dateKey,
            'date_label' => $currentDate->format('d/m'),
            'total_orders' => $totalOrdersByDay,
            'total_revenue' => $totalRevenueByDay
        ];

        $totalOrders += $totalOrdersByDay;
        $totalRevenue += $totalRevenueByDay;

        $currentDate->modify('+1 day');
    }


    // 13. Tính doanh thu trung bình
    $numberOfDays = count($chartData);
    $averageRevenuePerDay = $numberOfDays > 0 ? $totalRevenue / $numberOfDays : 0;
    $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;


    // 14. Lấy ngày doanh thu cao nhất
    $bestDay = null;

    foreach ($chartData as $item) {
        if ($bestDay === null || $item['total_revenue'] > $bestDay['total_revenue']) {
            $bestDay = $item;
        }
    }


    // 15. Trả kết quả
    sendSuccess('Lay bao cao doanh thu theo ngay thanh cong', [
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
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'number_of_days' => $numberOfDays,
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'average_revenue_per_day' => $averageRevenuePerDay,
            'average_order_value' => $averageOrderValue,
            'best_day' => $bestDay
        ],

        'chart_data' => $chartData
    ]);

} catch (PDOException $e) {
    sendError('Lay bao cao doanh thu theo ngay that bai', 500, [
        'database' => $e->getMessage()
    ]);
}