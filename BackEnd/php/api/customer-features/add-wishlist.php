<?php
// =========================================================
// File: api/customer-features/add-wishlist.php
// Mục đích: API thêm sản phẩm vào danh sách yêu thích
// Method: POST
// =========================================================

session_start();

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/response.php';


// 1. Cho phép gọi API từ frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}


// 2. Chỉ cho phép POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Phuong thuc khong hop le', 405);
}


// 3. Kiểm tra đăng nhập
if (empty($_SESSION['user_id'])) {
    sendError('Vui long dang nhap de them san pham yeu thich', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy dữ liệu request
$productId = isset($input['product_id']) ? (int) $input['product_id'] : 0;
$productSlug = trim($input['product_slug'] ?? $input['slug'] ?? '');


// 6. Validate dữ liệu
if ($productId <= 0 && $productSlug === '') {
    sendError('Vui long truyen ma san pham hoac slug san pham', 422);
}


// 7. Kết nối database
$conn = getDatabaseConnection();

try {
    // 8. Kiểm tra user
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


    // 9. Lấy thông tin sản phẩm
    if ($productId > 0) {
        $sql = "
            SELECT
                p.id,
                p.name,
                p.slug,
                p.base_price,
                p.old_price,
                p.status,
                c.name AS category_name,
                c.slug AS category_slug,
                COALESCE(pi.image_url, '../img/products/default.jpg') AS main_image
            FROM products p
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
            WHERE p.id = :product_id
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':product_id' => $productId
        ]);
    } else {
        $sql = "
            SELECT
                p.id,
                p.name,
                p.slug,
                p.base_price,
                p.old_price,
                p.status,
                c.name AS category_name,
                c.slug AS category_slug,
                COALESCE(pi.image_url, '../img/products/default.jpg') AS main_image
            FROM products p
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
            WHERE p.slug = :product_slug
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':product_slug' => $productSlug
        ]);
    }

    $product = $stmt->fetch();

    if (!$product) {
        sendError('Khong tim thay san pham', 404);
    }

    if ($product['status'] !== 'active') {
        sendError('San pham hien khong hoat dong', 400);
    }

    $currentProductId = (int) $product['id'];


    // 10. Kiểm tra sản phẩm đã có trong wishlist chưa
    $sql = "
        SELECT
            id,
            created_at
        FROM wishlists
        WHERE user_id = :user_id_check
        AND product_id = :product_id_check
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_check' => $userId,
        ':product_id_check' => $currentProductId
    ]);

    $existingWishlist = $stmt->fetch();

    if ($existingWishlist) {
        sendSuccess('San pham da co trong danh sach yeu thich', [
            'action' => 'exists',
            'wishlist' => [
                'id' => (int) $existingWishlist['id'],
                'created_at' => $existingWishlist['created_at']
            ],
            'product' => [
                'id' => $currentProductId,
                'name' => $product['name'],
                'slug' => $product['slug'],
                'base_price' => (float) $product['base_price'],
                'old_price' => $product['old_price'] !== null ? (float) $product['old_price'] : null,
                'main_image' => $product['main_image']
            ]
        ]);
    }


    // 11. Thêm vào wishlist
    $sql = "
        INSERT INTO wishlists (
            user_id,
            product_id
        )
        VALUES (
            :user_id_insert,
            :product_id_insert
        )
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_insert' => $userId,
        ':product_id_insert' => $currentProductId
    ]);

    $wishlistId = (int) $conn->lastInsertId();


    // 12. Đếm lại tổng wishlist
    $sql = "
        SELECT COUNT(*) AS total_wishlist
        FROM wishlists
        WHERE user_id = :user_id_count
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_count' => $userId
    ]);

    $totalWishlist = (int) $stmt->fetch()['total_wishlist'];


    // 13. Trả kết quả
    sendSuccess('Them san pham yeu thich thanh cong', [
        'action' => 'created',
        'wishlist' => [
            'id' => $wishlistId
        ],
        'product' => [
            'id' => $currentProductId,
            'name' => $product['name'],
            'slug' => $product['slug'],
            'base_price' => (float) $product['base_price'],
            'old_price' => $product['old_price'] !== null ? (float) $product['old_price'] : null,
            'main_image' => $product['main_image'],
            'category' => [
                'name' => $product['category_name'],
                'slug' => $product['category_slug']
            ]
        ],
        'summary' => [
            'total_wishlist' => $totalWishlist
        ]
    ], 201);

} catch (PDOException $e) {
    sendError('Them san pham yeu thich that bai', 500, [
        'database' => $e->getMessage()
    ]);
}