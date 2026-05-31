<?php
// =========================================================
// File: api/products/get-products.php
// Mục đích: API lấy danh sách sản phẩm
// Method: GET
// =========================================================

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


// 3. Lấy tham số lọc từ URL
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 12;

$categorySlug = trim($_GET['category_slug'] ?? '');
$keyword = trim($_GET['keyword'] ?? '');

$minPrice = isset($_GET['min_price']) && $_GET['min_price'] !== ''
    ? (float) $_GET['min_price']
    : null;

$maxPrice = isset($_GET['max_price']) && $_GET['max_price'] !== ''
    ? (float) $_GET['max_price']
    : null;

$isFeatured = isset($_GET['is_featured']) ? (int) $_GET['is_featured'] : null;
$isNew = isset($_GET['is_new']) ? (int) $_GET['is_new'] : null;
$isSale = isset($_GET['is_sale']) ? (int) $_GET['is_sale'] : null;

$sort = trim($_GET['sort'] ?? 'latest');


// 4. Chuẩn hóa phân trang
if ($page < 1) {
    $page = 1;
}

if ($limit < 1) {
    $limit = 12;
}

if ($limit > 50) {
    $limit = 50;
}

$offset = ($page - 1) * $limit;


// 5. Kết nối database
$conn = getDatabaseConnection();

try {
    // 6. Tạo điều kiện lọc
    $where = [];
    $params = [];

    $where[] = "p.status = 'active'";

    if ($categorySlug !== '') {
        $where[] = "(c.slug = :category_slug OR parent.slug = :parent_category_slug)";
        $params[':category_slug'] = $categorySlug;
        $params[':parent_category_slug'] = $categorySlug;
    }

    if ($keyword !== '') {
        $where[] = "(p.name LIKE :keyword OR p.short_description LIKE :keyword_description)";
        $params[':keyword'] = '%' . $keyword . '%';
        $params[':keyword_description'] = '%' . $keyword . '%';
    }

    if ($minPrice !== null) {
        $where[] = "p.base_price >= :min_price";
        $params[':min_price'] = $minPrice;
    }

    if ($maxPrice !== null) {
        $where[] = "p.base_price <= :max_price";
        $params[':max_price'] = $maxPrice;
    }

    if ($isFeatured !== null) {
        $where[] = "p.is_featured = :is_featured";
        $params[':is_featured'] = $isFeatured;
    }

    if ($isNew !== null) {
        $where[] = "p.is_new = :is_new";
        $params[':is_new'] = $isNew;
    }

    if ($isSale !== null) {
        $where[] = "p.is_sale = :is_sale";
        $params[':is_sale'] = $isSale;
    }

    $whereSql = implode(' AND ', $where);


    // 7. Sắp xếp sản phẩm
    $orderBy = "p.created_at DESC";

    if ($sort === 'price_asc') {
        $orderBy = "p.base_price ASC";
    } elseif ($sort === 'price_desc') {
        $orderBy = "p.base_price DESC";
    } elseif ($sort === 'name_asc') {
        $orderBy = "p.name ASC";
    } elseif ($sort === 'featured') {
        $orderBy = "p.is_featured DESC, p.created_at DESC";
    }


    // 8. Đếm tổng số sản phẩm
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


    // 9. Lấy danh sách sản phẩm
    $sql = "
        SELECT
            p.id,
            p.category_id,
            c.name AS category_name,
            c.slug AS category_slug,

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

            COALESCE(stock.total_stock, 0) AS total_stock,

            COALESCE(review.total_reviews, 0) AS total_reviews,
            COALESCE(review.average_rating, 0) AS average_rating,

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
                SUM(stock_quantity) AS total_stock
            FROM product_variants
            WHERE status = 'active'
            GROUP BY product_id
        ) stock
            ON p.id = stock.product_id

        LEFT JOIN (
            SELECT
                product_id,
                COUNT(*) AS total_reviews,
                ROUND(AVG(rating), 1) AS average_rating
            FROM product_reviews
            WHERE status = 'active'
            GROUP BY product_id
        ) review
            ON p.id = review.product_id

        WHERE $whereSql
        ORDER BY $orderBy
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $products = $stmt->fetchAll();


    // 10. Format dữ liệu trả về
    $formattedProducts = array_map(function ($product) {
        return [
            'id' => (int) $product['id'],
            'category_id' => (int) $product['category_id'],
            'category_name' => $product['category_name'],
            'category_slug' => $product['category_slug'],

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

            'total_stock' => (int) $product['total_stock'],
            'total_reviews' => (int) $product['total_reviews'],
            'average_rating' => (float) $product['average_rating'],

            'created_at' => $product['created_at'],
            'updated_at' => $product['updated_at']
        ];
    }, $products);


    // 11. Trả kết quả
    sendSuccess('Lay danh sach san pham thanh cong', [
        'products' => $formattedProducts,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_products' => $totalProducts,
            'total_pages' => $totalPages
        ],
        'filters' => [
            'category_slug' => $categorySlug,
            'keyword' => $keyword,
            'min_price' => $minPrice,
            'max_price' => $maxPrice,
            'is_featured' => $isFeatured,
            'is_new' => $isNew,
            'is_sale' => $isSale,
            'sort' => $sort
        ]
    ]);

} catch (PDOException $e) {
    sendError('Lay danh sach san pham that bai', 500, [
        'database' => $e->getMessage()
    ]);
}