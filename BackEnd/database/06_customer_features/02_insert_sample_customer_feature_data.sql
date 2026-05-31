USE clothing_store;

-- =========================================================
-- File: 02_insert_sample_customer_feature_data.sql
-- Mục đích: Thêm dữ liệu mẫu cho sản phẩm yêu thích và điểm tích lũy
-- Yêu cầu: Chạy sau:
-- 1. 01_account
-- 2. 02_product
-- 3. 04_order
-- 4. 06_customer_features/01_create_customer_feature_tables.sql
-- =========================================================


-- =========================================================
-- 1. Thêm sản phẩm yêu thích mẫu
-- Customer: customer@example.com
-- =========================================================

-- Yêu thích Áo thun basic nam
INSERT INTO wishlists (
    user_id,
    product_id
)
SELECT
    u.id,
    p.id
FROM users u
JOIN products p
    ON p.slug = 'ao-thun-basic-nam'
WHERE u.email = 'customer@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM wishlists w
    WHERE w.user_id = u.id
    AND w.product_id = p.id
);


-- Yêu thích Quần jean ống rộng nữ
INSERT INTO wishlists (
    user_id,
    product_id
)
SELECT
    u.id,
    p.id
FROM users u
JOIN products p
    ON p.slug = 'quan-jean-ong-rong-nu'
WHERE u.email = 'customer@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM wishlists w
    WHERE w.user_id = u.id
    AND w.product_id = p.id
);


-- Yêu thích Váy ngắn xếp ly nữ
INSERT INTO wishlists (
    user_id,
    product_id
)
SELECT
    u.id,
    p.id
FROM users u
JOIN products p
    ON p.slug = 'vay-ngan-xep-ly-nu'
WHERE u.email = 'customer@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM wishlists w
    WHERE w.user_id = u.id
    AND w.product_id = p.id
);


-- =========================================================
-- 2. Thêm lịch sử điểm tích lũy mẫu
-- Customer: customer@example.com
-- =========================================================

-- Cộng điểm từ đơn hàng DH000001
INSERT INTO points_history (
    user_id,
    order_id,
    type,
    points,
    description
)
SELECT
    u.id,
    o.id,
    'earn',
    100,
    'Cộng 100 điểm sau khi đặt đơn hàng DH000001'
FROM users u
LEFT JOIN orders o
    ON o.order_code = 'DH000001'
WHERE u.email = 'customer@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM points_history ph
    WHERE ph.user_id = u.id
    AND ph.order_id = o.id
    AND ph.type = 'earn'
    AND ph.points = 100
);


-- Dùng điểm để giảm giá
INSERT INTO points_history (
    user_id,
    order_id,
    type,
    points,
    description
)
SELECT
    u.id,
    NULL,
    'use',
    -50,
    'Dùng 50 điểm để đổi ưu đãi giảm giá'
FROM users u
WHERE u.email = 'customer@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM points_history ph
    WHERE ph.user_id = u.id
    AND ph.type = 'use'
    AND ph.points = -50
    AND ph.description = 'Dùng 50 điểm để đổi ưu đãi giảm giá'
);


-- Thưởng điểm khi đánh giá sản phẩm
INSERT INTO points_history (
    user_id,
    order_id,
    type,
    points,
    description
)
SELECT
    u.id,
    NULL,
    'bonus',
    20,
    'Thưởng 20 điểm khi đánh giá sản phẩm'
FROM users u
WHERE u.email = 'customer@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM points_history ph
    WHERE ph.user_id = u.id
    AND ph.type = 'bonus'
    AND ph.points = 20
    AND ph.description = 'Thưởng 20 điểm khi đánh giá sản phẩm'
);


-- Thưởng điểm từ vòng quay may mắn
INSERT INTO points_history (
    user_id,
    order_id,
    type,
    points,
    description
)
SELECT
    u.id,
    NULL,
    'bonus',
    10,
    'Thưởng 10 điểm từ vòng quay may mắn'
FROM users u
WHERE u.email = 'customer@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM points_history ph
    WHERE ph.user_id = u.id
    AND ph.type = 'bonus'
    AND ph.points = 10
    AND ph.description = 'Thưởng 10 điểm từ vòng quay may mắn'
);


-- Hoàn điểm mẫu
INSERT INTO points_history (
    user_id,
    order_id,
    type,
    points,
    description
)
SELECT
    u.id,
    NULL,
    'refund',
    30,
    'Hoàn lại 30 điểm do hủy ưu đãi'
FROM users u
WHERE u.email = 'customer@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM points_history ph
    WHERE ph.user_id = u.id
    AND ph.type = 'refund'
    AND ph.points = 30
    AND ph.description = 'Hoàn lại 30 điểm do hủy ưu đãi'
);


-- =========================================================
-- 3. Cập nhật lại số điểm hiện có trong customer_profiles
-- =========================================================
UPDATE customer_profiles cp
JOIN users u
    ON cp.user_id = u.id
SET cp.points_balance = (
    SELECT COALESCE(SUM(ph.points), 0)
    FROM points_history ph
    WHERE ph.user_id = u.id
)
WHERE u.email = 'customer@example.com';