<?php
// =========================================================
// File: api/cart/add-to-cart.php
// Mục đích: API thêm sản phẩm vào giỏ hàng
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
    sendError('Vui long dang nhap de them san pham vao gio hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy dữ liệu request
$variantId = isset($input['variant_id']) ? (int) $input['variant_id'] : 0;
$sku = trim($input['sku'] ?? '');
$quantity = isset($input['quantity']) ? (int) $input['quantity'] : 1;


// 6. Validate dữ liệu
$errors = [];

if ($variantId <= 0 && $sku === '') {
    $errors['variant'] = 'Vui long chon bien the san pham';
}

if ($quantity <= 0) {
    $errors['quantity'] = 'So luong phai lon hon 0';
}

if ($quantity > 99) {
    $errors['quantity'] = 'So luong khong duoc vuot qua 99';
}

if (!empty($errors)) {
    sendError('Du lieu khong hop le', 422, $errors);
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


    // 9. Lấy thông tin biến thể sản phẩm
    if ($variantId > 0) {
        $sql = "
            SELECT
                pv.id AS variant_id,
                pv.product_id,
                pv.color_id,
                pv.size_id,
                pv.sku,
                pv.price AS variant_price,
                pv.old_price AS variant_old_price,
                pv.stock_quantity,
                pv.status AS variant_status,

                p.name AS product_name,
                p.slug AS product_slug,
                p.base_price,
                p.old_price AS product_old_price,
                p.status AS product_status,

                cl.name AS color_name,
                s.name AS size_name,

                COALESCE(pi.image_url, '../img/products/default.jpg') AS image_url
            FROM product_variants pv
            JOIN products p
                ON pv.product_id = p.id
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
            WHERE pv.id = :variant_id
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':variant_id' => $variantId
        ]);
    } else {
        $sql = "
            SELECT
                pv.id AS variant_id,
                pv.product_id,
                pv.color_id,
                pv.size_id,
                pv.sku,
                pv.price AS variant_price,
                pv.old_price AS variant_old_price,
                pv.stock_quantity,
                pv.status AS variant_status,

                p.name AS product_name,
                p.slug AS product_slug,
                p.base_price,
                p.old_price AS product_old_price,
                p.status AS product_status,

                cl.name AS color_name,
                s.name AS size_name,

                COALESCE(pi.image_url, '../img/products/default.jpg') AS image_url
            FROM product_variants pv
            JOIN products p
                ON pv.product_id = p.id
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
            WHERE pv.sku = :sku
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':sku' => $sku
        ]);
    }

    $variant = $stmt->fetch();

    if (!$variant) {
        sendError('Khong tim thay bien the san pham', 404);
    }

    if ($variant['product_status'] !== 'active') {
        sendError('San pham hien khong hoat dong', 400);
    }

    if ($variant['variant_status'] !== 'active') {
        sendError('Bien the san pham hien khong hoat dong', 400);
    }

    if ((int) $variant['stock_quantity'] <= 0) {
        sendError('San pham da het hang', 400);
    }


    // 10. Bắt đầu transaction
    $conn->beginTransaction();


    // 11. Tìm giỏ hàng active của user
    $sql = "
        SELECT
            id
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


    // 12. Nếu chưa có giỏ hàng thì tạo mới
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
    } else {
        $cartId = (int) $cart['id'];
    }


    // 13. Kiểm tra sản phẩm đã có trong giỏ chưa
    $sql = "
        SELECT
            id,
            quantity
        FROM cart_items
        WHERE cart_id = :cart_id
        AND variant_id = :variant_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_id' => $cartId,
        ':variant_id' => (int) $variant['variant_id']
    ]);

    $existingItem = $stmt->fetch();


    // 14. Tính số lượng mới và kiểm tra tồn kho
    $currentQuantity = $existingItem ? (int) $existingItem['quantity'] : 0;
    $newQuantity = $currentQuantity + $quantity;
    $stockQuantity = (int) $variant['stock_quantity'];

    if ($newQuantity > $stockQuantity) {
        $conn->rollBack();

        sendError('So luong trong kho khong du', 400, [
            'stock_quantity' => $stockQuantity,
            'current_cart_quantity' => $currentQuantity,
            'request_quantity' => $quantity,
            'max_can_add' => max(0, $stockQuantity - $currentQuantity)
        ]);
    }


    // 15. Xác định giá tại thời điểm thêm vào giỏ
    $priceAtTime = $variant['variant_price'] !== null
        ? (float) $variant['variant_price']
        : (float) $variant['base_price'];


    // 16. Nếu đã có trong giỏ thì cập nhật số lượng
    if ($existingItem) {
        $sql = "
            UPDATE cart_items
            SET
                quantity = :quantity,
                price_at_time = :price_at_time,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :cart_item_id
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':quantity' => $newQuantity,
            ':price_at_time' => $priceAtTime,
            ':cart_item_id' => (int) $existingItem['id']
        ]);

        $cartItemId = (int) $existingItem['id'];
        $action = 'updated';
    } else {
        // 17. Nếu chưa có thì thêm mới
        $sql = "
            INSERT INTO cart_items (
                cart_id,
                variant_id,
                quantity,
                price_at_time
            )
            VALUES (
                :cart_id,
                :variant_id,
                :quantity,
                :price_at_time
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':cart_id' => $cartId,
            ':variant_id' => (int) $variant['variant_id'],
            ':quantity' => $quantity,
            ':price_at_time' => $priceAtTime
        ]);

        $cartItemId = (int) $conn->lastInsertId();
        $action = 'created';
    }


    // 18. Cập nhật thời gian giỏ hàng
    $sql = "
        UPDATE carts
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = :cart_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_id' => $cartId
    ]);


    // 19. Tính tổng giỏ hàng sau khi thêm
    $sql = "
        SELECT
            COUNT(id) AS total_items,
            COALESCE(SUM(quantity), 0) AS total_quantity,
            COALESCE(SUM(quantity * price_at_time), 0) AS subtotal
        FROM cart_items
        WHERE cart_id = :cart_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_id' => $cartId
    ]);

    $summary = $stmt->fetch();


    // 20. Hoàn tất transaction
    $conn->commit();


    // 21. Trả kết quả
    sendSuccess('Them san pham vao gio hang thanh cong', [
        'action' => $action,
        'cart' => [
            'id' => $cartId,
            'total_items' => (int) $summary['total_items'],
            'total_quantity' => (int) $summary['total_quantity'],
            'subtotal' => (float) $summary['subtotal']
        ],
        'cart_item' => [
            'id' => $cartItemId,
            'variant_id' => (int) $variant['variant_id'],
            'sku' => $variant['sku'],
            'product_name' => $variant['product_name'],
            'product_slug' => $variant['product_slug'],
            'color_name' => $variant['color_name'],
            'size_name' => $variant['size_name'],
            'image_url' => $variant['image_url'],
            'quantity' => $newQuantity,
            'price_at_time' => $priceAtTime,
            'total_price' => $newQuantity * $priceAtTime,
            'stock_quantity' => $stockQuantity
        ]
    ], 201);

} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Them san pham vao gio hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}