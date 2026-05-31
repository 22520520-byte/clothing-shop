USE clothing_store;

-- =========================================================
-- File: 02_insert_sample_order_data.sql
-- Mục đích: Thêm dữ liệu mẫu cho nhóm đơn hàng
-- Yêu cầu: Chạy sau:
-- 1. 01_account
-- 2. 02_product
-- 3. 04_order/01_create_order_tables.sql
-- =========================================================


-- =========================================================
-- 1. Thêm đơn hàng mẫu cho customer@example.com
-- Tổng tiền hàng:
-- Áo thun basic nam: 199000 * 2 = 398000
-- Quần jean ống rộng nữ: 359000 * 1 = 359000
-- Mũ lưỡi trai basic: 99000 * 1 = 99000
-- Tổng tiền hàng = 856000
-- Phí vận chuyển = 30000
-- Giảm giá = 50000
-- Tổng thanh toán = 836000
-- =========================================================
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
SELECT
    u.id,
    'DH000001',
    'Nguyễn Văn Khách',
    '0901000001',
    '123 Đường Số 1, Linh Xuân, Thành phố Thủ Đức, TP. Hồ Chí Minh',
    'Giao hàng giờ hành chính giúp tôi.',
    856000,
    30000,
    50000,
    0,
    836000,
    'cod',
    'pending'
FROM users u
WHERE u.email = 'customer@example.com'
ON DUPLICATE KEY UPDATE
    user_id = VALUES(user_id),
    receiver_name = VALUES(receiver_name),
    receiver_phone = VALUES(receiver_phone),
    shipping_address = VALUES(shipping_address),
    note = VALUES(note),
    total_product_price = VALUES(total_product_price),
    shipping_fee = VALUES(shipping_fee),
    discount_amount = VALUES(discount_amount),
    points_discount = VALUES(points_discount),
    final_total = VALUES(final_total),
    payment_method = VALUES(payment_method),
    order_status = VALUES(order_status);


-- =========================================================
-- 2. Thêm sản phẩm 1 vào đơn hàng
-- Áo thun basic nam - Đen - M
-- SKU: ATB-NAM-BLACK-M
-- =========================================================
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
SELECT
    o.id,
    pv.id,
    p.name,
    cl.name,
    s.name,
    COALESCE(pi.image_url, '../images/products/default.jpg'),
    pv.sku,
    199000,
    2,
    398000
FROM orders o
JOIN product_variants pv
    ON pv.sku = 'ATB-NAM-BLACK-M'
JOIN products p
    ON pv.product_id = p.id
JOIN colors cl
    ON pv.color_id = cl.id
JOIN sizes s
    ON pv.size_id = s.id
LEFT JOIN product_images pi
    ON p.id = pi.product_id
    AND pi.is_main = 1
WHERE o.order_code = 'DH000001'
AND NOT EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.order_id = o.id
    AND oi.sku = pv.sku
);


-- =========================================================
-- 3. Thêm sản phẩm 2 vào đơn hàng
-- Quần jean ống rộng nữ - Xanh dương - M
-- SKU: QJ-ONGRONG-BLUE-M
-- =========================================================
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
SELECT
    o.id,
    pv.id,
    p.name,
    cl.name,
    s.name,
    COALESCE(pi.image_url, '../images/products/default.jpg'),
    pv.sku,
    359000,
    1,
    359000
FROM orders o
JOIN product_variants pv
    ON pv.sku = 'QJ-ONGRONG-BLUE-M'
JOIN products p
    ON pv.product_id = p.id
JOIN colors cl
    ON pv.color_id = cl.id
JOIN sizes s
    ON pv.size_id = s.id
LEFT JOIN product_images pi
    ON p.id = pi.product_id
    AND pi.is_main = 1
WHERE o.order_code = 'DH000001'
AND NOT EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.order_id = o.id
    AND oi.sku = pv.sku
);


-- =========================================================
-- 4. Thêm sản phẩm 3 vào đơn hàng
-- Mũ lưỡi trai basic - Đen - Free size
-- SKU: MU-BASIC-BLACK-FREE
-- =========================================================
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
SELECT
    o.id,
    pv.id,
    p.name,
    cl.name,
    s.name,
    COALESCE(pi.image_url, '../images/products/default.jpg'),
    pv.sku,
    99000,
    1,
    99000
FROM orders o
JOIN product_variants pv
    ON pv.sku = 'MU-BASIC-BLACK-FREE'
JOIN products p
    ON pv.product_id = p.id
JOIN colors cl
    ON pv.color_id = cl.id
JOIN sizes s
    ON pv.size_id = s.id
LEFT JOIN product_images pi
    ON p.id = pi.product_id
    AND pi.is_main = 1
WHERE o.order_code = 'DH000001'
AND NOT EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.order_id = o.id
    AND oi.sku = pv.sku
);


-- =========================================================
-- 5. Thêm thông tin thanh toán mẫu
-- Phương thức: COD
-- Trạng thái: Chưa thanh toán
-- =========================================================
INSERT INTO payments (
    order_id,
    payment_method,
    amount,
    payment_status,
    transaction_code,
    paid_at
)
SELECT
    o.id,
    'cod',
    836000,
    'unpaid',
    NULL,
    NULL
FROM orders o
WHERE o.order_code = 'DH000001'
AND NOT EXISTS (
    SELECT 1
    FROM payments pm
    WHERE pm.order_id = o.id
    AND pm.payment_method = 'cod'
);