<?php
// =========================================================
// File: api/products/get-product-detail.php
// Mục đích: API lấy chi tiết một sản phẩm
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
$productId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$productSlug = trim($_GET['slug'] ?? '');

if ($productId <= 0 && $productSlug === '') {
    sendError('Vui long truyen id hoac slug san pham', 422);
}


// 4. Kết nối database
$conn = getDatabaseConnection();

try {
    // 5. Lấy thông tin sản phẩm chính
    $whereSql = '';
    $params = [];

    if ($productId > 0) {
        $whereSql = 'p.id = :product_id';
        $params[':product_id'] = $productId;
    } else {
        $whereSql = 'p.slug = :product_slug';
        $params[':product_slug'] = $productSlug;
    }

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
            p.description,
            p.base_price,
            p.old_price,

            p.gender,
            p.material,
            p.brand,

            p.is_featured,
            p.is_new,
            p.is_sale,
            p.status,

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
        AND p.status = 'active'
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $product = $stmt->fetch();

    if (!$product) {
        sendError('Khong tim thay san pham', 404);
    }

    $currentProductId = (int) $product['id'];


    // 6. Lấy ảnh sản phẩm
    $sql = "
        SELECT
            id,
            variant_id,
            image_url,
            alt_text,
            is_main,
            sort_order
        FROM product_images
        WHERE product_id = :product_id
        ORDER BY is_main DESC, sort_order ASC, id ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':product_id' => $currentProductId
    ]);

    $images = $stmt->fetchAll();


    // 7. Lấy biến thể sản phẩm
    $sql = "
        SELECT
            pv.id,
            pv.product_id,
            pv.color_id,
            cl.name AS color_name,
            cl.code AS color_code,
            cl.hex_code,

            pv.size_id,
            s.name AS size_name,
            s.code AS size_code,
            s.sort_order AS size_sort_order,

            pv.sku,
            pv.price,
            pv.old_price,
            pv.stock_quantity,
            pv.status
        FROM product_variants pv
        JOIN colors cl
            ON pv.color_id = cl.id
        JOIN sizes s
            ON pv.size_id = s.id
        WHERE pv.product_id = :product_id
        AND pv.status = 'active'
        ORDER BY cl.id ASC, s.sort_order ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':product_id' => $currentProductId
    ]);

    $variants = $stmt->fetchAll();


    // 8. Lấy danh sách màu có trong sản phẩm
    $colors = [];

    foreach ($variants as $variant) {
        $colorId = (int) $variant['color_id'];

        if (!isset($colors[$colorId])) {
            $colors[$colorId] = [
                'id' => $colorId,
                'name' => $variant['color_name'],
                'code' => $variant['color_code'],
                'hex_code' => $variant['hex_code']
            ];
        }
    }

    $colors = array_values($colors);


    // 9. Lấy danh sách size có trong sản phẩm
    $sizes = [];

    foreach ($variants as $variant) {
        $sizeId = (int) $variant['size_id'];

        if (!isset($sizes[$sizeId])) {
            $sizes[$sizeId] = [
                'id' => $sizeId,
                'name' => $variant['size_name'],
                'code' => $variant['size_code'],
                'sort_order' => (int) $variant['size_sort_order']
            ];
        }
    }

    usort($sizes, function ($a, $b) {
        return $a['sort_order'] <=> $b['sort_order'];
    });

    $sizes = array_values($sizes);


    // 10. Format biến thể
    $formattedVariants = array_map(function ($variant) {
        return [
            'id' => (int) $variant['id'],
            'product_id' => (int) $variant['product_id'],

            'color' => [
                'id' => (int) $variant['color_id'],
                'name' => $variant['color_name'],
                'code' => $variant['color_code'],
                'hex_code' => $variant['hex_code']
            ],

            'size' => [
                'id' => (int) $variant['size_id'],
                'name' => $variant['size_name'],
                'code' => $variant['size_code']
            ],

            'sku' => $variant['sku'],
            'price' => $variant['price'] !== null ? (float) $variant['price'] : null,
            'old_price' => $variant['old_price'] !== null ? (float) $variant['old_price'] : null,
            'stock_quantity' => (int) $variant['stock_quantity'],
            'status' => $variant['status']
        ];
    }, $variants);


    // 11. Lấy đánh giá sản phẩm
    $sql = "
        SELECT
            pr.id,
            pr.rating,
            pr.content,
            pr.status,
            pr.created_at,

            u.id AS user_id,
            u.full_name,
            u.avatar
        FROM product_reviews pr
        LEFT JOIN users u
            ON pr.user_id = u.id
        WHERE pr.product_id = :product_id
        AND pr.status = 'active'
        ORDER BY pr.created_at DESC
        LIMIT 10
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':product_id' => $currentProductId
    ]);

    $reviews = $stmt->fetchAll();

    $formattedReviews = array_map(function ($review) {
        return [
            'id' => (int) $review['id'],
            'rating' => (int) $review['rating'],
            'content' => $review['content'],
            'status' => $review['status'],
            'created_at' => $review['created_at'],
            'user' => [
                'id' => $review['user_id'] !== null ? (int) $review['user_id'] : null,
                'full_name' => $review['full_name'],
                'avatar' => $review['avatar']
            ]
        ];
    }, $reviews);


    // 12. Lấy sản phẩm liên quan cùng danh mục
    $sql = "
        SELECT
            p.id,
            p.name,
            p.slug,
            p.base_price,
            p.old_price,
            COALESCE(pi.image_url, '../img/products/default.jpg') AS main_image
        FROM products p
        LEFT JOIN (
            SELECT
                product_id,
                MIN(image_url) AS image_url
            FROM product_images
            WHERE is_main = 1
            GROUP BY product_id
        ) pi
            ON p.id = pi.product_id
        WHERE p.category_id = :category_id
        AND p.id != :product_id
        AND p.status = 'active'
        ORDER BY p.created_at DESC
        LIMIT 4
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':category_id' => $product['category_id'],
        ':product_id' => $currentProductId
    ]);

    $relatedProducts = $stmt->fetchAll();

    $formattedRelatedProducts = array_map(function ($item) {
        return [
            'id' => (int) $item['id'],
            'name' => $item['name'],
            'slug' => $item['slug'],
            'base_price' => (float) $item['base_price'],
            'old_price' => $item['old_price'] !== null ? (float) $item['old_price'] : null,
            'main_image' => $item['main_image']
        ];
    }, $relatedProducts);


    // 13. Format ảnh
    $formattedImages = array_map(function ($image) {
        return [
            'id' => (int) $image['id'],
            'variant_id' => $image['variant_id'] !== null ? (int) $image['variant_id'] : null,
            'image_url' => $image['image_url'],
            'alt_text' => $image['alt_text'],
            'is_main' => (int) $image['is_main'],
            'sort_order' => (int) $image['sort_order']
        ];
    }, $images);


    // 14. Format sản phẩm chính
    $productData = [
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
        'description' => $product['description'],

        'base_price' => (float) $product['base_price'],
        'old_price' => $product['old_price'] !== null ? (float) $product['old_price'] : null,

        'gender' => $product['gender'],
        'material' => $product['material'],
        'brand' => $product['brand'],

        'is_featured' => (int) $product['is_featured'],
        'is_new' => (int) $product['is_new'],
        'is_sale' => (int) $product['is_sale'],
        'status' => $product['status'],

        'total_stock' => (int) $product['total_stock'],
        'total_reviews' => (int) $product['total_reviews'],
        'average_rating' => (float) $product['average_rating'],

        'images' => $formattedImages,
        'colors' => $colors,
        'sizes' => $sizes,
        'variants' => $formattedVariants,
        'reviews' => $formattedReviews,
        'related_products' => $formattedRelatedProducts,

        'created_at' => $product['created_at'],
        'updated_at' => $product['updated_at']
    ];


    // 15. Trả kết quả
    sendSuccess('Lay chi tiet san pham thanh cong', [
        'product' => $productData
    ]);

} catch (PDOException $e) {
    sendError('Lay chi tiet san pham that bai', 500, [
        'database' => $e->getMessage()
    ]);
}