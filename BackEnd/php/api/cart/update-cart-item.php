<?php
// =========================================================
// File: api/cart/update-cart-item.php
// Mục đích: API cập nhật số lượng sản phẩm trong giỏ hàng
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
    sendError('Vui long dang nhap de cap nhat gio hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy dữ liệu request
$cartItemId = isset($input['cart_item_id']) ? (int) $input['cart_item_id'] : 0;
$quantity = isset($input['quantity']) ? (int) $input['quantity'] : 0;


// 6. Validate dữ liệu
$errors = [];

if ($cartItemId <= 0) {
    $errors['cart_item_id'] = 'Vui long truyen ma san pham trong gio hang';
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
    // 8. Lấy giỏ hàng active của user
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

    if (!$cart) {
        sendError('Khong tim thay gio hang', 404);
    }

    $cartId = (int) $cart['id'];


    // 9. Lấy sản phẩm trong giỏ hàng
    $sql = "
        SELECT
            ci.id AS cart_item_id,
            ci.cart_id,
            ci.variant_id,
            ci.quantity AS current_quantity,
            ci.price_at_time,

            pv.sku,
            pv.stock_quantity,
            pv.status AS variant_status,

            p.name AS product_name,
            p.slug AS product_slug,
            p.status AS product_status,

            cl.name AS color_name,
            s.name AS size_name
        FROM cart_items ci
        JOIN product_variants pv
            ON ci.variant_id = pv.id
        JOIN products p
            ON pv.product_id = p.id
        JOIN colors cl
            ON pv.color_id = cl.id
        JOIN sizes s
            ON pv.size_id = s.id
        WHERE ci.id = :cart_item_id
        AND ci.cart_id = :cart_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_item_id' => $cartItemId,
        ':cart_id' => $cartId
    ]);

    $cartItem = $stmt->fetch();

    if (!$cartItem) {
        sendError('Khong tim thay san pham trong gio hang', 404);
    }


    // 10. Kiểm tra trạng thái sản phẩm
    if ($cartItem['product_status'] !== 'active') {
        sendError('San pham hien khong hoat dong', 400);
    }

    if ($cartItem['variant_status'] !== 'active') {
        sendError('Bien the san pham hien khong hoat dong', 400);
    }


    // 11. Kiểm tra tồn kho
    $stockQuantity = (int) $cartItem['stock_quantity'];

    if ($stockQuantity <= 0) {
        sendError('San pham da het hang', 400);
    }

    if ($quantity > $stockQuantity) {
        sendError('So luong trong kho khong du', 400, [
            'stock_quantity' => $stockQuantity,
            'request_quantity' => $quantity
        ]);
    }


    // 12. Bắt đầu transaction
    $conn->beginTransaction();


    // 13. Cập nhật số lượng sản phẩm trong giỏ
    $sql = "
        UPDATE cart_items
        SET
            quantity = :quantity,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :cart_item_id
        AND cart_id = :cart_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':quantity' => $quantity,
        ':cart_item_id' => $cartItemId,
        ':cart_id' => $cartId
    ]);


    // 14. Cập nhật thời gian giỏ hàng
    $sql = "
        UPDATE carts
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = :cart_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_id' => $cartId
    ]);


    // 15. Tính tổng giỏ hàng sau khi cập nhật
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


    // 16. Hoàn tất transaction
    $conn->commit();


    // 17. Trả kết quả
    sendSuccess('Cap nhat gio hang thanh cong', [
        'cart' => [
            'id' => $cartId,
            'total_items' => (int) $summary['total_items'],
            'total_quantity' => (int) $summary['total_quantity'],
            'subtotal' => (float) $summary['subtotal']
        ],
        'cart_item' => [
            'id' => $cartItemId,
            'variant_id' => (int) $cartItem['variant_id'],
            'sku' => $cartItem['sku'],
            'product_name' => $cartItem['product_name'],
            'product_slug' => $cartItem['product_slug'],
            'color_name' => $cartItem['color_name'],
            'size_name' => $cartItem['size_name'],
            'quantity' => $quantity,
            'price_at_time' => (float) $cartItem['price_at_time'],
            'total_price' => $quantity * (float) $cartItem['price_at_time'],
            'stock_quantity' => $stockQuantity
        ]
    ]);

} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Cap nhat gio hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}