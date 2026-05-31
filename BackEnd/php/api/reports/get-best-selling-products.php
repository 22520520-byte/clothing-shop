<?php
// =========================================================
// File: api/reports/get-best-selling-products.php
// Mục đích: API lấy báo cáo sản phẩm bán chạy
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
    sendError('Vui long dang nhap de xem bao cao san pham ban chay', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số từ URL
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;
$sort = trim($_GET['sort'] ?? 'sold_desc');

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


// 5. Validate sort
$allowedSorts = [
    'sold_desc',
    'revenue_desc',
    'name_asc'
];

if (!in_array($sort, $allowedSorts)) {
    sendError('Kieu sap xep khong hop le', 422);
}


// 6. Kết nối database
$conn = getDatabaseConnection();

try {
    // 7. Kiểm tra quyền user hiện tại
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
        sendError('Ban khong co quyen xem bao cao san pham ban chay', 403);
    }


    // 8. Sắp xếp
    $orderBy = "total_sold DESC, total_revenue DESC";

    if ($sort === 'revenue_desc') {
        $orderBy = "total_revenue DESC, total_sold DESC";
    } elseif ($sort === 'name_asc') {
        $orderBy = "product_name ASC, sku ASC";
    }


    // 9. Đếm tổng số dòng báo cáo
    $sql = "
        SELECT COUNT(*) AS total
        FROM vw_best_selling_products
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $totalProducts = (int) $stmt->fetch()['total'];
    $totalPages = (int) ceil($totalProducts / $limit);


    // 10. Lấy danh sách sản phẩm bán chạy
    $sql = "
        SELECT
            product_name,
            sku,
            total_sold,
            total_revenue
        FROM vw_best_selling_products
        ORDER BY $orderBy
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $products = $stmt->fetchAll();


    // 11. Lấy thống kê tổng
    $sql = "
        SELECT
            COALESCE(SUM(total_sold), 0) AS all_total_sold,
            COALESCE(SUM(total_revenue), 0) AS all_total_revenue
        FROM vw_best_selling_products
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $summary = $stmt->fetch();


    // 12. Format danh sách sản phẩm
    $formattedProducts = array_map(function ($item, $index) use ($offset) {
        $totalSold = (int) $item['total_sold'];
        $totalRevenue = (float) $item['total_revenue'];

        return [
            'rank' => $offset + $index + 1,
            'product_name' => $item['product_name'],
            'sku' => $item['sku'],
            'total_sold' => $totalSold,
            'total_revenue' => $totalRevenue,
            'average_revenue_per_item' => $totalSold > 0 ? $totalRevenue / $totalSold : 0
        ];
    }, $products, array_keys($products));


    // 13. Lấy sản phẩm top 1
    $topProduct = null;

    if (count($formattedProducts) > 0 && $page === 1) {
        $topProduct = $formattedProducts[0];
    } else {
        $sql = "
            SELECT
                product_name,
                sku,
                total_sold,
                total_revenue
            FROM vw_best_selling_products
            ORDER BY total_sold DESC, total_revenue DESC
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute();

        $top = $stmt->fetch();

        if ($top) {
            $totalSold = (int) $top['total_sold'];
            $totalRevenue = (float) $top['total_revenue'];

            $topProduct = [
                'rank' => 1,
                'product_name' => $top['product_name'],
                'sku' => $top['sku'],
                'total_sold' => $totalSold,
                'total_revenue' => $totalRevenue,
                'average_revenue_per_item' => $totalSold > 0 ? $totalRevenue / $totalSold : 0
            ];
        }
    }


    // 14. Trả kết quả
    sendSuccess('Lay bao cao san pham ban chay thanh cong', [
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
            'total_products' => $totalProducts,
            'all_total_sold' => (int) $summary['all_total_sold'],
            'all_total_revenue' => (float) $summary['all_total_revenue'],
            'top_product' => $topProduct
        ],

        'products' => $formattedProducts,

        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_products' => $totalProducts,
            'total_pages' => $totalPages
        ],

        'filters' => [
            'sort' => $sort
        ]
    ]);

} catch (PDOException $e) {
    sendError('Lay bao cao san pham ban chay that bai', 500, [
        'database' => $e->getMessage()
    ]);
}