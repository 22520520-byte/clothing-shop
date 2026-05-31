<?php
// =========================================================
// File: api/cart/remove-cart-item.php
// Mục đích: API xóa một sản phẩm khỏi giỏ hàng
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
    sendError('Vui long dang nhap de xoa san pham khoi gio hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy dữ liệu request
$cartItemId = isset($input['cart_item_id']) ? (int) $input['cart_item_id'] : 0;


// 6. Validate dữ liệu
if ($cartItemId <= 0) {
    sendError('Vui long truyen ma san pham trong gio hang', 422, [
        'cart_item_id' => 'Cart item ID khong hop le'
    ]);
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


    // 9. Kiểm tra sản phẩm có thuộc giỏ hàng của user không
    $sql = "
        SELECT
            ci.id AS cart_item_id,
            ci.cart_id,
            ci.variant_id,
            ci.quantity,
            ci.price_at_time,

            pv.sku,

            p.name AS product_name,
            p.slug AS product_slug,

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


    // 10. Bắt đầu transaction
    $conn->beginTransaction();


    // 11. Xóa sản phẩm khỏi giỏ hàng
    $sql = "
        DELETE FROM cart_items
        WHERE id = :cart_item_id
        AND cart_id = :cart_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_item_id' => $cartItemId,
        ':cart_id' => $cartId
    ]);


    // 12. Cập nhật thời gian giỏ hàng
    $sql = "
        UPDATE carts
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = :cart_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_id' => $cartId
    ]);


    // 13. Tính tổng giỏ hàng sau khi xóa
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


    // 14. Hoàn tất transaction
    $conn->commit();


    // 15. Trả kết quả
    sendSuccess('Xoa san pham khoi gio hang thanh cong', [
        'removed_item' => [
            'id' => (int) $cartItem['cart_item_id'],
            'variant_id' => (int) $cartItem['variant_id'],
            'sku' => $cartItem['sku'],
            'product_name' => $cartItem['product_name'],
            'product_slug' => $cartItem['product_slug'],
            'color_name' => $cartItem['color_name'],
            'size_name' => $cartItem['size_name'],
            'quantity' => (int) $cartItem['quantity'],
            'price_at_time' => (float) $cartItem['price_at_time'],
            'total_price' => (int) $cartItem['quantity'] * (float) $cartItem['price_at_time']
        ],
        'cart' => [
            'id' => $cartId,
            'total_items' => (int) $summary['total_items'],
            'total_quantity' => (int) $summary['total_quantity'],
            'subtotal' => (float) $summary['subtotal']
        ]
    ]);

} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Xoa san pham khoi gio hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}