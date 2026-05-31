<?php
// =========================================================
// File: api/promotions/get-campaign-detail.php
// Mục đích: API lấy chi tiết một chương trình khuyến mãi
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
$campaignId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$campaignSlug = trim($_GET['slug'] ?? '');

$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 12;
$sort = trim($_GET['sort'] ?? 'latest');

if ($campaignId <= 0 && $campaignSlug === '') {
    sendError('Vui long truyen id hoac slug chuong trinh khuyen mai', 422);
}


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
    // 6. Tạo điều kiện lấy campaign
    if ($campaignId > 0) {
        $whereCampaignSql = "id = :campaign_id";
        $campaignParams = [
            ':campaign_id' => $campaignId
        ];
    } else {
        $whereCampaignSql = "slug = :campaign_slug";
        $campaignParams = [
            ':campaign_slug' => $campaignSlug
        ];
    }


    // 7. Lấy thông tin campaign
    $sql = "
        SELECT
            id,
            name,
            slug,
            description,
            banner_image,
            campaign_type,
            start_date,
            end_date,
            status,
            created_at,
            updated_at
        FROM promotion_campaigns
        WHERE $whereCampaignSql
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($campaignParams);

    $campaign = $stmt->fetch();

    if (!$campaign) {
        sendError('Khong tim thay chuong trinh khuyen mai', 404);
    }

    $currentCampaignId = (int) $campaign['id'];


    // 8. Tính trạng thái campaign
    $now = time();
    $startTime = strtotime($campaign['start_date']);
    $endTime = strtotime($campaign['end_date']);

    $isStarted = $now >= $startTime;
    $isEnded = $now > $endTime;

    $isAvailable = (
        $campaign['status'] === 'active'
        && $isStarted
        && !$isEnded
    );

    $campaignTypeLabels = [
        'flash_sale' => 'Flash Sale',
        'big_voucher' => 'Big Voucher',
        'seasonal_sale' => 'Sale theo mùa',
        'normal' => 'Khuyến mãi thường'
    ];

    $statusLabels = [
        'active' => 'Đang hoạt động',
        'inactive' => 'Tạm ẩn',
        'ended' => 'Đã kết thúc'
    ];


    // 9. Sắp xếp sản phẩm trong campaign
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


    // 10. Đếm tổng sản phẩm trong campaign
    $sql = "
        SELECT COUNT(*) AS total
        FROM promotion_products pp
        JOIN products p
            ON pp.product_id = p.id
        WHERE pp.campaign_id = :campaign_id_count
        AND pp.status = 'active'
        AND p.status = 'active'
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':campaign_id_count' => $currentCampaignId
    ]);

    $totalProducts = (int) $stmt->fetch()['total'];
    $totalPages = (int) ceil($totalProducts / $limit);


    // 11. Lấy danh sách sản phẩm trong campaign
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

        WHERE pp.campaign_id = :campaign_id_products
        AND pp.status = 'active'
        AND p.status = 'active'

        ORDER BY $orderBy
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':campaign_id_products' => $currentCampaignId
    ]);

    $items = $stmt->fetchAll();


    // 12. Format danh sách sản phẩm
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


    // 13. Thống kê campaign
    $sql = "
        SELECT
            COUNT(id) AS total_products,
            COALESCE(SUM(sale_stock_limit), 0) AS total_sale_stock_limit,
            COALESCE(SUM(sold_quantity), 0) AS total_sold_quantity
        FROM promotion_products
        WHERE campaign_id = :campaign_id_summary
        AND status = 'active'
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':campaign_id_summary' => $currentCampaignId
    ]);

    $summary = $stmt->fetch();


    // 14. Format campaign
    $campaignData = [
        'id' => (int) $campaign['id'],
        'name' => $campaign['name'],
        'slug' => $campaign['slug'],
        'description' => $campaign['description'],
        'banner_image' => $campaign['banner_image'],

        'campaign_type' => $campaign['campaign_type'],
        'campaign_type_label' => $campaignTypeLabels[$campaign['campaign_type']] ?? $campaign['campaign_type'],

        'start_date' => $campaign['start_date'],
        'end_date' => $campaign['end_date'],

        'status' => $campaign['status'],
        'status_label' => $statusLabels[$campaign['status']] ?? $campaign['status'],

        'state' => [
            'is_started' => $isStarted,
            'is_ended' => $isEnded,
            'is_available' => $isAvailable
        ],

        'summary' => [
            'total_products' => (int) $summary['total_products'],
            'total_sale_stock_limit' => (int) $summary['total_sale_stock_limit'],
            'total_sold_quantity' => (int) $summary['total_sold_quantity']
        ],

        'created_at' => $campaign['created_at'],
        'updated_at' => $campaign['updated_at']
    ];


    // 15. Trả kết quả
    sendSuccess('Lay chi tiet chuong trinh khuyen mai thanh cong', [
        'campaign' => $campaignData,
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
    sendError('Lay chi tiet chuong trinh khuyen mai that bai', 500, [
        'database' => $e->getMessage()
    ]);
}