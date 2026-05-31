USE clothing_store;

-- =========================================================
-- File: 01_create_report_views.sql
-- Mục đích: Tạo các VIEW phục vụ dashboard và báo cáo admin
-- Yêu cầu: Chạy sau các nhóm bảng account, product, order, promotion
-- =========================================================


-- =========================================================
-- 1. View tổng quan dashboard
-- Dùng cho admin-dashboard.html
-- =========================================================
CREATE OR REPLACE VIEW vw_dashboard_summary AS
SELECT
    (SELECT COUNT(*) FROM orders) AS total_orders,

    (SELECT COUNT(*)
     FROM orders
     WHERE order_status = 'pending') AS pending_orders,

    (SELECT COUNT(*)
     FROM orders
     WHERE order_status = 'completed') AS completed_orders,

    (SELECT COALESCE(SUM(final_total), 0)
     FROM orders
     WHERE order_status = 'completed') AS completed_revenue,

    (SELECT COUNT(*)
     FROM products
     WHERE status = 'active') AS active_products,

    (SELECT COUNT(*)
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE r.code = 'customer') AS total_customers,

    (SELECT COUNT(*)
     FROM product_variants
     WHERE stock_quantity <= 5) AS low_stock_variants;


-- =========================================================
-- 2. View doanh thu theo ngày
-- Chỉ tính đơn đã hoàn thành
-- =========================================================
CREATE OR REPLACE VIEW vw_revenue_by_day AS
SELECT
    DATE(created_at) AS report_date,
    COUNT(*) AS total_orders,
    COALESCE(SUM(final_total), 0) AS total_revenue
FROM orders
WHERE order_status = 'completed'
GROUP BY DATE(created_at);


-- =========================================================
-- 3. View số lượng đơn hàng theo trạng thái
-- =========================================================
CREATE OR REPLACE VIEW vw_orders_by_status AS
SELECT
    order_status,
    COUNT(*) AS total_orders,
    COALESCE(SUM(final_total), 0) AS total_amount
FROM orders
GROUP BY order_status;


-- =========================================================
-- 4. View sản phẩm bán chạy
-- Dựa trên order_items
-- =========================================================
CREATE OR REPLACE VIEW vw_best_selling_products AS
SELECT
    oi.product_name,
    oi.sku,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.total_price) AS total_revenue
FROM order_items oi
JOIN orders o
    ON oi.order_id = o.id
WHERE o.order_status IN ('confirmed', 'shipping', 'completed')
GROUP BY
    oi.product_name,
    oi.sku;


-- =========================================================
-- 5. View biến thể sắp hết hàng
-- =========================================================
CREATE OR REPLACE VIEW vw_low_stock_variants AS
SELECT
    pv.id AS variant_id,
    p.name AS product_name,
    pv.sku,
    c.name AS color_name,
    s.name AS size_name,
    pv.stock_quantity,
    pv.status
FROM product_variants pv
JOIN products p
    ON pv.product_id = p.id
JOIN colors c
    ON pv.color_id = c.id
JOIN sizes s
    ON pv.size_id = s.id
WHERE pv.stock_quantity <= 5;


-- =========================================================
-- 6. View khách hàng mua nhiều nhất
-- =========================================================
CREATE OR REPLACE VIEW vw_customer_ranking AS
SELECT
    u.id AS user_id,
    u.full_name,
    u.email,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(o.final_total), 0) AS total_spent
FROM users u
JOIN roles r
    ON u.role_id = r.id
LEFT JOIN orders o
    ON u.id = o.user_id
    AND o.order_status IN ('confirmed', 'shipping', 'completed')
WHERE r.code = 'customer'
GROUP BY
    u.id,
    u.full_name,
    u.email;


-- =========================================================
-- 7. View thống kê thanh toán
-- =========================================================
CREATE OR REPLACE VIEW vw_payment_summary AS
SELECT
    payment_method,
    payment_status,
    COUNT(*) AS total_payments,
    COALESCE(SUM(amount), 0) AS total_amount
FROM payments
GROUP BY
    payment_method,
    payment_status;