USE clothing_store;

-- =========================================================
-- File: 04_test_product_queries.sql
-- Mục đích: Kiểm tra dữ liệu nhóm sản phẩm
-- =========================================================


-- =========================================================
-- 1. Kiểm tra danh mục sản phẩm
-- =========================================================
SELECT
    c.id,
    c.name,
    c.slug,
    parent.name AS parent_name,
    c.sort_order,
    c.status,
    c.created_at
FROM categories c
LEFT JOIN categories parent
    ON c.parent_id = parent.id
ORDER BY 
    c.parent_id,
    c.sort_order;


-- =========================================================
-- 2. Kiểm tra màu sắc
-- =========================================================
SELECT
    id,
    name,
    code,
    hex_code,
    status
FROM colors
ORDER BY id;


-- =========================================================
-- 3. Kiểm tra size
-- =========================================================
SELECT
    id,
    name,
    code,
    sort_order,
    status
FROM sizes
ORDER BY sort_order;


-- =========================================================
-- 4. Kiểm tra danh sách sản phẩm
-- =========================================================
SELECT
    p.id,
    c.name AS category_name,
    p.name,
    p.slug,
    p.base_price,
    p.old_price,
    p.gender,
    p.material,
    p.brand,
    p.is_featured,
    p.is_new,
    p.is_sale,
    p.status,
    p.created_at
FROM products p
JOIN categories c
    ON p.category_id = c.id
ORDER BY p.id;


-- =========================================================
-- 5. Kiểm tra biến thể sản phẩm
-- =========================================================
SELECT
    pv.id,
    p.name AS product_name,
    cl.name AS color_name,
    s.name AS size_name,
    pv.sku,
    pv.price,
    pv.old_price,
    pv.stock_quantity,
    pv.status
FROM product_variants pv
JOIN products p
    ON pv.product_id = p.id
JOIN colors cl
    ON pv.color_id = cl.id
JOIN sizes s
    ON pv.size_id = s.id
ORDER BY p.id, cl.id, s.sort_order;


-- =========================================================
-- 6. Kiểm tra ảnh sản phẩm
-- =========================================================
SELECT
    pi.id,
    p.name AS product_name,
    pi.image_url,
    pi.alt_text,
    pi.is_main,
    pi.sort_order
FROM product_images pi
JOIN products p
    ON pi.product_id = p.id
ORDER BY p.id, pi.sort_order;


-- =========================================================
-- 7. Kiểm tra đánh giá sản phẩm
-- =========================================================
SELECT
    pr.id,
    p.name AS product_name,
    u.full_name AS customer_name,
    pr.rating,
    pr.content,
    pr.status,
    pr.created_at
FROM product_reviews pr
JOIN products p
    ON pr.product_id = p.id
LEFT JOIN users u
    ON pr.user_id = u.id
ORDER BY pr.created_at DESC;


-- =========================================================
-- 8. Kiểm tra lịch sử tồn kho
-- =========================================================
SELECT
    psl.id,
    p.name AS product_name,
    pv.sku,
    u.full_name AS staff_name,
    psl.change_type,
    psl.quantity_change,
    psl.quantity_before,
    psl.quantity_after,
    psl.note,
    psl.created_at
FROM product_stock_logs psl
JOIN product_variants pv
    ON psl.variant_id = pv.id
JOIN products p
    ON pv.product_id = p.id
LEFT JOIN users u
    ON psl.user_id = u.id
ORDER BY psl.created_at DESC;


-- =========================================================
-- 9. Kiểm tra số lượng dữ liệu từng bảng
-- =========================================================
SELECT COUNT(*) AS total_categories FROM categories;

SELECT COUNT(*) AS total_colors FROM colors;

SELECT COUNT(*) AS total_sizes FROM sizes;

SELECT COUNT(*) AS total_products FROM products;

SELECT COUNT(*) AS total_product_variants FROM product_variants;

SELECT COUNT(*) AS total_product_images FROM product_images;

SELECT COUNT(*) AS total_product_reviews FROM product_reviews;

SELECT COUNT(*) AS total_product_stock_logs FROM product_stock_logs;


-- =========================================================
-- 10. Test lấy sản phẩm cho trang chủ
-- Gồm sản phẩm nổi bật, sản phẩm mới, sản phẩm sale
-- =========================================================
SELECT
    p.id,
    p.name,
    p.slug,
    p.base_price,
    p.old_price,
    p.is_featured,
    p.is_new,
    p.is_sale,
    pi.image_url AS main_image
FROM products p
LEFT JOIN product_images pi
    ON p.id = pi.product_id
    AND pi.is_main = 1
WHERE p.status = 'active'
AND (
    p.is_featured = 1
    OR p.is_new = 1
    OR p.is_sale = 1
)
ORDER BY p.created_at DESC;


-- =========================================================
-- 11. Test lấy sản phẩm theo danh mục áo thun
-- Dùng cho category page
-- =========================================================
SELECT
    p.id,
    p.name,
    p.slug,
    c.name AS category_name,
    p.base_price,
    p.old_price,
    pi.image_url AS main_image
FROM products p
JOIN categories c
    ON p.category_id = c.id
LEFT JOIN product_images pi
    ON p.id = pi.product_id
    AND pi.is_main = 1
WHERE c.slug = 'ao-thun'
AND p.status = 'active'
ORDER BY p.created_at DESC;


-- =========================================================
-- 12. Test lấy chi tiết một sản phẩm
-- Dùng cho product-detail.html
-- =========================================================
SELECT
    p.id,
    c.name AS category_name,
    p.name,
    p.slug,
    p.short_description,
    p.description,
    p.base_price,
    p.old_price,
    p.gender,
    p.material,
    p.brand,
    p.status
FROM products p
JOIN categories c
    ON p.category_id = c.id
WHERE p.slug = 'ao-thun-basic-nam';


-- =========================================================
-- 13. Test lấy màu và size của một sản phẩm
-- =========================================================
SELECT DISTINCT
    cl.id AS color_id,
    cl.name AS color_name,
    cl.code AS color_code,
    cl.hex_code,
    s.id AS size_id,
    s.name AS size_name,
    s.code AS size_code,
    pv.stock_quantity
FROM product_variants pv
JOIN products p
    ON pv.product_id = p.id
JOIN colors cl
    ON pv.color_id = cl.id
JOIN sizes s
    ON pv.size_id = s.id
WHERE p.slug = 'ao-thun-basic-nam'
AND pv.status = 'active'
ORDER BY cl.id, s.sort_order;


-- =========================================================
-- 14. Test tính tổng tồn kho theo sản phẩm
-- =========================================================
SELECT
    p.id,
    p.name,
    SUM(pv.stock_quantity) AS total_stock
FROM products p
JOIN product_variants pv
    ON p.id = pv.product_id
GROUP BY p.id, p.name
ORDER BY total_stock DESC;


-- =========================================================
-- 15. Test lọc sản phẩm theo khoảng giá
-- Ví dụ: từ 200.000đ đến 400.000đ
-- =========================================================
SELECT
    p.id,
    p.name,
    p.slug,
    p.base_price,
    p.old_price,
    pi.image_url AS main_image
FROM products p
LEFT JOIN product_images pi
    ON p.id = pi.product_id
    AND pi.is_main = 1
WHERE p.status = 'active'
AND p.base_price BETWEEN 200000 AND 400000
ORDER BY p.base_price ASC;


-- =========================================================
-- 16. Test tìm kiếm sản phẩm theo tên
-- Ví dụ: tìm sản phẩm có chữ "áo"
-- =========================================================
SELECT
    p.id,
    p.name,
    p.slug,
    c.name AS category_name,
    p.base_price,
    p.old_price,
    pi.image_url AS main_image
FROM products p
JOIN categories c
    ON p.category_id = c.id
LEFT JOIN product_images pi
    ON p.id = pi.product_id
    AND pi.is_main = 1
WHERE p.status = 'active'
AND p.name LIKE '%áo%'
ORDER BY p.created_at DESC;