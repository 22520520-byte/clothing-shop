<?php
// =========================================================
// File: api/admin/products/get-product-detail.php
// Mục đích: API admin lấy chi tiết sản phẩm để xem/sửa
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
    sendError('Vui long dang nhap de xem chi tiet san pham', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số sản phẩm
$productId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$productSlug = trim($_GET['slug'] ?? '');

if ($productId <= 0 && $productSlug === '') {
    sendError('Vui long truyen id hoac slug san pham', 422);
}


// 5. Kết nối database
$conn = getDatabaseConnection();

try {
    // 6. Kiểm tra quyền admin/staff
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
        sendError('Ban khong co quyen xem chi tiet san pham', 403);
    }


    // 7. Tạo điều kiện tìm sản phẩm
    if ($productId > 0) {
        $whereSql = "p.id = :product_id";
        $params = [
            ':product_id' => $productId
        ];
    } else {
        $whereSql = "p.slug = :product_slug";
        $params = [
            ':product_slug' => $productSlug
        ];
    }


    // 8. Lấy thông tin sản phẩm chính
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

            p.created_at,
            p.updated_at

        FROM products p
        JOIN categories c
            ON p.category_id = c.id
        LEFT JOIN categories parent
            ON c.parent_id = parent.id
        WHERE $whereSql
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $product = $stmt->fetch();

    if (!$product) {
        sendError('Khong tim thay san pham', 404);
    }

    $currentProductId = (int) $product['id'];


    // 9. Lấy danh sách ảnh sản phẩm
    $sql = "
        SELECT
            id,
            product_id,
            image_url,
            is_main
        FROM product_images
        WHERE product_id = :product_id_images
        ORDER BY is_main DESC, id ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':product_id_images' => $currentProductId
    ]);

    $images = $stmt->fetchAll();


    // 10. Lấy danh sách biến thể sản phẩm
    $sql = "
        SELECT
            pv.id,
            pv.product_id,
            pv.color_id,
            pv.size_id,
            pv.sku,
            pv.stock_quantity,
            pv.status,
            pv.created_at,
            pv.updated_at,

            co.name AS color_name,
            co.code AS color_code,
            co.hex_code AS color_hex_code,

            s.name AS size_name,
            s.code AS size_code

        FROM product_variants pv
        LEFT JOIN colors co
            ON pv.color_id = co.id
        LEFT JOIN sizes s
            ON pv.size_id = s.id
        WHERE pv.product_id = :product_id_variants
        ORDER BY pv.id ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':product_id_variants' => $currentProductId
    ]);

    $variants = $stmt->fetchAll();


    // 11. Lấy thống kê đánh giá
    $sql = "
        SELECT
            COUNT(id) AS total_reviews,
            COALESCE(ROUND(AVG(rating), 1), 0) AS average_rating,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS rating_5,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS rating_4,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS rating_3,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS rating_2,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS rating_1
        FROM product_reviews
        WHERE product_id = :product_id_reviews
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':product_id_reviews' => $currentProductId
    ]);

    $reviewSummary = $stmt->fetch();


    // 12. Lấy lịch sử nhập/xuất kho gần nhất của sản phẩm
    $sql = "
        SELECT
            psl.id,
            psl.variant_id,
            psl.user_id,
            psl.change_type,
            psl.quantity_change,
            psl.quantity_before,
            psl.quantity_after,
            psl.note,
            psl.created_at,

            pv.sku,
            u.full_name AS actor_name

        FROM product_stock_logs psl
        JOIN product_variants pv
            ON psl.variant_id = pv.id
        LEFT JOIN users u
            ON psl.user_id = u.id
        WHERE pv.product_id = :product_id_stock_logs
        ORDER BY psl.created_at DESC, psl.id DESC
        LIMIT 10
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':product_id_stock_logs' => $currentProductId
    ]);

    $stockLogs = $stmt->fetchAll();


    // 13. Format ảnh sản phẩm
    $formattedImages = array_map(function ($image) {
        return [
            'id' => (int) $image['id'],
            'product_id' => (int) $image['product_id'],
            'image_url' => $image['image_url'],
            'is_main' => (int) $image['is_main']
        ];
    }, $images);

    $mainImage = null;

    foreach ($formattedImages as $image) {
        if ((int) $image['is_main'] === 1) {
            $mainImage = $image['image_url'];
            break;
        }
    }

    if ($mainImage === null && count($formattedImages) > 0) {
        $mainImage = $formattedImages[0]['image_url'];
    }

    if ($mainImage === null) {
        $mainImage = '../img/products/default.jpg';
    }


    // 14. Format biến thể sản phẩm
    $totalStock = 0;
    $activeVariants = 0;

    $formattedVariants = array_map(function ($variant) use (&$totalStock, &$activeVariants) {
        $stockQuantity = (int) $variant['stock_quantity'];
        $totalStock += $stockQuantity;

        if ($variant['status'] === 'active') {
            $activeVariants++;
        }

        $stockStatus = 'available';

        if ($stockQuantity <= 0) {
            $stockStatus = 'out_of_stock';
        } elseif ($stockQuantity <= 5) {
            $stockStatus = 'low_stock';
        }

        $stockStatusLabels = [
            'available' => 'Còn hàng',
            'low_stock' => 'Sắp hết',
            'out_of_stock' => 'Hết hàng'
        ];

        return [
            'id' => (int) $variant['id'],
            'product_id' => (int) $variant['product_id'],
            'sku' => $variant['sku'],

            'color' => [
                'id' => $variant['color_id'] !== null ? (int) $variant['color_id'] : null,
                'name' => $variant['color_name'],
                'code' => $variant['color_code'],
                'hex_code' => $variant['color_hex_code']
            ],

            'size' => [
                'id' => $variant['size_id'] !== null ? (int) $variant['size_id'] : null,
                'name' => $variant['size_name'],
                'code' => $variant['size_code']
            ],

            'stock_quantity' => $stockQuantity,
            'stock_status' => $stockStatus,
            'stock_status_label' => $stockStatusLabels[$stockStatus],

            'status' => $variant['status'],

            'created_at' => $variant['created_at'],
            'updated_at' => $variant['updated_at']
        ];
    }, $variants);


    // 15. Format lịch sử kho
    $formattedStockLogs = array_map(function ($log) {
        $changeTypeLabels = [
            'import' => 'Nhập kho',
            'export' => 'Xuất kho',
            'order' => 'Bán hàng',
            'cancel' => 'Hoàn kho khi hủy đơn',
            'adjust' => 'Điều chỉnh'
        ];

        return [
            'id' => (int) $log['id'],
            'variant_id' => (int) $log['variant_id'],
            'sku' => $log['sku'],

            'user_id' => $log['user_id'] !== null ? (int) $log['user_id'] : null,
            'actor_name' => $log['actor_name'],

            'change_type' => $log['change_type'],
            'change_type_label' => $changeTypeLabels[$log['change_type']] ?? $log['change_type'],

            'quantity_change' => (int) $log['quantity_change'],
            'quantity_before' => (int) $log['quantity_before'],
            'quantity_after' => (int) $log['quantity_after'],

            'note' => $log['note'],
            'created_at' => $log['created_at']
        ];
    }, $stockLogs);


    // 16. Format trạng thái sản phẩm
    $productStatusLabels = [
        'active' => 'Đang bán',
        'inactive' => 'Tạm ẩn'
    ];

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


    // 17. Format dữ liệu sản phẩm
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

        'base_price' => (float) $product['base_price'],
        'old_price' => $product['old_price'] !== null ? (float) $product['old_price'] : null,

        'gender' => $product['gender'],
        'material' => $product['material'],
        'brand' => $product['brand'],

        'is_featured' => (int) $product['is_featured'],
        'is_new' => (int) $product['is_new'],
        'is_sale' => (int) $product['is_sale'],

        'status' => $product['status'],
        'status_label' => $productStatusLabels[$product['status']] ?? $product['status'],

        'main_image' => $mainImage,

        'images' => $formattedImages,
        'variants' => $formattedVariants,

        'variant_summary' => [
            'total_variants' => count($formattedVariants),
            'active_variants' => $activeVariants,
            'total_stock' => $totalStock,
            'stock_status' => $stockStatus,
            'stock_status_label' => $stockStatusLabels[$stockStatus]
        ],

        'review_summary' => [
            'total_reviews' => (int) ($reviewSummary['total_reviews'] ?? 0),
            'average_rating' => (float) ($reviewSummary['average_rating'] ?? 0),
            'rating_5' => (int) ($reviewSummary['rating_5'] ?? 0),
            'rating_4' => (int) ($reviewSummary['rating_4'] ?? 0),
            'rating_3' => (int) ($reviewSummary['rating_3'] ?? 0),
            'rating_2' => (int) ($reviewSummary['rating_2'] ?? 0),
            'rating_1' => (int) ($reviewSummary['rating_1'] ?? 0)
        ],

        'stock_logs' => $formattedStockLogs,

        'created_at' => $product['created_at'],
        'updated_at' => $product['updated_at']
    ];


    // 18. Trả kết quả
    sendSuccess('Admin lay chi tiet san pham thanh cong', [
        'current_user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => [
                'code' => $user['role_code'],
                'name' => $user['role_name']
            ]
        ],
        'product' => $productData
    ]);

} catch (PDOException $e) {
    sendError('Admin lay chi tiet san pham that bai', 500, [
        'database' => $e->getMessage()
    ]);
}