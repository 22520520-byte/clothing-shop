USE clothing_store;

-- =========================================================
-- File: 03_insert_sample_users.sql
-- Mục đích: Thêm tài khoản mẫu để test đăng nhập và phân quyền
-- Lưu ý: password_hash được tạo bằng password_hash() trong PHP
-- =========================================================


-- =========================================================
-- 1. Thêm tài khoản khách hàng mẫu
-- Email: customer@example.com
-- Password: customer123
-- =========================================================
INSERT INTO users (
    role_id,
    full_name,
    email,
    phone,
    password_hash,
    avatar,
    gender,
    date_of_birth,
    status
)
VALUES (
    (SELECT id FROM roles WHERE code = 'customer'),
    'Nguyễn Văn Khách',
    'customer@example.com',
    '0901000001',
    '$2y$12$3YGd3a2eNP0TmApPznZAee.cNS9Qp6a4dso81btzNiA5g0aQL1WFK',
    NULL,
    'male',
    '2003-05-12',
    'active'
)
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id),
    full_name = VALUES(full_name),
    phone = VALUES(phone),
    password_hash = VALUES(password_hash),
    gender = VALUES(gender),
    date_of_birth = VALUES(date_of_birth),
    status = VALUES(status);


-- =========================================================
-- 2. Thêm tài khoản nhân viên mẫu
-- Email: staff@example.com
-- Password: staff123
-- =========================================================
INSERT INTO users (
    role_id,
    full_name,
    email,
    phone,
    password_hash,
    avatar,
    gender,
    date_of_birth,
    status
)
VALUES (
    (SELECT id FROM roles WHERE code = 'staff'),
    'Trần Thị Nhân Viên',
    'staff@example.com',
    '0901000002',
    '$2y$12$lml/2Sw8XPMsdPGUgjUoCuGItR2faSbYroCRZefKQ/Yiwlb.ZHJW2',
    NULL,
    'female',
    '2001-08-20',
    'active'
)
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id),
    full_name = VALUES(full_name),
    phone = VALUES(phone),
    password_hash = VALUES(password_hash),
    gender = VALUES(gender),
    date_of_birth = VALUES(date_of_birth),
    status = VALUES(status);


-- =========================================================
-- 3. Thêm tài khoản admin mẫu
-- Email: admin@example.com
-- Password: admin123
-- =========================================================
INSERT INTO users (
    role_id,
    full_name,
    email,
    phone,
    password_hash,
    avatar,
    gender,
    date_of_birth,
    status
)
VALUES (
    (SELECT id FROM roles WHERE code = 'admin'),
    'Lê Văn Admin',
    'admin@example.com',
    '0901000003',
    '$2y$12$GnY.eGk.fnEsTyxGef430.zRLRwhf9aWyau2iIW0UAGKqRdA6HqM2',
    NULL,
    'male',
    '1998-03-15',
    'active'
)
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id),
    full_name = VALUES(full_name),
    phone = VALUES(phone),
    password_hash = VALUES(password_hash),
    gender = VALUES(gender),
    date_of_birth = VALUES(date_of_birth),
    status = VALUES(status);


-- =========================================================
-- 4. Thêm tài khoản chủ cửa hàng mẫu
-- Email: owner@example.com
-- Password: owner123
-- =========================================================
INSERT INTO users (
    role_id,
    full_name,
    email,
    phone,
    password_hash,
    avatar,
    gender,
    date_of_birth,
    status
)
VALUES (
    (SELECT id FROM roles WHERE code = 'owner'),
    'Phạm Minh Chủ Shop',
    'owner@example.com',
    '0901000004',
    '$2y$12$YEndX0HWf9QRaKkGoZu2nefwHt1r3lEfbThl8y0aW7QXHMQQnFVKa',
    NULL,
    'male',
    '1995-11-25',
    'active'
)
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id),
    full_name = VALUES(full_name),
    phone = VALUES(phone),
    password_hash = VALUES(password_hash),
    gender = VALUES(gender),
    date_of_birth = VALUES(date_of_birth),
    status = VALUES(status);


-- =========================================================
-- 5. Thêm profile khách hàng mẫu
-- =========================================================
INSERT INTO customer_profiles (
    user_id,
    membership_level,
    points_balance,
    total_orders,
    total_spent,
    note
)
SELECT
    id,
    'silver',
    250,
    3,
    1250000,
    'Khách hàng mẫu dùng để test chức năng mua hàng'
FROM users
WHERE email = 'customer@example.com'
ON DUPLICATE KEY UPDATE
    membership_level = VALUES(membership_level),
    points_balance = VALUES(points_balance),
    total_orders = VALUES(total_orders),
    total_spent = VALUES(total_spent),
    note = VALUES(note);


-- =========================================================
-- 6. Thêm profile nhân viên mẫu
-- =========================================================
INSERT INTO staff_profiles (
    user_id,
    staff_code,
    position_name,
    department,
    start_date,
    end_date,
    work_status,
    note
)
SELECT
    id,
    'NV001',
    'Nhân viên xử lý đơn hàng',
    'Bán hàng',
    '2026-01-10',
    NULL,
    'working',
    'Nhân viên mẫu dùng để test trang quản lý nhân viên'
FROM users
WHERE email = 'staff@example.com'
ON DUPLICATE KEY UPDATE
    position_name = VALUES(position_name),
    department = VALUES(department),
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    work_status = VALUES(work_status),
    note = VALUES(note);


-- =========================================================
-- 7. Thêm profile admin mẫu
-- =========================================================
INSERT INTO staff_profiles (
    user_id,
    staff_code,
    position_name,
    department,
    start_date,
    end_date,
    work_status,
    note
)
SELECT
    id,
    'AD001',
    'Quản trị viên hệ thống',
    'Quản trị',
    '2026-01-01',
    NULL,
    'working',
    'Admin mẫu dùng để test quyền quản trị'
FROM users
WHERE email = 'admin@example.com'
ON DUPLICATE KEY UPDATE
    position_name = VALUES(position_name),
    department = VALUES(department),
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    work_status = VALUES(work_status),
    note = VALUES(note);


-- =========================================================
-- 8. Thêm profile chủ cửa hàng mẫu
-- =========================================================
INSERT INTO staff_profiles (
    user_id,
    staff_code,
    position_name,
    department,
    start_date,
    end_date,
    work_status,
    note
)
SELECT
    id,
    'OW001',
    'Chủ cửa hàng',
    'Điều hành',
    '2026-01-01',
    NULL,
    'working',
    'Chủ cửa hàng mẫu có toàn quyền quản lý'
FROM users
WHERE email = 'owner@example.com'
ON DUPLICATE KEY UPDATE
    position_name = VALUES(position_name),
    department = VALUES(department),
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    work_status = VALUES(work_status),
    note = VALUES(note);


-- =========================================================
-- 9. Thêm địa chỉ giao hàng mẫu cho khách hàng
-- =========================================================
INSERT INTO user_addresses (
    user_id,
    receiver_name,
    receiver_phone,
    province,
    district,
    ward,
    address_detail,
    is_default
)
SELECT
    id,
    'Nguyễn Văn Khách',
    '0901000001',
    'TP. Hồ Chí Minh',
    'Thành phố Thủ Đức',
    'Linh Xuân',
    '123 Đường Số 1',
    1
FROM users
WHERE email = 'customer@example.com';


-- =========================================================
-- 10. Thêm lịch sử hoạt động mẫu cho nhân viên
-- =========================================================
INSERT INTO staff_activity_logs (
    user_id,
    action_code,
    action_name,
    target_type,
    target_id,
    description,
    ip_address,
    user_agent
)
SELECT
    id,
    'order_update',
    'Cập nhật đơn hàng',
    'order',
    1,
    'Nhân viên cập nhật trạng thái đơn hàng mẫu sang đang giao hàng',
    '127.0.0.1',
    'Chrome Windows'
FROM users
WHERE email = 'staff@example.com';


-- =========================================================
-- 11. Thêm lịch sử hoạt động mẫu cho admin
-- =========================================================
INSERT INTO staff_activity_logs (
    user_id,
    action_code,
    action_name,
    target_type,
    target_id,
    description,
    ip_address,
    user_agent
)
SELECT
    id,
    'product_create',
    'Thêm sản phẩm',
    'product',
    1,
    'Admin thêm sản phẩm mẫu vào hệ thống',
    '127.0.0.1',
    'Chrome Windows'
FROM users
WHERE email = 'admin@example.com';


-- =========================================================
-- 12. Thêm lịch sử hoạt động mẫu cho chủ cửa hàng
-- =========================================================
INSERT INTO staff_activity_logs (
    user_id,
    action_code,
    action_name,
    target_type,
    target_id,
    description,
    ip_address,
    user_agent
)
SELECT
    id,
    'staff_create',
    'Thêm nhân viên',
    'staff',
    1,
    'Chủ cửa hàng tạo tài khoản nhân viên mẫu',
    '127.0.0.1',
    'Chrome Windows'
FROM users
WHERE email = 'owner@example.com';