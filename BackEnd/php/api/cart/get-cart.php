<?php
// =========================================================
// File: api/cart/get-cart.php
// Mục đích: API lấy giỏ hàng hiện tại của người dùng
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
    sendError('Vui long dang nhap de xem gio hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Kết nối database
$conn = getDatabaseConnection();

try {
    // 5. Kiểm tra user còn tồn tại và đang active không
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


    // 6. Tìm giỏ hàng active của user
    $sql = "
        SELECT
            id,
            user_id,
            status,
            created_at,
            updated_at
        FROM carts
        WHERE user_id = :user_id
        AND status = 'active'
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId
    ]);

    $cart = $stmt->fetch();


    // 7. Nếu chưa có giỏ hàng active thì tạo mới
    if (!$cart) {
        $sql = "
            INSERT INTO carts (
                user_id,
                status
            )
            VALUES (
                :user_id,
                'active'
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId
        ]);

        $cartId = (int) $conn->lastInsertId();

        $cart = [
            'id' => $cartId,
            'user_id' => $userId,
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
    } else {
        $cartId = (int) $cart['id'];
    }


    // 8. Lấy danh sách sản phẩm trong giỏ hàng
    $sql = "
        SELECT
            ci.id AS cart_item_id,
            ci.cart_id,
            ci.variant_id,
            ci.quantity,
            ci.price_at_time,
            ci.created_at,
            ci.updated_at,

            pv.sku,
            pv.price AS current_variant_price,
            pv.old_price AS current_variant_old_price,
            pv.stock_quantity,
            pv.status AS variant_status,

            p.id AS product_id,
            p.name AS product_name,
            p.slug AS product_slug,
            p.base_price,
            p.old_price AS product_old_price,
            p.status AS product_status,

            c.name AS category_name,
            c.slug AS category_slug,

            cl.id AS color_id,
            cl.name AS color_name,
            cl.code AS color_code,
            cl.hex_code,

            s.id AS size_id,
            s.name AS size_name,
            s.code AS size_code,

            COALESCE(pi.image_url, '../img/products/default.jpg') AS image_url
        FROM cart_items ci
        JOIN product_variants pv
            ON ci.variant_id = pv.id
        JOIN products p
            ON pv.product_id = p.id
        JOIN categories c
            ON p.category_id = c.id
        JOIN colors cl
            ON pv.color_id = cl.id
        JOIN sizes s
            ON pv.size_id = s.id
        LEFT JOIN (
            SELECT
                product_id,
                MIN(image_url) AS image_url
            FROM product_images
            WHERE is_main = 1
            GROUP BY product_id
        ) pi
            ON p.id = pi.product_id
        WHERE ci.cart_id = :cart_id
        ORDER BY ci.id DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_id' => $cartId
    ]);

    $cartItems = $stmt->fetchAll();


    // 9. Format dữ liệu giỏ hàng
    $formattedItems = [];
    $totalItems = 0;
    $totalQuantity = 0;
    $subtotal = 0;

    foreach ($cartItems as $item) {
        $quantity = (int) $item['quantity'];
        $priceAtTime = (float) $item['price_at_time'];
        $totalPrice = $quantity * $priceAtTime;

        $totalItems++;
        $totalQuantity += $quantity;
        $subtotal += $totalPrice;

        $isAvailable = (
            $item['product_status'] === 'active'
            && $item['variant_status'] === 'active'
            && (int) $item['stock_quantity'] >= $quantity
        );

        $stockStatus = 'available';

        if ($item['product_status'] !== 'active') {
            $stockStatus = 'product_inactive';
        } elseif ($item['variant_status'] !== 'active') {
            $stockStatus = 'variant_inactive';
        } elseif ((int) $item['stock_quantity'] <= 0) {
            $stockStatus = 'out_of_stock';
        } elseif ((int) $item['stock_quantity'] < $quantity) {
            $stockStatus = 'not_enough_stock';
        }

        $formattedItems[] = [
            'cart_item_id' => (int) $item['cart_item_id'],
            'cart_id' => (int) $item['cart_id'],
            'variant_id' => (int) $item['variant_id'],

            'product' => [
                'id' => (int) $item['product_id'],
                'name' => $item['product_name'],
                'slug' => $item['product_slug'],
                'base_price' => (float) $item['base_price'],
                'old_price' => $item['product_old_price'] !== null ? (float) $item['product_old_price'] : null,
                'status' => $item['product_status'],
                'image_url' => $item['image_url']
            ],

            'category' => [
                'name' => $item['category_name'],
                'slug' => $item['category_slug']
            ],

            'color' => [
                'id' => (int) $item['color_id'],
                'name' => $item['color_name'],
                'code' => $item['color_code'],
                'hex_code' => $item['hex_code']
            ],

            'size' => [
                'id' => (int) $item['size_id'],
                'name' => $item['size_name'],
                'code' => $item['size_code']
            ],

            'sku' => $item['sku'],

            'quantity' => $quantity,
            'price_at_time' => $priceAtTime,
            'current_price' => $item['current_variant_price'] !== null
                ? (float) $item['current_variant_price']
                : (float) $item['base_price'],

            'total_price' => $totalPrice,

            'stock_quantity' => (int) $item['stock_quantity'],
            'is_available' => $isAvailable,
            'stock_status' => $stockStatus,

            'created_at' => $item['created_at'],
            'updated_at' => $item['updated_at']
        ];
    }


    // 10. Tổng kết giỏ hàng
    $summary = [
        'total_items' => $totalItems,
        'total_quantity' => $totalQuantity,
        'subtotal' => $subtotal,
        'shipping_fee' => 0,
        'discount_amount' => 0,
        'final_total' => $subtotal
    ];


    // 11. Trả kết quả
    sendSuccess('Lay gio hang thanh cong', [
        'cart' => [
            'id' => (int) $cart['id'],
            'user_id' => (int) $cart['user_id'],
            'status' => $cart['status'],
            'created_at' => $cart['created_at'],
            'updated_at' => $cart['updated_at']
        ],
        'user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email']
        ],
        'items' => $formattedItems,
        'summary' => $summary
    ]);

} catch (PDOException $e) {
    sendError('Lay gio hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}