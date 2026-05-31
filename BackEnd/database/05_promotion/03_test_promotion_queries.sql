USE clothing_store;

-- =========================================================
-- File: 03_test_promotion_queries.sql
-- Mục đích: Kiểm tra dữ liệu nhóm khuyến mãi / voucher
-- =========================================================


-- =========================================================
-- 1. Kiểm tra danh sách voucher
-- =========================================================
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
ORDER BY id;


-- =========================================================
-- 2. Kiểm tra lịch sử sử dụng voucher
-- =========================================================
SELECT
    vu.id,
    v.code AS voucher_code,
    v.name AS voucher_name,
    u.full_name AS customer_name,
    u.email,
    o.order_code,
    vu.discount_amount,
    vu.used_at
FROM voucher_usages vu
JOIN vouchers v
    ON vu.voucher_id = v.id
LEFT JOIN users u
    ON vu.user_id = u.id
JOIN orders o
    ON vu.order_id = o.id
ORDER BY vu.used_at DESC;


-- =========================================================
-- 3. Kiểm tra chương trình khuyến mãi
-- =========================================================
SELECT
    id,
    name,
    slug,
    campaign_type,
    banner_image,
    start_date,
    end_date,
    status,
    created_at
FROM promotion_campaigns
ORDER BY id;


-- =========================================================
-- 4. Kiểm tra sản phẩm tham gia khuyến mãi
-- =========================================================
SELECT
    pp.id,
    pc.name AS campaign_name,
    pc.campaign_type,
    p.name AS product_name,
    p.base_price,
    pp.sale_price,
    pp.discount_percent,
    pp.sale_stock_limit,
    pp.sold_quantity,
    pp.status,
    pp.created_at
FROM promotion_products pp
JOIN promotion_campaigns pc
    ON pp.campaign_id = pc.id
JOIN products p
    ON pp.product_id = p.id
ORDER BY pc.id, pp.id;


-- =========================================================
-- 5. Test lấy voucher còn hiệu lực
-- Dùng cho checkout.html / big-voucher.html
-- =========================================================
SELECT
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
    end_date
FROM vouchers
WHERE status = 'active'
AND NOW() BETWEEN start_date AND end_date
AND used_quantity < quantity
ORDER BY id;


-- =========================================================
-- 6. Test kiểm tra voucher GIAM50K có dùng được cho đơn 600.000đ không
-- =========================================================
SELECT
    code,
    name,
    discount_type,
    discount_value,
    min_order_value,
    max_discount_amount,
    CASE
        WHEN status != 'active' THEN 'Voucher không hoạt động'
        WHEN NOW() < start_date THEN 'Voucher chưa bắt đầu'
        WHEN NOW() > end_date THEN 'Voucher đã hết hạn'
        WHEN used_quantity >= quantity THEN 'Voucher đã hết lượt'
        WHEN 600000 < min_order_value THEN 'Đơn hàng chưa đủ điều kiện'
        ELSE 'Có thể sử dụng'
    END AS voucher_status
FROM vouchers
WHERE code = 'GIAM50K';


-- =========================================================
-- 7. Test tính số tiền giảm của voucher WELCOME10 cho đơn 900.000đ
-- Nếu giảm theo phần trăm thì không vượt quá max_discount_amount
-- =========================================================
SELECT
    code,
    name,
    discount_type,
    discount_value,
    max_discount_amount,
    CASE
        WHEN discount_type = 'fixed' THEN discount_value
        WHEN discount_type = 'percent' THEN LEAST(900000 * discount_value / 100, max_discount_amount)
        WHEN discount_type = 'freeship' THEN discount_value
        ELSE 0
    END AS discount_amount
FROM vouchers
WHERE code = 'WELCOME10';


-- =========================================================
-- 8. Test kiểm tra số lần customer@example.com đã dùng voucher GIAM50K
-- =========================================================
SELECT
    u.full_name,
    u.email,
    v.code,
    COUNT(vu.id) AS used_count,
    v.usage_limit_per_user
FROM users u
JOIN vouchers v
    ON v.code = 'GIAM50K'
LEFT JOIN voucher_usages vu
    ON vu.user_id = u.id
    AND vu.voucher_id = v.id
WHERE u.email = 'customer@example.com'
GROUP BY
    u.full_name,
    u.email,
    v.code,
    v.usage_limit_per_user;


-- =========================================================
-- 9. Test lấy chương trình Flash Sale đang hoạt động
-- =========================================================
SELECT
    id,
    name,
    slug,
    description,
    banner_image,
    start_date,
    end_date,
    status
FROM promotion_campaigns
WHERE campaign_type = 'flash_sale'
AND status = 'active'
AND NOW() BETWEEN start_date AND end_date;


-- =========================================================
-- 10. Test lấy sản phẩm Flash Sale
-- Dùng cho flash-sale.html
-- =========================================================
SELECT
    pc.name AS campaign_name,
    p.id AS product_id,
    p.name AS product_name,
    p.slug,
    p.base_price,
    p.old_price,
    pp.sale_price,
    pp.discount_percent,
    pp.sale_stock_limit,
    pp.sold_quantity,
    COALESCE(pi.image_url, '../images/products/default.jpg') AS image_url,
    CASE
        WHEN pp.sale_price IS NOT NULL THEN pp.sale_price
        WHEN pp.discount_percent IS NOT NULL THEN p.base_price * (100 - pp.discount_percent) / 100
        ELSE p.base_price
    END AS final_sale_price
FROM promotion_products pp
JOIN promotion_campaigns pc
    ON pp.campaign_id = pc.id
JOIN products p
    ON pp.product_id = p.id
LEFT JOIN product_images pi
    ON p.id = pi.product_id
    AND pi.is_main = 1
WHERE pc.slug = 'flash-sale-cuoi-tuan'
AND pc.status = 'active'
AND pp.status = 'active'
ORDER BY pp.id;


-- =========================================================
-- 11. Test lấy sản phẩm Sale Hè
-- =========================================================
SELECT
    pc.name AS campaign_name,
    p.name AS product_name,
    p.base_price,
    pp.sale_price,
    pp.discount_percent,
    CASE
        WHEN pp.sale_price IS NOT NULL THEN pp.sale_price
        WHEN pp.discount_percent IS NOT NULL THEN p.base_price * (100 - pp.discount_percent) / 100
        ELSE p.base_price
    END AS final_sale_price
FROM promotion_products pp
JOIN promotion_campaigns pc
    ON pp.campaign_id = pc.id
JOIN products p
    ON pp.product_id = p.id
WHERE pc.slug = 'sale-he-nang-dong'
AND pp.status = 'active'
ORDER BY pp.id;


-- =========================================================
-- 12. Test lấy voucher cho trang big-voucher.html
-- =========================================================
SELECT
    code,
    name,
    description,
    discount_type,
    discount_value,
    min_order_value,
    max_discount_amount,
    quantity - used_quantity AS remaining_quantity,
    end_date
FROM vouchers
WHERE status = 'active'
AND NOW() BETWEEN start_date AND end_date
ORDER BY discount_value DESC;


-- =========================================================
-- 13. Kiểm tra số lượng dữ liệu từng bảng
-- =========================================================
SELECT COUNT(*) AS total_vouchers
FROM vouchers;

SELECT COUNT(*) AS total_voucher_usages
FROM voucher_usages;

SELECT COUNT(*) AS total_promotion_campaigns
FROM promotion_campaigns;

SELECT COUNT(*) AS total_promotion_products
FROM promotion_products;