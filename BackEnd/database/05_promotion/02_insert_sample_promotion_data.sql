USE clothing_store;

-- =========================================================
-- File: 02_insert_sample_promotion_data.sql
-- Mục đích: Thêm dữ liệu mẫu cho nhóm khuyến mãi
-- Yêu cầu: Chạy sau:
-- 1. 01_account
-- 2. 02_product
-- 3. 04_order
-- 4. 05_promotion/01_create_promotion_tables.sql
-- =========================================================


-- =========================================================
-- 1. Thêm dữ liệu vouchers
-- =========================================================
INSERT INTO vouchers (
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
)
VALUES
(
    'GIAM50K',
    'Giảm 50.000đ cho đơn từ 500.000đ',
    'Voucher giảm trực tiếp 50.000đ cho đơn hàng có giá trị từ 500.000đ.',
    'fixed',
    50000,
    500000,
    NULL,
    100,
    0,
    1,
    '2026-01-01 00:00:00',
    '2026-12-31 23:59:59',
    'active'
),
(
    'WELCOME10',
    'Giảm 10% cho khách hàng mới',
    'Voucher giảm 10% cho khách hàng mới, tối đa 80.000đ.',
    'percent',
    10,
    300000,
    80000,
    200,
    0,
    1,
    '2026-01-01 00:00:00',
    '2026-12-31 23:59:59',
    'active'
),
(
    'FREESHIP',
    'Miễn phí vận chuyển',
    'Voucher hỗ trợ phí vận chuyển cho đơn hàng từ 250.000đ.',
    'freeship',
    30000,
    250000,
    30000,
    150,
    0,
    2,
    '2026-01-01 00:00:00',
    '2026-12-31 23:59:59',
    'active'
),
(
    'BIGSALE20',
    'Big Sale giảm 20%',
    'Voucher giảm 20% cho chương trình Big Sale, tối đa 150.000đ.',
    'percent',
    20,
    700000,
    150000,
    50,
    0,
    1,
    '2026-01-01 00:00:00',
    '2026-12-31 23:59:59',
    'active'
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    discount_type = VALUES(discount_type),
    discount_value = VALUES(discount_value),
    min_order_value = VALUES(min_order_value),
    max_discount_amount = VALUES(max_discount_amount),
    quantity = VALUES(quantity),
    usage_limit_per_user = VALUES(usage_limit_per_user),
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    status = VALUES(status);


-- =========================================================
-- 2. Thêm lịch sử sử dụng voucher mẫu
-- Voucher GIAM50K được dùng cho đơn DH000001
-- =========================================================
INSERT INTO voucher_usages (
    voucher_id,
    user_id,
    order_id,
    discount_amount,
    used_at
)
SELECT
    v.id,
    u.id,
    o.id,
    50000,
    NOW()
FROM vouchers v
JOIN orders o
    ON o.order_code = 'DH000001'
LEFT JOIN users u
    ON u.email = 'customer@example.com'
WHERE v.code = 'GIAM50K'
AND NOT EXISTS (
    SELECT 1
    FROM voucher_usages vu
    WHERE vu.voucher_id = v.id
    AND vu.order_id = o.id
);


-- =========================================================
-- 3. Cập nhật lại số lượt đã dùng của voucher
-- =========================================================
UPDATE vouchers v
SET used_quantity = (
    SELECT COUNT(*)
    FROM voucher_usages vu
    WHERE vu.voucher_id = v.id
)
WHERE v.code IN (
    'GIAM50K',
    'WELCOME10',
    'FREESHIP',
    'BIGSALE20'
);


-- =========================================================
-- 4. Thêm chương trình khuyến mãi mẫu
-- =========================================================
INSERT INTO promotion_campaigns (
    name,
    slug,
    description,
    banner_image,
    campaign_type,
    start_date,
    end_date,
    status
)
VALUES
(
    'Flash Sale Cuối Tuần',
    'flash-sale-cuoi-tuan',
    'Chương trình flash sale cuối tuần với nhiều sản phẩm thời trang giảm giá mạnh.',
    '../images/banners/flash-sale-cuoi-tuan.jpg',
    'flash_sale',
    '2026-01-01 00:00:00',
    '2026-12-31 23:59:59',
    'active'
),
(
    'Big Voucher Tháng 5',
    'big-voucher-thang-5',
    'Chương trình big voucher dành cho khách hàng mua sắm trong tháng.',
    '../images/banners/big-voucher-thang-5.jpg',
    'big_voucher',
    '2026-01-01 00:00:00',
    '2026-12-31 23:59:59',
    'active'
),
(
    'Sale Hè Năng Động',
    'sale-he-nang-dong',
    'Chương trình ưu đãi mùa hè cho các sản phẩm áo thun, quần short và phụ kiện.',
    '../images/banners/sale-he-nang-dong.jpg',
    'seasonal_sale',
    '2026-01-01 00:00:00',
    '2026-12-31 23:59:59',
    'active'
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    banner_image = VALUES(banner_image),
    campaign_type = VALUES(campaign_type),
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    status = VALUES(status);


-- =========================================================
-- 5. Thêm sản phẩm tham gia Flash Sale Cuối Tuần
-- Áo thun basic nam giảm còn 159.000đ
-- =========================================================
INSERT INTO promotion_products (
    campaign_id,
    product_id,
    variant_id,
    sale_price,
    discount_percent,
    sale_stock_limit,
    sold_quantity,
    status
)
SELECT
    pc.id,
    p.id,
    NULL,
    159000,
    NULL,
    50,
    0,
    'active'
FROM promotion_campaigns pc
JOIN products p
    ON p.slug = 'ao-thun-basic-nam'
WHERE pc.slug = 'flash-sale-cuoi-tuan'
AND NOT EXISTS (
    SELECT 1
    FROM promotion_products pp
    WHERE pp.campaign_id = pc.id
    AND pp.product_id = p.id
    AND pp.variant_id IS NULL
);


-- =========================================================
-- 6. Thêm sản phẩm thứ 2 tham gia Flash Sale
-- Quần jean ống rộng nữ giảm còn 299.000đ
-- =========================================================
INSERT INTO promotion_products (
    campaign_id,
    product_id,
    variant_id,
    sale_price,
    discount_percent,
    sale_stock_limit,
    sold_quantity,
    status
)
SELECT
    pc.id,
    p.id,
    NULL,
    299000,
    NULL,
    30,
    0,
    'active'
FROM promotion_campaigns pc
JOIN products p
    ON p.slug = 'quan-jean-ong-rong-nu'
WHERE pc.slug = 'flash-sale-cuoi-tuan'
AND NOT EXISTS (
    SELECT 1
    FROM promotion_products pp
    WHERE pp.campaign_id = pc.id
    AND pp.product_id = p.id
    AND pp.variant_id IS NULL
);


-- =========================================================
-- 7. Thêm sản phẩm tham gia Sale Hè
-- Quần short kaki nam giảm 15%
-- =========================================================
INSERT INTO promotion_products (
    campaign_id,
    product_id,
    variant_id,
    sale_price,
    discount_percent,
    sale_stock_limit,
    sold_quantity,
    status
)
SELECT
    pc.id,
    p.id,
    NULL,
    NULL,
    15,
    40,
    0,
    'active'
FROM promotion_campaigns pc
JOIN products p
    ON p.slug = 'quan-short-kaki-nam'
WHERE pc.slug = 'sale-he-nang-dong'
AND NOT EXISTS (
    SELECT 1
    FROM promotion_products pp
    WHERE pp.campaign_id = pc.id
    AND pp.product_id = p.id
    AND pp.variant_id IS NULL
);


-- =========================================================
-- 8. Thêm phụ kiện tham gia Sale Hè
-- Mũ lưỡi trai basic giảm còn 79.000đ
-- =========================================================
INSERT INTO promotion_products (
    campaign_id,
    product_id,
    variant_id,
    sale_price,
    discount_percent,
    sale_stock_limit,
    sold_quantity,
    status
)
SELECT
    pc.id,
    p.id,
    NULL,
    79000,
    NULL,
    60,
    0,
    'active'
FROM promotion_campaigns pc
JOIN products p
    ON p.slug = 'mu-luoi-trai-basic'
WHERE pc.slug = 'sale-he-nang-dong'
AND NOT EXISTS (
    SELECT 1
    FROM promotion_products pp
    WHERE pp.campaign_id = pc.id
    AND pp.product_id = p.id
    AND pp.variant_id IS NULL
);