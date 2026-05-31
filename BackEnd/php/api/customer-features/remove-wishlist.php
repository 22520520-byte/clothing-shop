<?php
// =========================================================
// File: api/customer-features/remove-wishlist.php
// Mục đích: API xóa sản phẩm khỏi danh sách yêu thích
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
    sendError('Vui long dang nhap de xoa san pham yeu thich', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy dữ liệu request
$wishlistId = isset($input['wishlist_id']) ? (int) $input['wishlist_id'] : 0;
$productId = isset($input['product_id']) ? (int) $input['product_id'] : 0;
$productSlug = trim($input['product_slug'] ?? $input['slug'] ?? '');


// 6. Validate dữ liệu
if ($wishlistId <= 0 && $productId <= 0 && $productSlug === '') {
    sendError('Vui long truyen wishlist_id hoac product_id hoac product_slug', 422);
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


    // 9. Tìm wishlist cần xóa
    if ($wishlistId > 0) {
        $sql = "
            SELECT
                w.id AS wishlist_id,
                w.user_id,
                w.product_id,
                w.created_at,

                p.name AS product_name,
                p.slug AS product_slug,
                p.base_price,
                p.old_price,
                p.status AS product_status,

                COALESCE(pi.image_url, '../img/products/default.jpg') AS main_image
            FROM wishlists w
            JOIN products p
                ON w.product_id = p.id
            LEFT JOIN (
                SELECT
                    product_id,
                    MIN(image_url) AS image_url
                FROM product_images
                WHERE is_main = 1
                GROUP BY product_id
            ) pi
                ON p.id = pi.product_id
            WHERE w.id = :wishlist_id
            AND w.user_id = :user_id_wishlist
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':wishlist_id' => $wishlistId,
            ':user_id_wishlist' => $userId
        ]);
    } elseif ($productId > 0) {
        $sql = "
            SELECT
                w.id AS wishlist_id,
                w.user_id,
                w.product_id,
                w.created_at,

                p.name AS product_name,
                p.slug AS product_slug,
                p.base_price,
                p.old_price,
                p.status AS product_status,

                COALESCE(pi.image_url, '../img/products/default.jpg') AS main_image
            FROM wishlists w
            JOIN products p
                ON w.product_id = p.id
            LEFT JOIN (
                SELECT
                    product_id,
                    MIN(image_url) AS image_url
                FROM product_images
                WHERE is_main = 1
                GROUP BY product_id
            ) pi
                ON p.id = pi.product_id
            WHERE w.product_id = :product_id
            AND w.user_id = :user_id_product
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':product_id' => $productId,
            ':user_id_product' => $userId
        ]);
    } else {
        $sql = "
            SELECT
                w.id AS wishlist_id,
                w.user_id,
                w.product_id,
                w.created_at,

                p.name AS product_name,
                p.slug AS product_slug,
                p.base_price,
                p.old_price,
                p.status AS product_status,

                COALESCE(pi.image_url, '../img/products/default.jpg') AS main_image
            FROM wishlists w
            JOIN products p
                ON w.product_id = p.id
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
            AND w.user_id = :user_id_slug
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':product_slug' => $productSlug,
            ':user_id_slug' => $userId
        ]);
    }

    $wishlist = $stmt->fetch();

    if (!$wishlist) {
        sendError('Khong tim thay san pham trong danh sach yeu thich', 404);
    }


    // 10. Xóa wishlist
    $sql = "
        DELETE FROM wishlists
        WHERE id = :wishlist_id_delete
        AND user_id = :user_id_delete
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':wishlist_id_delete' => (int) $wishlist['wishlist_id'],
        ':user_id_delete' => $userId
    ]);


    // 11. Đếm lại tổng wishlist
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


    // 12. Trả kết quả
    sendSuccess('Xoa san pham yeu thich thanh cong', [
        'removed_wishlist' => [
            'id' => (int) $wishlist['wishlist_id'],
            'created_at' => $wishlist['created_at']
        ],
        'product' => [
            'id' => (int) $wishlist['product_id'],
            'name' => $wishlist['product_name'],
            'slug' => $wishlist['product_slug'],
            'base_price' => (float) $wishlist['base_price'],
            'old_price' => $wishlist['old_price'] !== null ? (float) $wishlist['old_price'] : null,
            'status' => $wishlist['product_status'],
            'main_image' => $wishlist['main_image']
        ],
        'summary' => [
            'total_wishlist' => $totalWishlist
        ]
    ]);

} catch (PDOException $e) {
    sendError('Xoa san pham yeu thich that bai', 500, [
        'database' => $e->getMessage()
    ]);
}