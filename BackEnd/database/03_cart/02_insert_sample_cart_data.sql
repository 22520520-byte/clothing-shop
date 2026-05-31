USE clothing_store;

-- =========================================================
-- File: 02_insert_sample_cart_data.sql
-- Mục đích: Thêm dữ liệu mẫu cho giỏ hàng
-- Yêu cầu: Chạy sau:
-- 1. 01_account
-- 2. 02_product
-- 3. 03_cart/01_create_cart_tables.sql
-- =========================================================


-- =========================================================
-- 1. Tạo giỏ hàng active cho khách hàng mẫu
-- Customer: customer@example.com
-- =========================================================
INSERT INTO carts (
    user_id,
    status
)
SELECT
    u.id,
    'active'
FROM users u
WHERE u.email = 'customer@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM carts c
    WHERE c.user_id = u.id
    AND c.status = 'active'
);


-- =========================================================
-- 2. Thêm sản phẩm 1 vào giỏ
-- Áo thun basic nam - Đen - Size M
-- SKU: ATB-NAM-BLACK-M
-- =========================================================
INSERT INTO cart_items (
    cart_id,
    variant_id,
    quantity,
    price_at_time
)
SELECT
    c.id,
    pv.id,
    2,
    COALESCE(pv.price, p.base_price)
FROM carts c
JOIN users u
    ON c.user_id = u.id
JOIN product_variants pv
    ON pv.sku = 'ATB-NAM-BLACK-M'
JOIN products p
    ON pv.product_id = p.id
WHERE u.email = 'customer@example.com'
AND c.status = 'active'
AND NOT EXISTS (
    SELECT 1
    FROM cart_items ci
    WHERE ci.cart_id = c.id
    AND ci.variant_id = pv.id
);


-- =========================================================
-- 3. Thêm sản phẩm 2 vào giỏ
-- Quần jean ống rộng nữ - Xanh dương - Size M
-- SKU: QJ-ONGRONG-BLUE-M
-- =========================================================
INSERT INTO cart_items (
    cart_id,
    variant_id,
    quantity,
    price_at_time
)
SELECT
    c.id,
    pv.id,
    1,
    COALESCE(pv.price, p.base_price)
FROM carts c
JOIN users u
    ON c.user_id = u.id
JOIN product_variants pv
    ON pv.sku = 'QJ-ONGRONG-BLUE-M'
JOIN products p
    ON pv.product_id = p.id
WHERE u.email = 'customer@example.com'
AND c.status = 'active'
AND NOT EXISTS (
    SELECT 1
    FROM cart_items ci
    WHERE ci.cart_id = c.id
    AND ci.variant_id = pv.id
);


-- =========================================================
-- 4. Thêm sản phẩm 3 vào giỏ
-- Mũ lưỡi trai basic - Đen - Free size
-- SKU: MU-BASIC-BLACK-FREE
-- =========================================================
INSERT INTO cart_items (
    cart_id,
    variant_id,
    quantity,
    price_at_time
)
SELECT
    c.id,
    pv.id,
    1,
    COALESCE(pv.price, p.base_price)
FROM carts c
JOIN users u
    ON c.user_id = u.id
JOIN product_variants pv
    ON pv.sku = 'MU-BASIC-BLACK-FREE'
JOIN products p
    ON pv.product_id = p.id
WHERE u.email = 'customer@example.com'
AND c.status = 'active'
AND NOT EXISTS (
    SELECT 1
    FROM cart_items ci
    WHERE ci.cart_id = c.id
    AND ci.variant_id = pv.id
);