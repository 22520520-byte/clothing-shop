<?php
// =========================================================
// File: api/admin/products/get-products.php
// Mục đích: API admin lấy danh sách sản phẩm để quản lý
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
    sendError('Vui long dang nhap de quan ly san pham', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số từ URL
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;

$keyword = trim($_GET['keyword'] ?? '');
$categorySlug = trim($_GET['category_slug'] ?? '');
$status = trim($_GET['status'] ?? 'all');

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


// 6. Validate sort
$allowedSorts = [
    'latest',
    'oldest',
    'name_asc',
    'price_asc',
    'price_desc',
    'stock_asc',
    'stock_desc'
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
        sendError('Ban khong co quyen quan ly san pham', 403);
    }


    // 9. Tạo điều kiện lọc
    $where = [];
    $params = [];

    if ($keyword !== '') {
        $where[] = "(
            p.name LIKE :keyword_name
            OR p.slug LIKE :keyword_slug
            OR p.short_description LIKE :keyword_description
            OR p.brand LIKE :keyword_brand
        )";

        $params[':keyword_name'] = '%' . $keyword . '%';
        $params[':keyword_slug'] = '%' . $keyword . '%';
        $params[':keyword_description'] = '%' . $keyword . '%';
        $params[':keyword_brand'] = '%' . $keyword . '%';
    }

    if ($categorySlug !== '') {
        $where[] = "(c.slug = :category_slug OR parent.slug = :parent_category_slug)";
        $params[':category_slug'] = $categorySlug;
        $params[':parent_category_slug'] = $categorySlug;
    }

    if ($status !== '' && $status !== 'all') {
        $where[] = "p.status = :status";
        $params[':status'] = $status;
    }

    if (empty($where)) {
        $where[] = "1 = 1";
    }

    $whereSql = implode(' AND ', $where);


    // 10. Sắp xếp
    $orderBy = "p.created_at DESC, p.id DESC";

    if ($sort === 'oldest') {
        $orderBy = "p.created_at ASC, p.id ASC";
    } elseif ($sort === 'name_asc') {
        $orderBy = "p.name ASC, p.id ASC";
    } elseif ($sort === 'price_asc') {
        $orderBy = "p.base_price ASC, p.id ASC";
    } elseif ($sort === 'price_desc') {
        $orderBy = "p.base_price DESC, p.id ASC";
    } elseif ($sort === 'stock_asc') {
        $orderBy = "total_stock ASC, p.id ASC";
    } elseif ($sort === 'stock_desc') {
        $orderBy = "total_stock DESC, p.id ASC";
    }


    // 11. Đếm tổng sản phẩm sau lọc
    $countSql = "
        SELECT COUNT(DISTINCT p.id) AS total
        FROM products p
        JOIN categories c
            ON p.category_id = c.id
        LEFT JOIN categories parent
            ON c.parent_id = parent.id
        WHERE $whereSql
    ";

    $countStmt = $conn->prepare($countSql);
    $countStmt->execute($params);

    $totalProducts = (int) $countStmt->fetch()['total'];
    $totalPages = (int) ceil($totalProducts / $limit);


    // 12. Lấy danh sách sản phẩm
    $sql = "
        SELECT
            p.id,
            p.category_id,

            c.name AS category_name,
            c.slug AS category_slug,

            parent.id AS parent_category_id,
            parent.name AS parent_category_name,
            parent.slug AS parent_category_slug,

            p.name,
            p.slug,
            p.short_description,
            p.base_price,
            p.old_price,

            p.gender,
            p.material,
            p.brand,

            p.is_featured,
            p.is_new,
            p.is_sale,
            p.status,

            COALESCE(pi.image_url, '../img/products/default.jpg') AS main_image,

            COALESCE(variant_summary.total_variants, 0) AS total_variants,
            COALESCE(variant_summary.total_stock, 0) AS total_stock,
            COALESCE(variant_summary.active_variants, 0) AS active_variants,

            COALESCE(review_summary.total_reviews, 0) AS total_reviews,
            COALESCE(review_summary.average_rating, 0) AS average_rating,

            p.created_at,
            p.updated_at

        FROM products p

        JOIN categories c
            ON p.category_id = c.id

        LEFT JOIN categories parent
            ON c.parent_id = parent.id

        LEFT JOIN (
            SELECT
                product_id,
                MIN(image_url) AS image_url
            FROM product_images
            WHERE is_main = 1
            GROUP BY product_id
        ) pi
            ON p.id = pi.product_id

        LEFT JOIN (
            SELECT
                product_id,
                COUNT(id) AS total_variants,
                SUM(stock_quantity) AS total_stock,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_variants
            FROM product_variants
            GROUP BY product_id
        ) variant_summary
            ON p.id = variant_summary.product_id

        LEFT JOIN (
            SELECT
                product_id,
                COUNT(id) AS total_reviews,
                ROUND(AVG(rating), 1) AS average_rating
            FROM product_reviews
            WHERE status = 'active'
            GROUP BY product_id
        ) review_summary
            ON p.id = review_summary.product_id

        WHERE $whereSql
        ORDER BY $orderBy
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $products = $stmt->fetchAll();


    // 13. Thống kê nhanh toàn bộ sản phẩm
    $sql = "
        SELECT
            COUNT(*) AS total_products,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_products,
            SUM(CASE WHEN status != 'active' THEN 1 ELSE 0 END) AS inactive_products,
            SUM(CASE WHEN is_sale = 1 THEN 1 ELSE 0 END) AS sale_products,
            SUM(CASE WHEN is_new = 1 THEN 1 ELSE 0 END) AS new_products,
            SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) AS featured_products
        FROM products
    ";

    $summaryStmt = $conn->prepare($sql);
    $summaryStmt->execute();

    $summary = $summaryStmt->fetch();


    // 14. Format dữ liệu sản phẩm
    $formattedProducts = array_map(function ($product) {
        $totalStock = (int) $product['total_stock'];

        $stockStatus = 'available';

        if ($totalStock <= 0) {
            $stockStatus = 'out_of_stock';
        } elseif ($totalStock <= 5) {
            $stockStatus = 'low_stock';
        }

        $stockStatusLabels = [
            'available' => 'Còn hàng',
            'low_stock' => 'Sắp hết',
            'out_of_stock' => 'Hết hàng'
        ];

        return [
            'id' => (int) $product['id'],

            'category' => [
                'id' => (int) $product['category_id'],
                'name' => $product['category_name'],
                'slug' => $product['category_slug']
            ],

            'parent_category' => [
                'id' => $product['parent_category_id'] !== null ? (int) $product['parent_category_id'] : null,
                'name' => $product['parent_category_name'],
                'slug' => $product['parent_category_slug']
            ],

            'name' => $product['name'],
            'slug' => $product['slug'],
            'short_description' => $product['short_description'],

            'base_price' => (float) $product['base_price'],
            'old_price' => $product['old_price'] !== null ? (float) $product['old_price'] : null,

            'gender' => $product['gender'],
            'material' => $product['material'],
            'brand' => $product['brand'],

            'is_featured' => (int) $product['is_featured'],
            'is_new' => (int) $product['is_new'],
            'is_sale' => (int) $product['is_sale'],
            'status' => $product['status'],

            'main_image' => $product['main_image'],

            'variant_summary' => [
                'total_variants' => (int) $product['total_variants'],
                'active_variants' => (int) $product['active_variants'],
                'total_stock' => $totalStock,
                'stock_status' => $stockStatus,
                'stock_status_label' => $stockStatusLabels[$stockStatus]
            ],

            'review_summary' => [
                'total_reviews' => (int) $product['total_reviews'],
                'average_rating' => (float) $product['average_rating']
            ],

            'created_at' => $product['created_at'],
            'updated_at' => $product['updated_at']
        ];
    }, $products);


    // 15. Trả kết quả
    sendSuccess('Admin lay danh sach san pham thanh cong', [
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
            'total_products' => (int) ($summary['total_products'] ?? 0),
            'active_products' => (int) ($summary['active_products'] ?? 0),
            'inactive_products' => (int) ($summary['inactive_products'] ?? 0),
            'sale_products' => (int) ($summary['sale_products'] ?? 0),
            'new_products' => (int) ($summary['new_products'] ?? 0),
            'featured_products' => (int) ($summary['featured_products'] ?? 0)
        ],

        'products' => $formattedProducts,

        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_products' => $totalProducts,
            'total_pages' => $totalPages
        ],

        'filters' => [
            'keyword' => $keyword,
            'category_slug' => $categorySlug,
            'status' => $status,
            'sort' => $sort
        ]
    ]);

} catch (PDOException $e) {
    sendError('Admin lay danh sach san pham that bai', 500, [
        'database' => $e->getMessage()
    ]);
}