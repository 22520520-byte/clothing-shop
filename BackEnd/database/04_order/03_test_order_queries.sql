USE clothing_store;

-- =========================================================
-- File: 03_test_order_queries.sql
-- Mục đích: Kiểm tra dữ liệu nhóm đơn hàng
-- =========================================================


-- =========================================================
-- 1. Kiểm tra danh sách đơn hàng
-- =========================================================
SELECT
    o.id AS order_id,
    o.order_code,
    u.full_name AS customer_name,
    u.email,
    o.receiver_name,
    o.receiver_phone,
    o.shipping_address,
    o.total_product_price,
    o.shipping_fee,
    o.discount_amount,
    o.points_discount,
    o.final_total,
    o.payment_method,
    o.order_status,
    o.created_at,
    o.updated_at
FROM orders o
LEFT JOIN users u
    ON o.user_id = u.id
ORDER BY o.id;


-- =========================================================
-- 2. Kiểm tra chi tiết sản phẩm trong đơn hàng
-- =========================================================
SELECT
    oi.id AS order_item_id,
    o.order_code,
    oi.product_name,
    oi.color_name,
    oi.size_name,
    oi.sku,
    oi.price,
    oi.quantity,
    oi.total_price,
    oi.product_image,
    oi.created_at
FROM order_items oi
JOIN orders o
    ON oi.order_id = o.id
ORDER BY oi.id;


-- =========================================================
-- 3. Kiểm tra thông tin thanh toán
-- =========================================================
SELECT
    pm.id AS payment_id,
    o.order_code,
    pm.payment_method,
    pm.amount,
    pm.payment_status,
    pm.transaction_code,
    pm.paid_at,
    pm.created_at,
    pm.updated_at
FROM payments pm
JOIN orders o
    ON pm.order_id = o.id
ORDER BY pm.id;


-- =========================================================
-- 4. Test lấy dữ liệu cho trang my-order.html
-- Danh sách đơn hàng của khách hàng
-- =========================================================
SELECT
    o.id AS order_id,
    o.order_code,
    o.order_status,
    o.payment_method,
    o.total_product_price,
    o.shipping_fee,
    o.discount_amount,
    o.points_discount,
    o.final_total,
    COUNT(oi.id) AS total_items,
    SUM(oi.quantity) AS total_quantity,
    o.created_at
FROM orders o
LEFT JOIN order_items oi
    ON o.id = oi.order_id
LEFT JOIN users u
    ON o.user_id = u.id
WHERE u.email = 'customer@example.com'
GROUP BY
    o.id,
    o.order_code,
    o.order_status,
    o.payment_method,
    o.total_product_price,
    o.shipping_fee,
    o.discount_amount,
    o.points_discount,
    o.final_total,
    o.created_at
ORDER BY o.created_at DESC;


-- =========================================================
-- 5. Test lấy chi tiết một đơn hàng
-- Dùng cho order-detail.html
-- =========================================================
SELECT
    o.id AS order_id,
    o.order_code,
    u.full_name AS customer_name,
    u.email,
    o.receiver_name,
    o.receiver_phone,
    o.shipping_address,
    o.note,
    o.total_product_price,
    o.shipping_fee,
    o.discount_amount,
    o.points_discount,
    o.final_total,
    o.payment_method,
    o.order_status,
    o.created_at
FROM orders o
LEFT JOIN users u
    ON o.user_id = u.id
WHERE o.order_code = 'DH000001';


-- =========================================================
-- 6. Test lấy sản phẩm của một đơn hàng
-- Dùng cho order-detail.html
-- =========================================================
SELECT
    oi.id AS order_item_id,
    oi.product_name,
    oi.color_name,
    oi.size_name,
    oi.product_image,
    oi.sku,
    oi.price,
    oi.quantity,
    oi.total_price
FROM order_items oi
JOIN orders o
    ON oi.order_id = o.id
WHERE o.order_code = 'DH000001'
ORDER BY oi.id;


-- =========================================================
-- 7. Test lấy phần tổng tiền chi tiết của đơn hàng
-- Dùng cho dropdown tổng tiền ở order-detail/my-order
-- =========================================================
SELECT
    o.order_code,
    o.total_product_price AS tong_tien_hang,
    o.shipping_fee AS phi_van_chuyen,
    o.discount_amount AS giam_gia_voucher,
    o.points_discount AS giam_gia_diem,
    o.final_total AS tong_thanh_toan
FROM orders o
WHERE o.order_code = 'DH000001';


-- =========================================================
-- 8. Test kiểm tra thanh toán của đơn hàng
-- =========================================================
SELECT
    o.order_code,
    o.payment_method AS order_payment_method,
    pm.payment_method AS payment_method,
    pm.amount,
    pm.payment_status,
    pm.paid_at
FROM orders o
LEFT JOIN payments pm
    ON o.id = pm.order_id
WHERE o.order_code = 'DH000001';


-- =========================================================
-- 9. Test lấy đơn hàng theo trạng thái
-- Ví dụ: đơn hàng đang chờ xác nhận
-- =========================================================
SELECT
    o.order_code,
    u.full_name AS customer_name,
    o.receiver_phone,
    o.final_total,
    o.order_status,
    o.created_at
FROM orders o
LEFT JOIN users u
    ON o.user_id = u.id
WHERE o.order_status = 'pending'
ORDER BY o.created_at DESC;


-- =========================================================
-- 10. Test dữ liệu cho admin-order.html
-- Danh sách đơn hàng cho admin
-- =========================================================
SELECT
    o.id AS order_id,
    o.order_code,
    COALESCE(u.full_name, o.receiver_name) AS customer_name,
    o.receiver_phone,
    o.final_total,
    o.payment_method,
    pm.payment_status,
    o.order_status,
    o.created_at
FROM orders o
LEFT JOIN users u
    ON o.user_id = u.id
LEFT JOIN payments pm
    ON o.id = pm.order_id
ORDER BY o.created_at DESC;


-- =========================================================
-- 11. Kiểm tra số lượng dữ liệu từng bảng
-- =========================================================
SELECT COUNT(*) AS total_orders
FROM orders;

SELECT COUNT(*) AS total_order_items
FROM order_items;

SELECT COUNT(*) AS total_payments
FROM payments;


-- =========================================================
-- 12. Test tổng doanh thu từ đơn đã hoàn thành
-- Hiện tại đơn mẫu đang pending nên doanh thu có thể = NULL hoặc 0
-- =========================================================
SELECT
    COALESCE(SUM(final_total), 0) AS completed_revenue
FROM orders
WHERE order_status = 'completed';


-- =========================================================
-- 13. Test tổng tiền đơn hàng theo từng trạng thái
-- =========================================================
SELECT
    order_status,
    COUNT(*) AS total_orders,
    SUM(final_total) AS total_amount
FROM orders
GROUP BY order_status;