<?php
// =========================================================
// File: BackEnd/php/api/orders/create-order.php
// Muc dich: Tao don hang that trong database
// Cap nhat: Khong gan nham user admin/staff vao don khach hang
// =========================================================

session_start();

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/response.php';

// 1. Chi cho phep POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Phuong thuc khong hop le', 405);
}

// 2. Doc JSON body
function getJsonBody()
{
    $rawBody = file_get_contents('php://input');

    if (!$rawBody) {
        return [];
    }

    $data = json_decode($rawBody, true);

    if (!is_array($data)) {
        sendError('Du lieu JSON khong hop le', 400);
    }

    return $data;
}

// 3. Lay gia tri tu nhieu key
function getValue($data, $keys, $default = null)
{
    foreach ($keys as $key) {
        if (isset($data[$key]) && $data[$key] !== '') {
            return $data[$key];
        }
    }

    return $default;
}

// 4. Chuan hoa chuoi
function cleanString($value)
{
    return trim((string) ($value ?? ''));
}

// 5. Chuan hoa so tien
function cleanMoney($value)
{
    $number = (float) ($value ?? 0);

    if ($number < 0) {
        return 0;
    }

    return $number;
}

// 6. Chuan hoa so luong
function cleanQuantity($value)
{
    $quantity = (int) ($value ?? 1);

    if ($quantity < 1) {
        return 1;
    }

    return $quantity;
}

// 7. Chuan hoa phuong thuc thanh toan
function normalizePaymentMethod($value)
{
    $value = cleanString($value);

    if (in_array($value, ['bank', 'bank_transfer', 'transfer', 'qr', 'qr_transfer'])) {
        return 'bank_transfer';
    }

    if (in_array($value, ['momo', 'vnpay'])) {
        return $value;
    }

    return 'cod';
}

// 8. Tao ma don hang
function generateOrderCode()
{
    return 'DH' . date('YmdHis') . mt_rand(100, 999);
}

// 9. Tao ma don hang khong trung
function generateUniqueOrderCode($conn)
{
    for ($i = 0; $i < 10; $i += 1) {
        $orderCode = generateOrderCode();

        $sql = "SELECT id FROM orders WHERE order_code = :order_code LIMIT 1";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':order_code' => $orderCode
        ]);

        if (!$stmt->fetch()) {
            return $orderCode;
        }
    }

    return 'DH' . date('YmdHis') . mt_rand(1000, 9999);
}

// 10. Kiem tra role co phai khach hang khong
function isCustomerRole($roleCode)
{
    $roleCode = strtolower(cleanString($roleCode));

    return in_array($roleCode, [
        'customer',
        'member',
        'khach_hang',
        'khachhang',
        'khach'
    ]);
}

// 11. Lay user khach hang dang dang nhap neu co
function getLoggedInCustomer($conn, $customerType)
{
    // Neu frontend gui guest thi tuyet doi khong lay session admin/staff
    if ($customerType === 'guest') {
        return null;
    }

    $userId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;

    if ($userId <= 0) {
        return null;
    }

    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.phone,
            u.status,
            r.code AS role_code,
            cp.points_balance
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN customer_profiles cp ON u.id = cp.user_id
        WHERE u.id = :user_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId
    ]);

    $user = $stmt->fetch();

    if (!$user) {
        return null;
    }

    // Quan trong: Neu session hien tai la admin/staff/owner thi khong gan vao don khach
    if (!isCustomerRole($user['role_code'])) {
        return null;
    }

    if ($user['status'] !== 'active') {
        sendError('Tai khoan khach hang dang bi khoa hoac khong hoat dong', 403);
    }

    return $user;
}

// 12. Lay active cart cua user neu co
function getActiveCartId($conn, $userId)
{
    if (!$userId) {
        return null;
    }

    $sql = "
        SELECT id
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
        return null;
    }

    return (int) $cart['id'];
}

// 13. Lay san pham tu active cart trong database
function getItemsFromDbCart($conn, $cartId)
{
    if (!$cartId) {
        return [];
    }

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
            p.status AS product_status,
            cl.name AS color_name,
            s.name AS size_name,
            COALESCE(pi.image_url, '../img/products/default.jpg') AS product_image
        FROM cart_items ci
        JOIN product_variants pv ON ci.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN colors cl ON pv.color_id = cl.id
        JOIN sizes s ON pv.size_id = s.id
        LEFT JOIN (
            SELECT product_id, MIN(image_url) AS image_url
            FROM product_images
            WHERE is_main = 1
            GROUP BY product_id
        ) pi ON p.id = pi.product_id
        WHERE ci.cart_id = :cart_id
        ORDER BY ci.id ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_id' => $cartId
    ]);

    $items = $stmt->fetchAll();
    $result = [];

    foreach ($items as $item) {
        $result[] = [
            'cart_item_id' => (int) $item['cart_item_id'],
            'product_id' => (int) $item['product_id'],
            'variant_id' => (int) $item['variant_id'],
            'product_name' => $item['product_name'],
            'product_image' => $item['product_image'],
            'color_name' => $item['color_name'],
            'size_name' => $item['size_name'],
            'sku' => $item['sku'],
            'price' => (float) $item['price_at_time'],
            'quantity' => (int) $item['quantity'],
            'stock_quantity' => (int) $item['stock_quantity'],
            'product_status' => $item['product_status'],
            'variant_status' => $item['variant_status'],
            'can_update_stock' => true
        ];
    }

    return $result;
}

// 14. Tim bien the theo variant_id
function findVariantById($conn, $variantId)
{
    if (!$variantId) {
        return null;
    }

    $sql = "
        SELECT
            pv.id AS variant_id,
            pv.product_id,
            pv.sku,
            pv.price AS variant_price,
            pv.stock_quantity,
            pv.status AS variant_status,
            p.name AS product_name,
            p.base_price,
            p.status AS product_status,
            cl.name AS color_name,
            s.name AS size_name,
            COALESCE(pi.image_url, '../img/products/default.jpg') AS product_image
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        JOIN colors cl ON pv.color_id = cl.id
        JOIN sizes s ON pv.size_id = s.id
        LEFT JOIN (
            SELECT product_id, MIN(image_url) AS image_url
            FROM product_images
            WHERE is_main = 1
            GROUP BY product_id
        ) pi ON p.id = pi.product_id
        WHERE pv.id = :variant_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':variant_id' => $variantId
    ]);

    $variant = $stmt->fetch();

    if (!$variant) {
        return null;
    }

    return $variant;
}

// 15. Tim bien the theo product_id, mau, size
function findVariantByProductColorSize($conn, $productId, $colorName, $sizeName)
{
    if (!$productId) {
        return null;
    }

    $where = ["p.id = :product_id"];
    $params = [
        ':product_id' => $productId
    ];

    if ($colorName !== '') {
        $where[] = "(cl.name = :color_name OR cl.code = :color_name)";
        $params[':color_name'] = $colorName;
    }

    if ($sizeName !== '') {
        $where[] = "(s.name = :size_name OR s.code = :size_name)";
        $params[':size_name'] = $sizeName;
    }

    $whereSql = implode(' AND ', $where);

    $sql = "
        SELECT
            pv.id AS variant_id,
            pv.product_id,
            pv.sku,
            pv.price AS variant_price,
            pv.stock_quantity,
            pv.status AS variant_status,
            p.name AS product_name,
            p.base_price,
            p.status AS product_status,
            cl.name AS color_name,
            s.name AS size_name,
            COALESCE(pi.image_url, '../img/products/default.jpg') AS product_image
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        JOIN colors cl ON pv.color_id = cl.id
        JOIN sizes s ON pv.size_id = s.id
        LEFT JOIN (
            SELECT product_id, MIN(image_url) AS image_url
            FROM product_images
            WHERE is_main = 1
            GROUP BY product_id
        ) pi ON p.id = pi.product_id
        WHERE $whereSql
        ORDER BY pv.stock_quantity DESC, pv.id ASC
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $variant = $stmt->fetch();

    if (!$variant) {
        return null;
    }

    return $variant;
}

// 16. Tim san pham neu khong co bien the
function findProductById($conn, $productId)
{
    if (!$productId) {
        return null;
    }

    $sql = "
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.base_price,
            p.status AS product_status,
            COALESCE(pi.image_url, '../img/products/default.jpg') AS product_image
        FROM products p
        LEFT JOIN (
            SELECT product_id, MIN(image_url) AS image_url
            FROM product_images
            WHERE is_main = 1
            GROUP BY product_id
        ) pi ON p.id = pi.product_id
        WHERE p.id = :product_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':product_id' => $productId
    ]);

    $product = $stmt->fetch();

    if (!$product) {
        return null;
    }

    return $product;
}

// 17. Chuan hoa 1 item tu frontend gui len
function normalizePayloadItem($conn, $item)
{
    $productId = (int) getValue($item, ['product_id', 'productId', 'id'], 0);
    $variantId = (int) getValue($item, ['variant_id', 'product_variant_id', 'variantId', 'productVariantId'], 0);
    $quantity = cleanQuantity(getValue($item, ['quantity', 'qty'], 1));
    $colorName = cleanString(getValue($item, ['color_name', 'colorName', 'color', 'selectedColor'], ''));
    $sizeName = cleanString(getValue($item, ['size_name', 'sizeName', 'size', 'selectedSize'], ''));

    $variant = findVariantById($conn, $variantId);

    if (!$variant && $productId > 0) {
        $variant = findVariantByProductColorSize($conn, $productId, $colorName, $sizeName);
    }

    if ($variant) {
        $price = $variant['variant_price'] !== null
            ? (float) $variant['variant_price']
            : (float) $variant['base_price'];

        return [
            'cart_item_id' => (int) getValue($item, ['cart_item_id', 'cartItemId', 'apiCartItemId'], 0),
            'product_id' => (int) $variant['product_id'],
            'variant_id' => (int) $variant['variant_id'],
            'product_name' => $variant['product_name'],
            'product_image' => $variant['product_image'],
            'color_name' => $variant['color_name'],
            'size_name' => $variant['size_name'],
            'sku' => $variant['sku'],
            'price' => $price,
            'quantity' => $quantity,
            'stock_quantity' => (int) $variant['stock_quantity'],
            'product_status' => $variant['product_status'],
            'variant_status' => $variant['variant_status'],
            'can_update_stock' => true
        ];
    }

    $product = findProductById($conn, $productId);

    if ($product) {
        return [
            'cart_item_id' => (int) getValue($item, ['cart_item_id', 'cartItemId', 'apiCartItemId'], 0),
            'product_id' => (int) $product['product_id'],
            'variant_id' => null,
            'product_name' => cleanString(getValue($item, ['product_name', 'productName', 'name'], $product['product_name'])),
            'product_image' => cleanString(getValue($item, ['product_image', 'productImage', 'image'], $product['product_image'])),
            'color_name' => $colorName,
            'size_name' => $sizeName,
            'sku' => cleanString(getValue($item, ['sku'], '')),
            'price' => cleanMoney(getValue($item, ['price'], $product['base_price'])),
            'quantity' => $quantity,
            'stock_quantity' => null,
            'product_status' => $product['product_status'],
            'variant_status' => 'active',
            'can_update_stock' => false
        ];
    }

    $productName = cleanString(getValue($item, ['product_name', 'productName', 'name'], ''));

    if ($productName === '') {
        sendError('San pham trong don hang khong hop le', 422);
    }

    return [
        'cart_item_id' => (int) getValue($item, ['cart_item_id', 'cartItemId', 'apiCartItemId'], 0),
        'product_id' => $productId,
        'variant_id' => null,
        'product_name' => $productName,
        'product_image' => cleanString(getValue($item, ['product_image', 'productImage', 'image'], '../img/products/default.jpg')),
        'color_name' => $colorName,
        'size_name' => $sizeName,
        'sku' => cleanString(getValue($item, ['sku'], '')),
        'price' => cleanMoney(getValue($item, ['price'], 0)),
        'quantity' => $quantity,
        'stock_quantity' => null,
        'product_status' => 'active',
        'variant_status' => 'active',
        'can_update_stock' => false
    ];
}

// 18. Lay danh sach item tu payload
function getItemsFromPayload($conn, $data)
{
    $items = getValue($data, ['order_items', 'orderItems', 'items'], []);

    if (!is_array($items)) {
        return [];
    }

    $result = [];

    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }

        $result[] = normalizePayloadItem($conn, $item);
    }

    return $result;
}

// 19. Kiem tra san pham va tinh tong tien hang
function validateItemsAndCalculateSubtotal($items)
{
    if (count($items) === 0) {
        sendError('Khong co san pham nao de dat hang', 400);
    }

    $totalProductPrice = 0;

    foreach ($items as $item) {
        if ($item['product_status'] !== 'active') {
            sendError('San pham "' . $item['product_name'] . '" hien khong hoat dong', 400);
        }

        if ($item['variant_status'] !== 'active') {
            sendError('Bien the san pham "' . $item['product_name'] . '" hien khong hoat dong', 400);
        }

        if ($item['can_update_stock'] && $item['stock_quantity'] !== null && (int) $item['stock_quantity'] < (int) $item['quantity']) {
            sendError('San pham "' . $item['product_name'] . '" khong du ton kho', 400, [
                'sku' => $item['sku'],
                'stock_quantity' => (int) $item['stock_quantity'],
                'order_quantity' => (int) $item['quantity']
            ]);
        }

        $totalProductPrice += (float) $item['price'] * (int) $item['quantity'];
    }

    return $totalProductPrice;
}

// 20. Lay voucher neu co
function getVoucher($conn, $voucherCode)
{
    if ($voucherCode === '') {
        return null;
    }

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
        return null;
    }

    return $voucher;
}

// 21. Tinh giam gia voucher
function calculateVoucherDiscount($conn, $voucher, $voucherCode, $userId, $totalProductPrice, $shippingFee, $payloadDiscount)
{
    if ($voucherCode === '') {
        return 0;
    }

    if (!$voucher) {
        return min(cleanMoney($payloadDiscount), $totalProductPrice + $shippingFee);
    }

    if ($voucher['status'] !== 'active') {
        sendError('Ma giam gia khong hoat dong', 400);
    }

    if ((int) $voucher['quantity'] > 0 && (int) $voucher['used_quantity'] >= (int) $voucher['quantity']) {
        sendError('Ma giam gia da het luot su dung', 400);
    }

    $now = time();
    $startDate = strtotime($voucher['start_date']);
    $endDate = strtotime($voucher['end_date']);

    if ($startDate && $now < $startDate) {
        sendError('Ma giam gia chua den thoi gian su dung', 400);
    }

    if ($endDate && $now > $endDate) {
        sendError('Ma giam gia da het han', 400);
    }

    if ($totalProductPrice < (float) $voucher['min_order_value']) {
        sendError('Don hang chua dat gia tri toi thieu de dung voucher', 400, [
            'min_order_value' => (float) $voucher['min_order_value'],
            'total_product_price' => $totalProductPrice
        ]);
    }

    if ($userId) {
        $sql = "
            SELECT COUNT(*) AS used_count
            FROM voucher_usages
            WHERE voucher_id = :voucher_id
              AND user_id = :user_id
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':voucher_id' => (int) $voucher['id'],
            ':user_id' => $userId
        ]);

        $usedCount = (int) $stmt->fetch()['used_count'];

        if ($usedCount >= (int) $voucher['usage_limit_per_user']) {
            sendError('Ban da su dung voucher nay toi da so lan cho phep', 400);
        }
    }

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

    return min($discountAmount, $totalProductPrice + $shippingFee);
}

// 22. Tinh tien giam tu diem
function calculatePointsDiscount($user, $pointsToUse, $totalProductPrice, $shippingFee, $discountAmount)
{
    if ($pointsToUse <= 0) {
        return 0;
    }

    if (!$user) {
        sendError('Khach vang lai khong the dung diem tich luy', 400);
    }

    $currentPoints = (int) ($user['points_balance'] ?? 0);

    if ($pointsToUse > $currentPoints) {
        sendError('So diem hien co khong du', 400, [
            'points_balance' => $currentPoints,
            'points_to_use' => $pointsToUse
        ]);
    }

    // Dong bo voi frontend: 100 diem = 10.000d
    $pointsDiscount = $pointsToUse * 100;
    $maxDiscount = max($totalProductPrice + $shippingFee - $discountAmount, 0);

    return min($pointsDiscount, $maxDiscount);
}

// 23. Them chi tiet don hang va tru ton kho
function insertOrderItemsAndUpdateStock($conn, $orderId, $orderCode, $items, $userId)
{
    foreach ($items as $item) {
        $price = (float) $item['price'];
        $quantity = (int) $item['quantity'];
        $totalPrice = $price * $quantity;

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
            ':variant_id' => $item['variant_id'],
            ':product_name' => $item['product_name'],
            ':color_name' => $item['color_name'],
            ':size_name' => $item['size_name'],
            ':product_image' => $item['product_image'],
            ':sku' => $item['sku'],
            ':price' => $price,
            ':quantity' => $quantity,
            ':total_price' => $totalPrice
        ]);

        if (!$item['can_update_stock'] || !$item['variant_id']) {
            continue;
        }

        $quantityBefore = (int) $item['stock_quantity'];
        $quantityAfter = $quantityBefore - $quantity;

        $sql = "
            UPDATE product_variants
            SET stock_quantity = stock_quantity - :quantity_minus,
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

        if ($stmt->rowCount() === 0) {
            throw new Exception('San pham "' . $item['product_name'] . '" khong du ton kho');
        }

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
}

// 24. Cap nhat voucher sau khi dat hang
function saveVoucherUsage($conn, $voucher, $userId, $orderId, $discountAmount)
{
    if (!$voucher || $discountAmount <= 0) {
        return;
    }

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
        SET used_quantity = used_quantity + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :voucher_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':voucher_id' => (int) $voucher['id']
    ]);
}

// 25. Cap nhat diem va thong ke khach hang
function updateCustomerAfterOrder($conn, $userId, $orderId, $orderCode, $pointsToUse, $finalTotal)
{
    if (!$userId) {
        return;
    }

    $sql = "
        INSERT INTO customer_profiles (
            user_id,
            membership_level,
            points_balance,
            total_orders,
            total_spent
        )
        VALUES (
            :user_id,
            'normal',
            0,
            1,
            :final_total
        )
        ON DUPLICATE KEY UPDATE
            total_orders = total_orders + 1,
            total_spent = total_spent + VALUES(total_spent),
            updated_at = CURRENT_TIMESTAMP
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId,
        ':final_total' => $finalTotal
    ]);

    if ($pointsToUse <= 0) {
        return;
    }

    $sql = "
        UPDATE customer_profiles
        SET points_balance = GREATEST(points_balance - :points_to_use, 0),
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

// 26. Chuyen cart thanh ordered neu co
function markCartAsOrdered($conn, $cartId)
{
    if (!$cartId) {
        return;
    }

    $sql = "
        UPDATE carts
        SET status = 'ordered',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :cart_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cart_id' => $cartId
    ]);
}

// 27. Bat dau xu ly chinh
$data = getJsonBody();
$conn = getDatabaseConnection();

try {
    $customerType = cleanString(getValue($data, ['customer_type', 'customerType'], 'guest'));

    if (!in_array($customerType, ['guest', 'member'])) {
        $customerType = 'guest';
    }

    $user = getLoggedInCustomer($conn, $customerType);
    $userId = $user ? (int) $user['id'] : null;
    $cartId = getActiveCartId($conn, $userId);

    $receiverName = cleanString(getValue($data, ['receiver_name', 'receiverName', 'fullName', 'name'], ''));
    $receiverPhone = cleanString(getValue($data, ['receiver_phone', 'receiverPhone', 'phone'], ''));
    $receiverEmail = cleanString(getValue($data, ['receiver_email', 'receiverEmail', 'email'], ''));
    $shippingAddress = cleanString(getValue($data, ['shipping_address', 'shippingAddress', 'fullAddress'], ''));
    $address = cleanString(getValue($data, ['address'], ''));
    $ward = cleanString(getValue($data, ['ward'], ''));
    $district = cleanString(getValue($data, ['district'], ''));
    $province = cleanString(getValue($data, ['province'], ''));
    $note = cleanString(getValue($data, ['note', 'order_note', 'orderNote'], ''));
    $paymentMethod = normalizePaymentMethod(getValue($data, ['payment_method', 'paymentMethod'], 'cod'));
    $voucherCode = strtoupper(cleanString(getValue($data, ['voucher_code', 'voucherCode'], '')));
    $pointsToUse = (int) getValue($data, ['points_to_use', 'pointsToUse'], 0);
    $payloadDiscount = cleanMoney(getValue($data, ['discount_amount', 'discountAmount'], 0));
    $payloadShippingFee = getValue($data, ['shipping_fee', 'shippingFee'], null);

    if ($shippingAddress === '') {
        $shippingAddress = implode(', ', array_filter([$address, $ward, $district, $province]));
    }

    if ($receiverName === '') {
        sendError('Vui long nhap ten nguoi nhan', 422);
    }

    if (!preg_match('/^0\d{9}$/', $receiverPhone)) {
        sendError('So dien thoai nguoi nhan khong hop le', 422);
    }

    if ($receiverEmail !== '' && !filter_var($receiverEmail, FILTER_VALIDATE_EMAIL)) {
        sendError('Email nguoi nhan khong hop le', 422);
    }

    if ($shippingAddress === '') {
        sendError('Vui long nhap dia chi giao hang', 422);
    }

    $orderItems = getItemsFromPayload($conn, $data);

    if (count($orderItems) === 0 && $cartId) {
        $orderItems = getItemsFromDbCart($conn, $cartId);
    }

    $totalProductPrice = validateItemsAndCalculateSubtotal($orderItems);

    if ($payloadShippingFee !== null) {
        $shippingFee = cleanMoney($payloadShippingFee);
    } else {
        $shippingFee = $totalProductPrice >= 1000000 ? 0 : 30000;
    }

    $voucher = getVoucher($conn, $voucherCode);
    $discountAmount = calculateVoucherDiscount(
        $conn,
        $voucher,
        $voucherCode,
        $userId,
        $totalProductPrice,
        $shippingFee,
        $payloadDiscount
    );

    $pointsDiscount = calculatePointsDiscount(
        $user,
        $pointsToUse,
        $totalProductPrice,
        $shippingFee,
        $discountAmount
    );

    $finalTotal = $totalProductPrice + $shippingFee - $discountAmount - $pointsDiscount;

    if ($finalTotal < 0) {
        $finalTotal = 0;
    }

    $conn->beginTransaction();

    $orderCode = generateUniqueOrderCode($conn);

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

    insertOrderItemsAndUpdateStock($conn, $orderId, $orderCode, $orderItems, $userId);

    $paymentStatus = 'unpaid';

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

    saveVoucherUsage($conn, $voucher, $userId, $orderId, $discountAmount);
    updateCustomerAfterOrder($conn, $userId, $orderId, $orderCode, $pointsToUse, $finalTotal);
    markCartAsOrdered($conn, $cartId);

    $conn->commit();

    sendSuccess('Tao don hang thanh cong', [
        'order' => [
            'id' => $orderId,
            'user_id' => $userId,
            'customer_type' => $userId ? 'member' : 'guest',
            'order_code' => $orderCode,
            'receiver_name' => $receiverName,
            'receiver_phone' => $receiverPhone,
            'receiver_email' => $receiverEmail,
            'shipping_address' => $shippingAddress,
            'note' => $note,
            'total_product_price' => $totalProductPrice,
            'shipping_fee' => $shippingFee,
            'discount_amount' => $discountAmount,
            'points_discount' => $pointsDiscount,
            'final_total' => $finalTotal,
            'payment_method' => $paymentMethod,
            'payment_status' => $paymentStatus,
            'order_status' => 'pending',
            'created_at' => date('Y-m-d H:i:s'),
            'items' => array_map(function ($item) {
                return [
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'],
                    'product_name' => $item['product_name'],
                    'color_name' => $item['color_name'],
                    'size_name' => $item['size_name'],
                    'product_image' => $item['product_image'],
                    'sku' => $item['sku'],
                    'price' => $item['price'],
                    'quantity' => $item['quantity'],
                    'total_price' => $item['price'] * $item['quantity']
                ];
            }, $orderItems)
        ],
        'cart' => [
            'id' => $cartId,
            'status' => $cartId ? 'ordered' : null
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