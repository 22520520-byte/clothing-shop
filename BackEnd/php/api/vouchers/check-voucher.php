<?php
// =========================================================
// File: api/vouchers/check-voucher.php
// Mục đích: API kiểm tra mã voucher khi checkout
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
    sendError('Vui long dang nhap de kiem tra voucher', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy mã voucher
$voucherCode = strtoupper(trim($input['voucher_code'] ?? ''));

if ($voucherCode === '') {
    sendError('Vui long nhap ma giam gia', 422, [
        'voucher_code' => 'Ma giam gia khong duoc de trong'
    ]);
}


// 6. Kết nối database
$conn = getDatabaseConnection();

try {
    // 7. Kiểm tra user
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


    // 8. Lấy giỏ hàng active
    $sql = "
        SELECT
            id
        FROM carts
        WHERE user_id = :user_id_cart
        AND status = 'active'
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_cart' => $userId
    ]);

    $cart = $stmt->fetch();

    if (!$cart) {
        sendError('Khong tim thay gio hang', 404);
    }

    $cartId = (int) $cart['id'];


    // 9. Tính tổng tiền hàng trong giỏ
    $sql = "
        SELECT
            COUNT(ci.id) AS total_items,
            COALESCE(SUM(ci.quantity), 0) AS total_quantity,
            COALESCE(SUM(ci.quantity * ci.price_at_time), 0) AS total_product_price
        FROM cart_items ci
        WHERE ci.cart_id = :cart_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_id' => $cartId
    ]);

    $cartSummary = $stmt->fetch();

    $totalItems = (int) $cartSummary['total_items'];
    $totalQuantity = (int) $cartSummary['total_quantity'];
    $totalProductPrice = (float) $cartSummary['total_product_price'];

    if ($totalItems <= 0) {
        sendError('Gio hang dang trong, khong the ap dung voucher', 400);
    }


    // 10. Tính phí vận chuyển tạm thời
    $shippingFee = 30000;

    if ($totalProductPrice >= 1000000) {
        $shippingFee = 0;
    }


    // 11. Lấy thông tin voucher
    $sql = "
        SELECT
            id,
            code,
            name,
            description,
            discount_type,
            discount_value,
            min_order_value,
            max_discount_amount,
            quantity,
            used_quantity,
            usage_limit_per_user,
            start_date,
            end_date,
            status
        FROM vouchers
        WHERE code = :voucher_code
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':voucher_code' => $voucherCode
    ]);

    $voucher = $stmt->fetch();

    if (!$voucher) {
        sendError('Ma giam gia khong ton tai', 404);
    }


    // 12. Kiểm tra trạng thái voucher
    if ($voucher['status'] !== 'active') {
        sendError('Ma giam gia khong hoat dong', 400);
    }

    if ((int) $voucher['used_quantity'] >= (int) $voucher['quantity']) {
        sendError('Ma giam gia da het luot su dung', 400);
    }

    $now = time();
    $startDate = strtotime($voucher['start_date']);
    $endDate = strtotime($voucher['end_date']);

    if ($now < $startDate) {
        sendError('Ma giam gia chua den thoi gian su dung', 400);
    }

    if ($now > $endDate) {
        sendError('Ma giam gia da het han', 400);
    }

    if ($totalProductPrice < (float) $voucher['min_order_value']) {
        sendError('Don hang chua dat gia tri toi thieu de dung voucher', 400, [
            'min_order_value' => (float) $voucher['min_order_value'],
            'total_product_price' => $totalProductPrice
        ]);
    }


    // 13. Kiểm tra số lần user đã dùng voucher
    $sql = "
        SELECT COUNT(*) AS used_count
        FROM voucher_usages
        WHERE voucher_id = :voucher_id
        AND user_id = :user_id_usage
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':voucher_id' => (int) $voucher['id'],
        ':user_id_usage' => $userId
    ]);

    $usedCount = (int) $stmt->fetch()['used_count'];

    if ($usedCount >= (int) $voucher['usage_limit_per_user']) {
        sendError('Ban da su dung voucher nay toi da so lan cho phep', 400, [
            'used_count' => $usedCount,
            'usage_limit_per_user' => (int) $voucher['usage_limit_per_user']
        ]);
    }


    // 14. Tính tiền giảm
    $discountAmount = 0;

    if ($voucher['discount_type'] === 'fixed') {
        $discountAmount = (float) $voucher['discount_value'];
    } elseif ($voucher['discount_type'] === 'percent') {
        $discountAmount = $totalProductPrice * (float) $voucher['discount_value'] / 100;

        if ($voucher['max_discount_amount'] !== null) {
            $discountAmount = min($discountAmount, (float) $voucher['max_discount_amount']);
        }
    } elseif ($voucher['discount_type'] === 'freeship') {
        $discountAmount = min($shippingFee, (float) $voucher['discount_value']);
    }

    $discountAmount = min($discountAmount, $totalProductPrice + $shippingFee);

    $finalTotal = $totalProductPrice + $shippingFee - $discountAmount;

    if ($finalTotal < 0) {
        $finalTotal = 0;
    }


    // 15. Tạo nhãn hiển thị
    $discountLabel = '';

    if ($voucher['discount_type'] === 'fixed') {
        $discountLabel = 'Giam ' . number_format((float) $voucher['discount_value'], 0, ',', '.') . 'd';
    } elseif ($voucher['discount_type'] === 'percent') {
        $discountLabel = 'Giam ' . (float) $voucher['discount_value'] . '%';
    } elseif ($voucher['discount_type'] === 'freeship') {
        $discountLabel = 'Mien phi van chuyen';
    }


    // 16. Trả kết quả
    sendSuccess('Ap dung voucher thanh cong', [
        'voucher' => [
            'id' => (int) $voucher['id'],
            'code' => $voucher['code'],
            'name' => $voucher['name'],
            'description' => $voucher['description'],
            'discount_type' => $voucher['discount_type'],
            'discount_value' => (float) $voucher['discount_value'],
            'discount_label' => $discountLabel,
            'min_order_value' => (float) $voucher['min_order_value'],
            'max_discount_amount' => $voucher['max_discount_amount'] !== null
                ? (float) $voucher['max_discount_amount']
                : null,
            'usage_limit_per_user' => (int) $voucher['usage_limit_per_user'],
            'start_date' => $voucher['start_date'],
            'end_date' => $voucher['end_date']
        ],
        'cart' => [
            'id' => $cartId,
            'total_items' => $totalItems,
            'total_quantity' => $totalQuantity,
            'total_product_price' => $totalProductPrice,
            'shipping_fee' => $shippingFee,
            'discount_amount' => $discountAmount,
            'final_total' => $finalTotal
        ]
    ]);

} catch (PDOException $e) {
    sendError('Kiem tra voucher that bai', 500, [
        'database' => $e->getMessage()
    ]);
}