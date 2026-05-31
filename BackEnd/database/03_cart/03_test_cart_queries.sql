USE clothing_store;

-- =========================================================
-- File: 03_test_cart_queries.sql
-- Mục đích: Kiểm tra dữ liệu nhóm giỏ hàng
-- =========================================================


-- =========================================================
-- 1. Kiểm tra danh sách giỏ hàng
-- =========================================================
SELECT
    c.id AS cart_id,
    u.full_name,
    u.email,
    c.status,
    c.created_at,
    c.updated_at
FROM carts c
JOIN users u
    ON c.user_id = u.id
ORDER BY c.id;


-- =========================================================
-- 2. Kiểm tra chi tiết sản phẩm trong giỏ hàng
-- =========================================================
SELECT
    ci.id AS cart_item_id,
    c.id AS cart_id,
    u.full_name,
    u.email,

    p.name AS product_name,
    pv.sku,
    cl.name AS color_name,
    s.name AS size_name,

    ci.quantity,
    ci.price_at_time,
    ci.quantity * ci.price_at_time AS total_price,

    ci.created_at,
    ci.updated_at
FROM cart_items ci
JOIN carts c
    ON ci.cart_id = c.id
JOIN users u
    ON c.user_id = u.id
JOIN product_variants pv
    ON ci.variant_id = pv.id
JOIN products p
    ON pv.product_id = p.id
JOIN colors cl
    ON pv.color_id = cl.id
JOIN sizes s
    ON pv.size_id = s.id
ORDER BY ci.id;


-- =========================================================
-- 3. Kiểm tra giỏ hàng active của customer@example.com
-- =========================================================
SELECT
    c.id AS cart_id,
    u.full_name,
    u.email,
    c.status,
    COUNT(ci.id) AS total_items,
    SUM(ci.quantity) AS total_quantity,
    SUM(ci.quantity * ci.price_at_time) AS subtotal
FROM carts c
JOIN users u
    ON c.user_id = u.id
LEFT JOIN cart_items ci
    ON c.id = ci.cart_id
WHERE u.email = 'customer@example.com'
AND c.status = 'active'
GROUP BY c.id, u.full_name, u.email, c.status;


-- =========================================================
-- 4. Test lấy dữ liệu giỏ hàng để hiển thị trên cart.html
-- =========================================================
SELECT
    ci.id AS cart_item_id,

    p.id AS product_id,
    p.name AS product_name,
    p.slug AS product_slug,

    pv.id AS variant_id,
    pv.sku,
    cl.name AS color_name,
    cl.code AS color_code,
    s.name AS size_name,
    s.code AS size_code,

    COALESCE(pi.image_url, '../images/products/default.jpg') AS image_url,

    ci.quantity,
    ci.price_at_time,
    ci.quantity * ci.price_at_time AS total_price,

    pv.stock_quantity
FROM cart_items ci
JOIN carts c
    ON ci.cart_id = c.id
JOIN users u
    ON c.user_id = u.id
JOIN product_variants pv
    ON ci.variant_id = pv.id
JOIN products p
    ON pv.product_id = p.id
JOIN colors cl
    ON pv.color_id = cl.id
JOIN sizes s
    ON pv.size_id = s.id
LEFT JOIN product_images pi
    ON p.id = pi.product_id
    AND pi.is_main = 1
WHERE u.email = 'customer@example.com'
AND c.status = 'active'
ORDER BY ci.id;


-- =========================================================
-- 5. Test tính tổng tiền giỏ hàng
-- =========================================================
SELECT
    u.full_name,
    u.email,
    c.id AS cart_id,

    COUNT(ci.id) AS total_cart_items,
    SUM(ci.quantity) AS total_quantity,
    SUM(ci.quantity * ci.price_at_time) AS subtotal
FROM carts c
JOIN users u
    ON c.user_id = u.id
JOIN cart_items ci
    ON c.id = ci.cart_id
WHERE u.email = 'customer@example.com'
AND c.status = 'active'
GROUP BY u.full_name, u.email, c.id;


-- =========================================================
-- 6. Test kiểm tra sản phẩm trong giỏ còn đủ tồn kho không
-- =========================================================
SELECT
    p.name AS product_name,
    pv.sku,
    ci.quantity AS cart_quantity,
    pv.stock_quantity,
    CASE
        WHEN pv.stock_quantity >= ci.quantity THEN 'Đủ hàng'
        ELSE 'Không đủ hàng'
    END AS stock_status
FROM cart_items ci
JOIN carts c
    ON ci.cart_id = c.id
JOIN users u
    ON c.user_id = u.id
JOIN product_variants pv
    ON ci.variant_id = pv.id
JOIN products p
    ON pv.product_id = p.id
WHERE u.email = 'customer@example.com'
AND c.status = 'active';


-- =========================================================
-- 7. Kiểm tra số lượng dữ liệu từng bảng
-- =========================================================
SELECT COUNT(*) AS total_carts
FROM carts;

SELECT COUNT(*) AS total_cart_items
FROM cart_items;