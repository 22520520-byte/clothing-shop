<?php
// =========================================================
// File: api/orders/create-order.php
// Mục đích: API tạo đơn hàng từ giỏ hàng hiện tại
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
    sendError('Vui long dang nhap de dat hang', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy dữ liệu request
$receiverName = trim($input['receiver_name'] ?? '');
$receiverPhone = trim($input['receiver_phone'] ?? '');
$shippingAddress = trim($input['shipping_address'] ?? '');
$note = trim($input['note'] ?? '');

$paymentMethod = trim($input['payment_method'] ?? 'cod');
$voucherCode = strtoupper(trim($input['voucher_code'] ?? ''));

$pointsToUse = isset($input['points_to_use']) ? (int) $input['points_to_use'] : 0;


// 6. Validate dữ liệu
$errors = [];

if ($receiverName === '') {
    $errors['receiver_name'] = 'Vui long nhap ten nguoi nhan';
}

if ($receiverPhone === '') {
    $errors['receiver_phone'] = 'Vui long nhap so dien thoai nguoi nhan';
} elseif (!preg_match('/^[0-9]{9,11}$/', $receiverPhone)) {
    $errors['receiver_phone'] = 'So dien thoai nguoi nhan khong hop le';
}

if ($shippingAddress === '') {
    $errors['shipping_address'] = 'Vui long nhap dia chi giao hang';
}

$allowedPaymentMethods = ['cod', 'bank_transfer', 'momo', 'vnpay'];

if (!in_array($paymentMethod, $allowedPaymentMethods)) {
    $errors['payment_method'] = 'Phuong thuc thanh toan khong hop le';
}

if ($pointsToUse < 0) {
    $errors['points_to_use'] = 'So diem su dung khong hop le';
}

if (!empty($errors)) {
    sendError('Du lieu khong hop le', 422, $errors);
}


// 7. Hàm tạo mã đơn hàng
function generateOrderCode()
{
    return 'DH' . date('YmdHis') . rand(100, 999);
}


// 8. Kết nối database
$conn = getDatabaseConnection();

try {
    // 9. Lấy thông tin user + customer profile
    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.phone,
            u.status,
            cp.points_balance
        FROM users u
        LEFT JOIN customer_profiles cp
            ON u.id = cp.user_id
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


    // 10. Lấy giỏ hàng active
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


    // 11. Lấy sản phẩm trong giỏ hàng
    $sql = "
        SELECT
            ci.id AS cart_item_id,
            ci.variant_id,
            ci.quantity,
            ci.price_at_time,

            pv.sku,
            pv.stock_quantity,
            pv.status AS variant_status,

            p.id AS product_id,
            p.name AS product_name,
            p.slug AS product_slug,
            p.status AS product_status,

            cl.name AS color_name,
            s.name AS size_name,

            COALESCE(pi.image_url, '../img/products/default.jpg') AS product_image
        FROM cart_items ci
        JOIN product_variants pv
            ON ci.variant_id = pv.id
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
        WHERE ci.cart_id = :cart_id
        ORDER BY ci.id ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_id' => $cartId
    ]);

    $cartItems = $stmt->fetchAll();

    if (count($cartItems) === 0) {
        sendError('Gio hang dang trong, khong the dat hang', 400);
    }


    // 12. Kiểm tra tồn kho và tính tổng tiền hàng
    $totalProductPrice = 0;

    foreach ($cartItems as $item) {
        if ($item['product_status'] !== 'active') {
            sendError('San pham "' . $item['product_name'] . '" hien khong hoat dong', 400);
        }

        if ($item['variant_status'] !== 'active') {
            sendError('Bien the san pham "' . $item['product_name'] . '" hien khong hoat dong', 400);
        }

        if ((int) $item['stock_quantity'] < (int) $item['quantity']) {
            sendError('San pham "' . $item['product_name'] . '" khong du ton kho', 400, [
                'sku' => $item['sku'],
                'stock_quantity' => (int) $item['stock_quantity'],
                'cart_quantity' => (int) $item['quantity']
            ]);
        }

        $totalProductPrice += (float) $item['price_at_time'] * (int) $item['quantity'];
    }


    // 13. Phí vận chuyển tạm tính
    $shippingFee = 30000;

    if ($totalProductPrice >= 1000000) {
        $shippingFee = 0;
    }


    // 14. Xử lý voucher nếu có
    $voucher = null;
    $discountAmount = 0;

    if ($voucherCode !== '') {
        $sql = "
            SELECT
                id,
                code,
                name,
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
            WHERE code = :code
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':code' => $voucherCode
        ]);

        $voucher = $stmt->fetch();

        if (!$voucher) {
            sendError('Ma giam gia khong ton tai', 404);
        }

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

        // Kiểm tra số lần user đã dùng voucher
        $sql = "
            SELECT COUNT(*) AS used_count
            FROM voucher_usages
            WHERE voucher_id = :voucher_id
            AND user_id = :user_id
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':voucher_id' => $voucher['id'],
            ':user_id' => $userId
        ]);

        $usedCount = (int) $stmt->fetch()['used_count'];

        if ($usedCount >= (int) $voucher['usage_limit_per_user']) {
            sendError('Ban da su dung voucher nay toi da so lan cho phep', 400);
        }

        // Tính tiền giảm
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
    }


    // 15. Xử lý điểm tích lũy nếu có
    $pointsDiscount = 0;
    $pointValue = 1000;

    if ($pointsToUse > 0) {
        $currentPoints = (int) ($user['points_balance'] ?? 0);

        if ($pointsToUse > $currentPoints) {
            sendError('So diem hien co khong du', 400, [
                'points_balance' => $currentPoints,
                'points_to_use' => $pointsToUse
            ]);
        }

        $pointsDiscount = $pointsToUse * $pointValue;
        $pointsDiscount = min($pointsDiscount, $totalProductPrice + $shippingFee - $discountAmount);
    }


    // 16. Tính tổng thanh toán
    $finalTotal = $totalProductPrice + $shippingFee - $discountAmount - $pointsDiscount;

    if ($finalTotal < 0) {
        $finalTotal = 0;
    }


    // 17. Bắt đầu transaction
    $conn->beginTransaction();


    // 18. Tạo mã đơn hàng không trùng
    $orderCode = generateOrderCode();

    for ($i = 0; $i < 5; $i++) {
        $sql = "
            SELECT id
            FROM orders
            WHERE order_code = :order_code
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':order_code' => $orderCode
        ]);

        if (!$stmt->fetch()) {
            break;
        }

        $orderCode = generateOrderCode();
    }


    // 19. Thêm đơn hàng
    $sql = "
        INSERT INTO orders (
            user_id,
            order_code,
            receiver_name,
            receiver_phone,
            shipping_address,
            note,
            total_product_price,
            shipping_fee,
            discount_amount,
            points_discount,
            final_total,
            payment_method,
            order_status
        )
        VALUES (
            :user_id,
            :order_code,
            :receiver_name,
            :receiver_phone,
            :shipping_address,
            :note,
            :total_product_price,
            :shipping_fee,
            :discount_amount,
            :points_discount,
            :final_total,
            :payment_method,
            'pending'
        )
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId,
        ':order_code' => $orderCode,
        ':receiver_name' => $receiverName,
        ':receiver_phone' => $receiverPhone,
        ':shipping_address' => $shippingAddress,
        ':note' => $note,
        ':total_product_price' => $totalProductPrice,
        ':shipping_fee' => $shippingFee,
        ':discount_amount' => $discountAmount,
        ':points_discount' => $pointsDiscount,
        ':final_total' => $finalTotal,
        ':payment_method' => $paymentMethod
    ]);

    $orderId = (int) $conn->lastInsertId();


    // 20. Thêm chi tiết đơn hàng + trừ tồn kho + ghi lịch sử tồn kho
    foreach ($cartItems as $item) {
        $price = (float) $item['price_at_time'];
        $quantity = (int) $item['quantity'];
        $totalPrice = $price * $quantity;

        $quantityBefore = (int) $item['stock_quantity'];
        $quantityAfter = $quantityBefore - $quantity;

        // 20.1 Thêm order_items
        $sql = "
            INSERT INTO order_items (
                order_id,
                variant_id,
                product_name,
                color_name,
                size_name,
                product_image,
                sku,
                price,
                quantity,
                total_price
            )
            VALUES (
                :order_id,
                :variant_id,
                :product_name,
                :color_name,
                :size_name,
                :product_image,
                :sku,
                :price,
                :quantity,
                :total_price
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':order_id' => $orderId,
            ':variant_id' => (int) $item['variant_id'],
            ':product_name' => $item['product_name'],
            ':color_name' => $item['color_name'],
            ':size_name' => $item['size_name'],
            ':product_image' => $item['product_image'],
            ':sku' => $item['sku'],
            ':price' => $price,
            ':quantity' => $quantity,
            ':total_price' => $totalPrice
        ]);

       // 20.2 Trừ tồn kho
$sql = "
    UPDATE product_variants
    SET
        stock_quantity = stock_quantity - :quantity_minus,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = :variant_id
    AND stock_quantity >= :quantity_check
";

$stmt = $conn->prepare($sql);
$stmt->execute([
    ':quantity_minus' => $quantity,
    ':quantity_check' => $quantity,
    ':variant_id' => (int) $item['variant_id']
]);
        // 20.3 Ghi lịch sử tồn kho
        $sql = "
            INSERT INTO product_stock_logs (
                variant_id,
                user_id,
                change_type,
                quantity_change,
                quantity_before,
                quantity_after,
                note
            )
            VALUES (
                :variant_id,
                :user_id,
                'sale',
                :quantity_change,
                :quantity_before,
                :quantity_after,
                :note
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':variant_id' => (int) $item['variant_id'],
            ':user_id' => $userId,
            ':quantity_change' => -$quantity,
            ':quantity_before' => $quantityBefore,
            ':quantity_after' => $quantityAfter,
            ':note' => 'Tru kho khi tao don hang ' . $orderCode
        ]);
    }


    // 21. Thêm payment
    $paymentStatus = 'unpaid';

    if ($paymentMethod !== 'cod') {
        $paymentStatus = 'unpaid';
    }

    $sql = "
        INSERT INTO payments (
            order_id,
            payment_method,
            amount,
            payment_status,
            transaction_code,
            paid_at
        )
        VALUES (
            :order_id,
            :payment_method,
            :amount,
            :payment_status,
            NULL,
            NULL
        )
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':order_id' => $orderId,
        ':payment_method' => $paymentMethod,
        ':amount' => $finalTotal,
        ':payment_status' => $paymentStatus
    ]);


    // 22. Lưu lịch sử dùng voucher nếu có
    if ($voucher !== null) {
        $sql = "
            INSERT INTO voucher_usages (
                voucher_id,
                user_id,
                order_id,
                discount_amount,
                used_at
            )
            VALUES (
                :voucher_id,
                :user_id,
                :order_id,
                :discount_amount,
                NOW()
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':voucher_id' => (int) $voucher['id'],
            ':user_id' => $userId,
            ':order_id' => $orderId,
            ':discount_amount' => $discountAmount
        ]);

        $sql = "
            UPDATE vouchers
            SET
                used_quantity = used_quantity + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :voucher_id
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':voucher_id' => (int) $voucher['id']
        ]);
    }


    // 23. Trừ điểm nếu có dùng điểm
    if ($pointsToUse > 0) {
        $sql = "
            UPDATE customer_profiles
            SET
                points_balance = points_balance - :points_to_use,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = :user_id
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':points_to_use' => $pointsToUse,
            ':user_id' => $userId
        ]);

        $sql = "
            INSERT INTO points_history (
                user_id,
                order_id,
                type,
                points,
                description
            )
            VALUES (
                :user_id,
                :order_id,
                'use',
                :points,
                :description
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':order_id' => $orderId,
            ':points' => -$pointsToUse,
            ':description' => 'Dung ' . $pointsToUse . ' diem khi dat don hang ' . $orderCode
        ]);
    }


    // 24. Cập nhật thống kê customer profile
    $sql = "
        UPDATE customer_profiles
        SET
            total_orders = total_orders + 1,
            total_spent = total_spent + :final_total,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = :user_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':final_total' => $finalTotal,
        ':user_id' => $userId
    ]);


    // 25. Chuyển cart sang trạng thái ordered
    $sql = "
        UPDATE carts
        SET
            status = 'ordered',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :cart_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_id' => $cartId
    ]);


    // 26. Hoàn tất transaction
    $conn->commit();


    // 27. Trả kết quả
    sendSuccess('Tao don hang thanh cong', [
        'order' => [
            'id' => $orderId,
            'order_code' => $orderCode,
            'receiver_name' => $receiverName,
            'receiver_phone' => $receiverPhone,
            'shipping_address' => $shippingAddress,
            'note' => $note,
            'total_product_price' => $totalProductPrice,
            'shipping_fee' => $shippingFee,
            'discount_amount' => $discountAmount,
            'points_discount' => $pointsDiscount,
            'final_total' => $finalTotal,
            'payment_method' => $paymentMethod,
            'payment_status' => $paymentStatus,
            'order_status' => 'pending'
        ],
        'cart' => [
            'id' => $cartId,
            'status' => 'ordered'
        ]
    ], 201);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Tao don hang that bai', 500, [
        'error' => $e->getMessage()
    ]);
}