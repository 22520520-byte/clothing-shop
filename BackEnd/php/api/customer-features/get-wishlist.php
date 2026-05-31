<?php
// =========================================================
// File: api/customer-features/get-wishlist.php
// Mục đích: API lấy danh sách sản phẩm yêu thích của user
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
    sendError('Vui long dang nhap de xem san pham yeu thich', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Lấy tham số phân trang
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 12;

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
    // 6. Kiểm tra user
    $sql = "
        SELECT
            id,
            full_name,
            email,
            status
        FROM users
        WHERE id = :user_id
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


    // 7. Đếm tổng sản phẩm yêu thích
    $sql = "
        SELECT COUNT(*) AS total
        FROM wishlists
        WHERE user_id = :user_id_count
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_count' => $userId
    ]);

    $totalWishlist = (int) $stmt->fetch()['total'];
    $totalPages = (int) ceil($totalWishlist / $limit);


    // 8. Lấy danh sách sản phẩm yêu thích
    $sql = "
        SELECT
            w.id AS wishlist_id,
            w.created_at AS added_at,

            p.id AS product_id,
            p.category_id,
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

            c.name AS category_name,
            c.slug AS category_slug,

            COALESCE(pi.image_url, '../img/products/default.jpg') AS main_image,

            COALESCE(stock.total_stock, 0) AS total_stock,

            COALESCE(review.total_reviews, 0) AS total_reviews,
            COALESCE(review.average_rating, 0) AS average_rating

        FROM wishlists w
        JOIN products p
            ON w.product_id = p.id
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

        WHERE w.user_id = :user_id
        ORDER BY w.created_at DESC, w.id DESC
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId
    ]);

    $wishlistItems = $stmt->fetchAll();


    // 9. Format dữ liệu trả về
    $formattedItems = array_map(function ($item) {
        return [
            'wishlist_id' => (int) $item['wishlist_id'],
            'added_at' => $item['added_at'],

            'product' => [
                'id' => (int) $item['product_id'],
                'category_id' => (int) $item['category_id'],

                'name' => $item['product_name'],
                'slug' => $item['product_slug'],
                'short_description' => $item['short_description'],

                'base_price' => (float) $item['base_price'],
                'old_price' => $item['old_price'] !== null ? (float) $item['old_price'] : null,

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
            ]
        ];
    }, $wishlistItems);


    // 10. Trả kết quả
    sendSuccess('Lay danh sach san pham yeu thich thanh cong', [
        'user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email']
        ],
        'wishlist' => $formattedItems,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_wishlist' => $totalWishlist,
            'total_pages' => $totalPages
        ]
    ]);

} catch (PDOException $e) {
    sendError('Lay danh sach san pham yeu thich that bai', 500, [
        'database' => $e->getMessage()
    ]);
}