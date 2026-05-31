<?php
// =========================================================
// File: api/promotions/get-flash-sale-products.php
// Mục đích: API lấy danh sách sản phẩm flash sale
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


// 3. Lấy tham số từ URL
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 12;

$campaignSlug = trim($_GET['campaign_slug'] ?? '');
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

    $where[] = "pc.campaign_type = 'flash_sale'";
    $where[] = "pc.status = 'active'";
    $where[] = "pp.status = 'active'";
    $where[] = "p.status = 'active'";
    $where[] = "NOW() BETWEEN pc.start_date AND pc.end_date";

    if ($campaignSlug !== '') {
        $where[] = "pc.slug = :campaign_slug";
        $params[':campaign_slug'] = $campaignSlug;
    }

    $whereSql = implode(' AND ', $where);


    // 7. Sắp xếp sản phẩm flash sale
    $orderBy = "pp.created_at DESC, pp.id DESC";

    if ($sort === 'price_asc') {
        $orderBy = "final_sale_price ASC";
    } elseif ($sort === 'price_desc') {
        $orderBy = "final_sale_price DESC";
    } elseif ($sort === 'sold_desc') {
        $orderBy = "pp.sold_quantity DESC";
    } elseif ($sort === 'discount_desc') {
        $orderBy = "discount_percent_calculated DESC";
    }


    // 8. Đếm tổng sản phẩm flash sale
    $countSql = "
        SELECT COUNT(DISTINCT pp.id) AS total
        FROM promotion_products pp
        JOIN promotion_campaigns pc
            ON pp.campaign_id = pc.id
        JOIN products p
            ON pp.product_id = p.id
        WHERE $whereSql
    ";

    $countStmt = $conn->prepare($countSql);
    $countStmt->execute($params);

    $totalProducts = (int) $countStmt->fetch()['total'];
    $totalPages = (int) ceil($totalProducts / $limit);


    // 9. Lấy danh sách sản phẩm flash sale
    $sql = "
        SELECT
            pp.id AS promotion_product_id,
            pp.campaign_id,
            pp.product_id,
            pp.variant_id,
            pp.sale_price,
            pp.discount_percent,
            pp.sale_stock_limit,
            pp.sold_quantity,
            pp.status AS promotion_product_status,
            pp.created_at AS promotion_product_created_at,

            pc.name AS campaign_name,
            pc.slug AS campaign_slug,
            pc.description AS campaign_description,
            pc.banner_image,
            pc.campaign_type,
            pc.start_date,
            pc.end_date,
            pc.status AS campaign_status,

            p.category_id,
            c.name AS category_name,
            c.slug AS category_slug,

            p.name AS product_name,
            p.slug AS product_slug,
            p.short_description,
            p.base_price,
            p.old_price,
            p.gender,
            p.material,
            p.brand,
            p.is_featured,
            p.is_new,
            p.is_sale,
            p.status AS product_status,

            COALESCE(pi.image_url, '../img/products/default.jpg') AS main_image,

            COALESCE(stock.total_stock, 0) AS total_stock,

            COALESCE(review.total_reviews, 0) AS total_reviews,
            COALESCE(review.average_rating, 0) AS average_rating,

            CASE
                WHEN pp.sale_price IS NOT NULL THEN pp.sale_price
                WHEN pp.discount_percent IS NOT NULL THEN p.base_price * (100 - pp.discount_percent) / 100
                ELSE p.base_price
            END AS final_sale_price,

            CASE
                WHEN pp.sale_price IS NOT NULL AND p.base_price > 0
                    THEN ROUND(((p.base_price - pp.sale_price) / p.base_price) * 100, 0)
                WHEN pp.discount_percent IS NOT NULL
                    THEN pp.discount_percent
                ELSE 0
            END AS discount_percent_calculated

        FROM promotion_products pp
        JOIN promotion_campaigns pc
            ON pp.campaign_id = pc.id
        JOIN products p
            ON pp.product_id = p.id
        JOIN categories c
            ON p.category_id = c.id

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

    $items = $stmt->fetchAll();


    // 10. Format dữ liệu trả về
    $formattedProducts = array_map(function ($item) {
        $saleStockLimit = $item['sale_stock_limit'] !== null ? (int) $item['sale_stock_limit'] : null;
        $soldQuantity = (int) $item['sold_quantity'];

        $remainingSaleStock = null;

        if ($saleStockLimit !== null) {
            $remainingSaleStock = max($saleStockLimit - $soldQuantity, 0);
        }

        $isSoldOut = false;

        if ($saleStockLimit !== null && $remainingSaleStock <= 0) {
            $isSoldOut = true;
        }

        if ((int) $item['total_stock'] <= 0) {
            $isSoldOut = true;
        }

        return [
            'promotion_product_id' => (int) $item['promotion_product_id'],

            'campaign' => [
                'id' => (int) $item['campaign_id'],
                'name' => $item['campaign_name'],
                'slug' => $item['campaign_slug'],
                'description' => $item['campaign_description'],
                'banner_image' => $item['banner_image'],
                'campaign_type' => $item['campaign_type'],
                'start_date' => $item['start_date'],
                'end_date' => $item['end_date'],
                'status' => $item['campaign_status']
            ],

            'product' => [
                'id' => (int) $item['product_id'],
                'category_id' => (int) $item['category_id'],

                'name' => $item['product_name'],
                'slug' => $item['product_slug'],
                'short_description' => $item['short_description'],

                'base_price' => (float) $item['base_price'],
                'old_price' => $item['old_price'] !== null ? (float) $item['old_price'] : null,

                'sale_price' => $item['sale_price'] !== null ? (float) $item['sale_price'] : null,
                'discount_percent' => $item['discount_percent'] !== null ? (float) $item['discount_percent'] : null,
                'final_sale_price' => (float) $item['final_sale_price'],
                'discount_percent_calculated' => (float) $item['discount_percent_calculated'],

                'gender' => $item['gender'],
                'material' => $item['material'],
                'brand' => $item['brand'],

                'is_featured' => (int) $item['is_featured'],
                'is_new' => (int) $item['is_new'],
                'is_sale' => (int) $item['is_sale'],
                'status' => $item['product_status'],

                'main_image' => $item['main_image'],

                'total_stock' => (int) $item['total_stock'],
                'total_reviews' => (int) $item['total_reviews'],
                'average_rating' => (float) $item['average_rating']
            ],

            'category' => [
                'name' => $item['category_name'],
                'slug' => $item['category_slug']
            ],

            'sale_info' => [
                'variant_id' => $item['variant_id'] !== null ? (int) $item['variant_id'] : null,
                'sale_stock_limit' => $saleStockLimit,
                'sold_quantity' => $soldQuantity,
                'remaining_sale_stock' => $remainingSaleStock,
                'is_sold_out' => $isSoldOut,
                'status' => $item['promotion_product_status'],
                'created_at' => $item['promotion_product_created_at']
            ]
        ];
    }, $items);


    // 11. Lấy thông tin campaign flash sale hiện tại
    $campaignInfo = null;

    if (count($items) > 0) {
        $first = $items[0];

        $campaignInfo = [
            'id' => (int) $first['campaign_id'],
            'name' => $first['campaign_name'],
            'slug' => $first['campaign_slug'],
            'description' => $first['campaign_description'],
            'banner_image' => $first['banner_image'],
            'campaign_type' => $first['campaign_type'],
            'start_date' => $first['start_date'],
            'end_date' => $first['end_date'],
            'status' => $first['campaign_status']
        ];
    }


    // 12. Trả kết quả
    sendSuccess('Lay san pham flash sale thanh cong', [
        'campaign' => $campaignInfo,
        'products' => $formattedProducts,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_products' => $totalProducts,
            'total_pages' => $totalPages
        ],
        'filters' => [
            'campaign_slug' => $campaignSlug,
            'sort' => $sort
        ]
    ]);

} catch (PDOException $e) {
    sendError('Lay san pham flash sale that bai', 500, [
        'database' => $e->getMessage()
    ]);
}