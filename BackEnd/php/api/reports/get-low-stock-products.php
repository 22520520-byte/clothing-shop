<?php
// =========================================================
// File: api/reports/get-low-stock-products.php
// Mục đích: API lấy danh sách biến thể sản phẩm sắp hết hàng
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
    sendError('Vui long dang nhap de xem bao cao ton kho', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số từ URL
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;
$sort = trim($_GET['sort'] ?? 'stock_asc');

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
    'stock_asc',
    'stock_desc',
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
        sendError('Ban khong co quyen xem bao cao ton kho', 403);
    }


    // 8. Sắp xếp
    $orderBy = "stock_quantity ASC, variant_id ASC";

    if ($sort === 'stock_desc') {
        $orderBy = "stock_quantity DESC, variant_id ASC";
    } elseif ($sort === 'name_asc') {
        $orderBy = "product_name ASC, sku ASC";
    }


    // 9. Đếm tổng biến thể sắp hết hàng
    $sql = "
        SELECT COUNT(*) AS total
        FROM vw_low_stock_variants
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $totalVariants = (int) $stmt->fetch()['total'];
    $totalPages = (int) ceil($totalVariants / $limit);


    // 10. Lấy danh sách biến thể sắp hết hàng
    $sql = "
        SELECT
            variant_id,
            product_name,
            sku,
            color_name,
            size_name,
            stock_quantity,
            status
        FROM vw_low_stock_variants
        ORDER BY $orderBy
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $variants = $stmt->fetchAll();


    // 11. Thống kê tồn kho
    $sql = "
        SELECT
            COUNT(*) AS total_low_stock_variants,
            SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END) AS total_out_of_stock_variants,
            MIN(stock_quantity) AS min_stock_quantity,
            MAX(stock_quantity) AS max_stock_quantity
        FROM vw_low_stock_variants
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $summary = $stmt->fetch();


    // 12. Format danh sách biến thể
    $formattedVariants = array_map(function ($item) {
        $stockQuantity = (int) $item['stock_quantity'];

        $stockLevel = 'low';

        if ($stockQuantity <= 0) {
            $stockLevel = 'out_of_stock';
        } elseif ($stockQuantity <= 2) {
            $stockLevel = 'critical';
        }

        $stockLevelLabels = [
            'out_of_stock' => 'Hết hàng',
            'critical' => 'Rất thấp',
            'low' => 'Sắp hết'
        ];

        return [
            'variant_id' => (int) $item['variant_id'],
            'product_name' => $item['product_name'],
            'sku' => $item['sku'],
            'color_name' => $item['color_name'],
            'size_name' => $item['size_name'],
            'stock_quantity' => $stockQuantity,
            'stock_level' => $stockLevel,
            'stock_level_label' => $stockLevelLabels[$stockLevel],
            'status' => $item['status']
        ];
    }, $variants);


    // 13. Trả kết quả
    sendSuccess('Lay bao cao san pham sap het hang thanh cong', [
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
            'total_low_stock_variants' => (int) ($summary['total_low_stock_variants'] ?? 0),
            'total_out_of_stock_variants' => (int) ($summary['total_out_of_stock_variants'] ?? 0),
            'min_stock_quantity' => $summary['min_stock_quantity'] !== null ? (int) $summary['min_stock_quantity'] : 0,
            'max_stock_quantity' => $summary['max_stock_quantity'] !== null ? (int) $summary['max_stock_quantity'] : 0
        ],

        'variants' => $formattedVariants,

        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_variants' => $totalVariants,
            'total_pages' => $totalPages
        ],

        'filters' => [
            'sort' => $sort
        ]
    ]);

} catch (PDOException $e) {
    sendError('Lay bao cao san pham sap het hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}