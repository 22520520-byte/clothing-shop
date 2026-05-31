USE clothing_store;

-- =========================================================
-- File: 03_test_customer_feature_queries.sql
-- Mục đích: Kiểm tra dữ liệu nhóm tính năng khách hàng
-- Gồm: sản phẩm yêu thích, lịch sử điểm tích lũy
-- =========================================================


-- =========================================================
-- 1. Kiểm tra danh sách sản phẩm yêu thích
-- =========================================================
SELECT
    w.id AS wishlist_id,
    u.full_name,
    u.email,
    p.id AS product_id,
    p.name AS product_name,
    p.slug,
    p.base_price,
    p.old_price,
    COALESCE(pi.image_url, '../images/products/default.jpg') AS image_url,
    w.created_at
FROM wishlists w
JOIN users u
    ON w.user_id = u.id
JOIN products p
    ON w.product_id = p.id
LEFT JOIN product_images pi
    ON p.id = pi.product_id
    AND pi.is_main = 1
ORDER BY w.created_at DESC;


-- =========================================================
-- 2. Test lấy wishlist của customer@example.com
-- Dùng cho wishlist.html
-- =========================================================
SELECT
    w.id AS wishlist_id,
    p.id AS product_id,
    p.name AS product_name,
    p.slug,
    c.name AS category_name,
    p.base_price,
    p.old_price,
    p.is_sale,
    p.status,
    COALESCE(pi.image_url, '../images/products/default.jpg') AS image_url,
    w.created_at
FROM wishlists w
JOIN users u
    ON w.user_id = u.id
JOIN products p
    ON w.product_id = p.id
JOIN categories c
    ON p.category_id = c.id
LEFT JOIN product_images pi
    ON p.id = pi.product_id
    AND pi.is_main = 1
WHERE u.email = 'customer@example.com'
ORDER BY w.created_at DESC;


-- =========================================================
-- 3. Kiểm tra lịch sử điểm tích lũy
-- =========================================================
SELECT
    ph.id AS point_history_id,
    u.full_name,
    u.email,
    o.order_code,
    ph.type,
    ph.points,
    ph.description,
    ph.created_at
FROM points_history ph
JOIN users u
    ON ph.user_id = u.id
LEFT JOIN orders o
    ON ph.order_id = o.id
ORDER BY ph.created_at DESC;


-- =========================================================
-- 4. Test lấy lịch sử điểm của customer@example.com
-- Dùng cho points.html
-- =========================================================
SELECT
    ph.id,
    ph.type,
    ph.points,
    ph.description,
    o.order_code,
    ph.created_at
FROM points_history ph
JOIN users u
    ON ph.user_id = u.id
LEFT JOIN orders o
    ON ph.order_id = o.id
WHERE u.email = 'customer@example.com'
ORDER BY ph.created_at DESC;


-- =========================================================
-- 5. Test tính tổng điểm hiện có từ points_history
-- =========================================================
SELECT
    u.full_name,
    u.email,
    COALESCE(SUM(ph.points), 0) AS calculated_points_balance
FROM users u
LEFT JOIN points_history ph
    ON u.id = ph.user_id
WHERE u.email = 'customer@example.com'
GROUP BY u.id, u.full_name, u.email;


-- =========================================================
-- 6. So sánh điểm trong customer_profiles với lịch sử điểm
-- =========================================================
SELECT
    u.full_name,
    u.email,
    cp.points_balance AS profile_points_balance,
    COALESCE(SUM(ph.points), 0) AS calculated_points_balance,
    CASE
        WHEN cp.points_balance = COALESCE(SUM(ph.points), 0) THEN 'Khớp'
        ELSE 'Không khớp'
    END AS check_status
FROM customer_profiles cp
JOIN users u
    ON cp.user_id = u.id
LEFT JOIN points_history ph
    ON u.id = ph.user_id
WHERE u.email = 'customer@example.com'
GROUP BY
    u.id,
    u.full_name,
    u.email,
    cp.points_balance;


-- =========================================================
-- 7. Test đếm số sản phẩm yêu thích của từng khách hàng
-- =========================================================
SELECT
    u.full_name,
    u.email,
    COUNT(w.id) AS total_wishlist_products
FROM users u
LEFT JOIN wishlists w
    ON u.id = w.user_id
WHERE u.email = 'customer@example.com'
GROUP BY u.id, u.full_name, u.email;


-- =========================================================
-- 8. Test kiểm tra một sản phẩm đã nằm trong wishlist chưa
-- Ví dụ: Áo thun basic nam
-- =========================================================
SELECT
    u.full_name,
    u.email,
    p.name AS product_name,
    CASE
        WHEN w.id IS NOT NULL THEN 'Đã yêu thích'
        ELSE 'Chưa yêu thích'
    END AS wishlist_status
FROM users u
JOIN products p
    ON p.slug = 'ao-thun-basic-nam'
LEFT JOIN wishlists w
    ON w.user_id = u.id
    AND w.product_id = p.id
WHERE u.email = 'customer@example.com';


-- =========================================================
-- 9. Test thống kê điểm theo từng loại
-- =========================================================
SELECT
    u.full_name,
    u.email,
    ph.type,
    COUNT(ph.id) AS total_transactions,
    SUM(ph.points) AS total_points
FROM points_history ph
JOIN users u
    ON ph.user_id = u.id
WHERE u.email = 'customer@example.com'
GROUP BY u.id, u.full_name, u.email, ph.type
ORDER BY ph.type;


-- =========================================================
-- 10. Kiểm tra số lượng dữ liệu từng bảng
-- =========================================================
SELECT COUNT(*) AS total_wishlists
FROM wishlists;

SELECT COUNT(*) AS total_points_history
FROM points_history;