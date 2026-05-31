USE clothing_store;

-- =========================================================
-- File: 02_test_report_queries.sql
-- Mục đích: Kiểm tra các VIEW báo cáo / dashboard admin
-- Ghi chú: Đã thêm clothing_store. trước tên view/bảng để tránh lỗi sai database
-- =========================================================


-- =========================================================
-- 1. Kiểm tra tổng quan dashboard
-- Dùng cho admin-dashboard.html
-- =========================================================
SELECT *
FROM clothing_store.vw_dashboard_summary;


-- =========================================================
-- 2. Kiểm tra doanh thu theo ngày
-- Chỉ tính đơn đã hoàn thành
-- =========================================================
SELECT *
FROM clothing_store.vw_revenue_by_day
ORDER BY report_date DESC;


-- =========================================================
-- 3. Kiểm tra số lượng đơn theo trạng thái
-- =========================================================
SELECT *
FROM clothing_store.vw_orders_by_status
ORDER BY total_orders DESC;


-- =========================================================
-- 4. Kiểm tra sản phẩm bán chạy
-- =========================================================
SELECT *
FROM clothing_store.vw_best_selling_products
ORDER BY total_sold DESC;


-- =========================================================
-- 5. Kiểm tra biến thể sắp hết hàng
-- =========================================================
SELECT *
FROM clothing_store.vw_low_stock_variants
ORDER BY stock_quantity ASC;


-- =========================================================
-- 6. Kiểm tra khách hàng mua nhiều nhất
-- =========================================================
SELECT *
FROM clothing_store.vw_customer_ranking
ORDER BY total_spent DESC;


-- =========================================================
-- 7. Kiểm tra thống kê thanh toán
-- =========================================================
SELECT *
FROM clothing_store.vw_payment_summary
ORDER BY payment_method, payment_status;


-- =========================================================
-- 8. Test thống kê số lượng bảng chính trong hệ thống
-- =========================================================
SELECT 'users' AS table_name, COUNT(*) AS total_rows 
FROM clothing_store.users

UNION ALL

SELECT 'products', COUNT(*) 
FROM clothing_store.products

UNION ALL

SELECT 'product_variants', COUNT(*) 
FROM clothing_store.product_variants

UNION ALL

SELECT 'orders', COUNT(*) 
FROM clothing_store.orders

UNION ALL

SELECT 'order_items', COUNT(*) 
FROM clothing_store.order_items

UNION ALL

SELECT 'payments', COUNT(*) 
FROM clothing_store.payments

UNION ALL

SELECT 'vouchers', COUNT(*) 
FROM clothing_store.vouchers

UNION ALL

SELECT 'wishlists', COUNT(*) 
FROM clothing_store.wishlists

UNION ALL

SELECT 'points_history', COUNT(*) 
FROM clothing_store.points_history;


-- =========================================================
-- 9. Test dữ liệu cho thẻ thống kê dashboard
-- =========================================================
SELECT
    total_orders AS tong_don_hang,
    pending_orders AS don_cho_xac_nhan,
    completed_orders AS don_hoan_thanh,
    completed_revenue AS doanh_thu_hoan_thanh,
    active_products AS san_pham_dang_ban,
    total_customers AS tong_khach_hang,
    low_stock_variants AS bien_the_sap_het_hang
FROM clothing_store.vw_dashboard_summary;


-- =========================================================
-- 10. Test top sản phẩm bán chạy
-- =========================================================
SELECT
    product_name,
    sku,
    total_sold,
    total_revenue
FROM clothing_store.vw_best_selling_products
ORDER BY total_sold DESC
LIMIT 5;


-- =========================================================
-- 11. Test top khách hàng theo tổng chi tiêu
-- =========================================================
SELECT
    full_name,
    email,
    total_orders,
    total_spent
FROM clothing_store.vw_customer_ranking
ORDER BY total_spent DESC
LIMIT 5;


-- =========================================================
-- 12. Test đơn hàng chờ xử lý cho admin-dashboard
-- =========================================================
SELECT
    o.order_code,
    COALESCE(u.full_name, o.receiver_name) AS customer_name,
    o.receiver_phone,
    o.final_total,
    o.payment_method,
    o.order_status,
    o.created_at
FROM clothing_store.orders o
LEFT JOIN clothing_store.users u
    ON o.user_id = u.id
WHERE o.order_status = 'pending'
ORDER BY o.created_at DESC
LIMIT 10;


-- =========================================================
-- 13. Test sản phẩm tồn kho thấp
-- =========================================================
SELECT
    product_name,
    sku,
    color_name,
    size_name,
    stock_quantity,
    status
FROM clothing_store.vw_low_stock_variants
ORDER BY stock_quantity ASC
LIMIT 10;


-- =========================================================
-- 14. Test doanh thu theo phương thức thanh toán
-- =========================================================
SELECT
    payment_method,
    COUNT(*) AS total_orders,
    SUM(amount) AS total_amount
FROM clothing_store.payments
GROUP BY payment_method
ORDER BY total_amount DESC;


-- =========================================================
-- 15. Test doanh thu theo tháng
-- Chỉ tính đơn hoàn thành
-- =========================================================
SELECT
    DATE_FORMAT(created_at, '%Y-%m') AS report_month,
    COUNT(*) AS total_orders,
    COALESCE(SUM(final_total), 0) AS total_revenue
FROM clothing_store.orders
WHERE order_status = 'completed'
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY report_month DESC;


-- =========================================================
-- 16. Test số lượng sản phẩm theo danh mục
-- =========================================================
SELECT
    c.name AS category_name,
    COUNT(p.id) AS total_products
FROM clothing_store.categories c
LEFT JOIN clothing_store.products p
    ON c.id = p.category_id
GROUP BY c.id, c.name
ORDER BY total_products DESC;


-- =========================================================
-- 17. Test tổng tồn kho theo sản phẩm
-- =========================================================
SELECT
    p.name AS product_name,
    SUM(pv.stock_quantity) AS total_stock
FROM clothing_store.products p
JOIN clothing_store.product_variants pv
    ON p.id = pv.product_id
GROUP BY p.id, p.name
ORDER BY total_stock DESC;


-- =========================================================
-- 18. Test số lượng đơn hàng theo ngày
-- =========================================================
SELECT
    DATE(created_at) AS order_date,
    COUNT(*) AS total_orders
FROM clothing_store.orders
GROUP BY DATE(created_at)
ORDER BY order_date DESC;


-- =========================================================
-- 19. Test tổng doanh thu tất cả đơn không bị hủy
-- =========================================================
SELECT
    COALESCE(SUM(final_total), 0) AS total_valid_revenue
FROM clothing_store.orders
WHERE order_status != 'cancelled';


-- =========================================================
-- 20. Kiểm tra danh sách VIEW đã tạo
-- =========================================================
SELECT TABLE_NAME
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = 'clothing_store'
ORDER BY TABLE_NAME;