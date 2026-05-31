<?php
// =========================================================
// File: api/cart/clear-cart.php
// Mục đích: API xóa toàn bộ sản phẩm trong giỏ hàng
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
    sendError('Vui long dang nhap de xoa gio hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Kết nối database
$conn = getDatabaseConnection();

try {
    // 5. Lấy giỏ hàng active của user
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


    // 6. Đếm số sản phẩm trước khi xóa
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

    $oldSummary = $stmt->fetch();


    // 7. Bắt đầu transaction
    $conn->beginTransaction();


    // 8. Xóa toàn bộ sản phẩm trong giỏ hàng
    $sql = "
        DELETE FROM cart_items
        WHERE cart_id = :cart_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_id' => $cartId
    ]);

    $deletedRows = $stmt->rowCount();


    // 9. Cập nhật thời gian giỏ hàng
    $sql = "
        UPDATE carts
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = :cart_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_id' => $cartId
    ]);


    // 10. Hoàn tất transaction
    $conn->commit();


    // 11. Trả kết quả
    sendSuccess('Xoa toan bo gio hang thanh cong', [
        'cart' => [
            'id' => $cartId,
            'total_items' => 0,
            'total_quantity' => 0,
            'subtotal' => 0,
            'shipping_fee' => 0,
            'discount_amount' => 0,
            'final_total' => 0
        ],
        'removed_summary' => [
            'deleted_rows' => (int) $deletedRows,
            'old_total_items' => (int) $oldSummary['total_items'],
            'old_total_quantity' => (int) $oldSummary['total_quantity'],
            'old_subtotal' => (float) $oldSummary['subtotal']
        ]
    ]);

} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Xoa toan bo gio hang that bai', 500, [
        'database' => $e->getMessage()
    ]);
}