USE clothing_store;

-- =========================================================
-- File: 04_test_account_queries.sql
-- Mục đích: Kiểm tra dữ liệu nhóm tài khoản người dùng
-- =========================================================


-- =========================================================
-- 1. Kiểm tra danh sách vai trò
-- =========================================================
SELECT *
FROM roles;


-- =========================================================
-- 2. Kiểm tra danh sách quyền
-- =========================================================
SELECT *
FROM permissions
ORDER BY module, code;


-- =========================================================
-- 3. Kiểm tra quyền của từng vai trò
-- =========================================================
SELECT
    r.id AS role_id,
    r.name AS role_name,
    r.code AS role_code,
    p.id AS permission_id,
    p.name AS permission_name,
    p.code AS permission_code,
    p.module
FROM role_permissions rp
JOIN roles r
    ON rp.role_id = r.id
JOIN permissions p
    ON rp.permission_id = p.id
ORDER BY r.id, p.module, p.code;


-- =========================================================
-- 4. Kiểm tra số lượng quyền của từng vai trò
-- =========================================================
SELECT
    r.name AS role_name,
    r.code AS role_code,
    COUNT(rp.permission_id) AS total_permissions
FROM roles r
LEFT JOIN role_permissions rp
    ON r.id = rp.role_id
GROUP BY r.id, r.name, r.code
ORDER BY r.id;


-- =========================================================
-- 5. Kiểm tra danh sách tài khoản
-- =========================================================
SELECT
    u.id,
    r.name AS role_name,
    r.code AS role_code,
    u.full_name,
    u.email,
    u.phone,
    u.gender,
    u.date_of_birth,
    u.status,
    u.last_login_at,
    u.created_at
FROM users u
JOIN roles r
    ON u.role_id = r.id
ORDER BY u.id;


-- =========================================================
-- 6. Kiểm tra profile khách hàng
-- =========================================================
SELECT
    cp.id,
    u.full_name,
    u.email,
    cp.membership_level,
    cp.points_balance,
    cp.total_orders,
    cp.total_spent,
    cp.note
FROM customer_profiles cp
JOIN users u
    ON cp.user_id = u.id;


-- =========================================================
-- 7. Kiểm tra profile nhân viên/admin/chủ cửa hàng
-- =========================================================
SELECT
    sp.id,
    u.full_name,
    u.email,
    r.name AS role_name,
    sp.staff_code,
    sp.position_name,
    sp.department,
    sp.start_date,
    sp.end_date,
    sp.work_status,
    sp.note
FROM staff_profiles sp
JOIN users u
    ON sp.user_id = u.id
JOIN roles r
    ON u.role_id = r.id
ORDER BY sp.id;


-- =========================================================
-- 8. Kiểm tra địa chỉ giao hàng của khách hàng
-- =========================================================
SELECT
    ua.id,
    u.full_name,
    u.email,
    ua.receiver_name,
    ua.receiver_phone,
    ua.province,
    ua.district,
    ua.ward,
    ua.address_detail,
    ua.is_default
FROM user_addresses ua
JOIN users u
    ON ua.user_id = u.id
ORDER BY ua.id;


-- =========================================================
-- 9. Kiểm tra lịch sử hoạt động nhân viên/admin
-- =========================================================
SELECT
    sal.id,
    u.full_name,
    u.email,
    r.name AS role_name,
    sal.action_code,
    sal.action_name,
    sal.target_type,
    sal.target_id,
    sal.description,
    sal.ip_address,
    sal.created_at
FROM staff_activity_logs sal
LEFT JOIN users u
    ON sal.user_id = u.id
LEFT JOIN roles r
    ON u.role_id = r.id
ORDER BY sal.created_at DESC;


-- =========================================================
-- 10. Kiểm tra bảng password_resets
-- Hiện tại có thể chưa có dữ liệu
-- =========================================================
SELECT *
FROM password_resets;


-- =========================================================
-- 11. Kiểm tra bảng user_sessions
-- Hiện tại có thể chưa có dữ liệu
-- =========================================================
SELECT *
FROM user_sessions;


-- =========================================================
-- 12. Test lấy quyền của tài khoản admin
-- =========================================================
SELECT
    u.full_name,
    u.email,
    r.code AS role_code,
    p.code AS permission_code,
    p.name AS permission_name,
    p.module
FROM users u
JOIN roles r
    ON u.role_id = r.id
JOIN role_permissions rp
    ON r.id = rp.role_id
JOIN permissions p
    ON rp.permission_id = p.id
WHERE u.email = 'admin@example.com'
ORDER BY p.module, p.code;


-- =========================================================
-- 13. Test lấy quyền của tài khoản staff
-- =========================================================
SELECT
    u.full_name,
    u.email,
    r.code AS role_code,
    p.code AS permission_code,
    p.name AS permission_name,
    p.module
FROM users u
JOIN roles r
    ON u.role_id = r.id
JOIN role_permissions rp
    ON r.id = rp.role_id
JOIN permissions p
    ON rp.permission_id = p.id
WHERE u.email = 'staff@example.com'
ORDER BY p.module, p.code;


-- =========================================================
-- 14. Test lấy quyền của tài khoản owner
-- =========================================================
SELECT
    u.full_name,
    u.email,
    r.code AS role_code,
    p.code AS permission_code,
    p.name AS permission_name,
    p.module
FROM users u
JOIN roles r
    ON u.role_id = r.id
JOIN role_permissions rp
    ON r.id = rp.role_id
JOIN permissions p
    ON rp.permission_id = p.id
WHERE u.email = 'owner@example.com'
ORDER BY p.module, p.code;