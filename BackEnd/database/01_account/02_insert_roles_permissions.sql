USE clothing_store;

-- =========================================================
-- 1. Thêm dữ liệu cho bảng roles
-- =========================================================
INSERT INTO roles (name, code, description, status)
VALUES
('Khách hàng', 'customer', 'Tài khoản khách hàng mua hàng trên website', 'active'),
('Nhân viên', 'staff', 'Tài khoản nhân viên xử lý sản phẩm, đơn hàng, khách hàng', 'active'),
('Quản trị viên', 'admin', 'Tài khoản quản trị viên quản lý hệ thống', 'active'),
('Chủ cửa hàng', 'owner', 'Tài khoản chủ cửa hàng có toàn quyền quản lý', 'active')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    status = VALUES(status);


-- =========================================================
-- 2. Thêm dữ liệu cho bảng permissions
-- =========================================================

-- Nhóm dashboard
INSERT INTO permissions (name, code, description, module, status)
VALUES
('Xem dashboard', 'dashboard_view', 'Cho phép xem trang tổng quan quản trị', 'dashboard', 'active'),

-- Nhóm sản phẩm
('Xem sản phẩm', 'product_view', 'Cho phép xem danh sách và chi tiết sản phẩm', 'product', 'active'),
('Thêm sản phẩm', 'product_create', 'Cho phép thêm sản phẩm mới', 'product', 'active'),
('Cập nhật sản phẩm', 'product_update', 'Cho phép chỉnh sửa thông tin sản phẩm', 'product', 'active'),
('Xóa sản phẩm', 'product_delete', 'Cho phép xóa hoặc ẩn sản phẩm', 'product', 'active'),

-- Nhóm danh mục
('Xem danh mục', 'category_view', 'Cho phép xem danh sách danh mục sản phẩm', 'category', 'active'),
('Thêm danh mục', 'category_create', 'Cho phép thêm danh mục sản phẩm mới', 'category', 'active'),
('Cập nhật danh mục', 'category_update', 'Cho phép chỉnh sửa danh mục sản phẩm', 'category', 'active'),
('Xóa danh mục', 'category_delete', 'Cho phép xóa hoặc ẩn danh mục sản phẩm', 'category', 'active'),

-- Nhóm đơn hàng
('Xem đơn hàng', 'order_view', 'Cho phép xem danh sách và chi tiết đơn hàng', 'order', 'active'),
('Cập nhật đơn hàng', 'order_update', 'Cho phép cập nhật trạng thái đơn hàng', 'order', 'active'),
('Hủy đơn hàng', 'order_cancel', 'Cho phép hủy đơn hàng khi cần thiết', 'order', 'active'),

-- Nhóm khách hàng
('Xem khách hàng', 'customer_view', 'Cho phép xem danh sách và chi tiết khách hàng', 'customer', 'active'),
('Cập nhật khách hàng', 'customer_update', 'Cho phép chỉnh sửa thông tin khách hàng', 'customer', 'active'),
('Khóa khách hàng', 'customer_block', 'Cho phép khóa hoặc mở khóa tài khoản khách hàng', 'customer', 'active'),

-- Nhóm voucher
('Xem voucher', 'voucher_view', 'Cho phép xem danh sách voucher', 'voucher', 'active'),
('Thêm voucher', 'voucher_create', 'Cho phép tạo voucher mới', 'voucher', 'active'),
('Cập nhật voucher', 'voucher_update', 'Cho phép chỉnh sửa voucher', 'voucher', 'active'),
('Xóa voucher', 'voucher_delete', 'Cho phép xóa hoặc ẩn voucher', 'voucher', 'active'),

-- Nhóm điểm tích lũy
('Xem điểm tích lũy', 'point_view', 'Cho phép xem thông tin điểm tích lũy của khách hàng', 'point', 'active'),
('Cập nhật điểm tích lũy', 'point_update', 'Cho phép cộng hoặc trừ điểm tích lũy của khách hàng', 'point', 'active'),

-- Nhóm nhân viên
('Xem nhân viên', 'staff_view', 'Cho phép xem danh sách và chi tiết nhân viên', 'staff', 'active'),
('Thêm nhân viên', 'staff_create', 'Cho phép tạo tài khoản nhân viên mới', 'staff', 'active'),
('Cập nhật nhân viên', 'staff_update', 'Cho phép chỉnh sửa thông tin nhân viên', 'staff', 'active'),
('Xóa nhân viên', 'staff_delete', 'Cho phép xóa hoặc vô hiệu hóa tài khoản nhân viên', 'staff', 'active'),

-- Nhóm phân quyền
('Xem phân quyền', 'permission_view', 'Cho phép xem danh sách vai trò và quyền', 'permission', 'active'),
('Cập nhật phân quyền', 'permission_update', 'Cho phép chỉnh sửa quyền của từng vai trò', 'permission', 'active'),

-- Nhóm báo cáo
('Xem báo cáo', 'report_view', 'Cho phép xem báo cáo doanh thu, đơn hàng, sản phẩm', 'report', 'active'),

-- Nhóm lịch sử hoạt động
('Xem lịch sử hoạt động', 'activity_log_view', 'Cho phép xem lịch sử hoạt động của nhân viên', 'activity_log', 'active'),

-- Nhóm thiết lập
('Cập nhật thiết lập hệ thống', 'setting_update', 'Cho phép chỉnh sửa thiết lập chung của hệ thống', 'setting', 'active')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    module = VALUES(module),
    status = VALUES(status);


-- =========================================================
-- 3. Gán quyền cho vai trò staff
-- Nhân viên chỉ có các quyền thao tác cơ bản
-- =========================================================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.code = 'staff'
AND p.code IN (
    'dashboard_view',

    'product_view',

    'category_view',

    'order_view',
    'order_update',

    'customer_view',

    'voucher_view',

    'point_view',

    'activity_log_view'
);


-- =========================================================
-- 4. Gán quyền cho vai trò admin
-- Admin có hầu hết quyền quản lý hệ thống
-- =========================================================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.code = 'admin'
AND p.code IN (
    'dashboard_view',

    'product_view',
    'product_create',
    'product_update',
    'product_delete',

    'category_view',
    'category_create',
    'category_update',
    'category_delete',

    'order_view',
    'order_update',
    'order_cancel',

    'customer_view',
    'customer_update',
    'customer_block',

    'voucher_view',
    'voucher_create',
    'voucher_update',
    'voucher_delete',

    'point_view',
    'point_update',

    'staff_view',
    'staff_create',
    'staff_update',

    'permission_view',

    'report_view',

    'activity_log_view'
);


-- =========================================================
-- 5. Gán quyền cho vai trò owner
-- Chủ cửa hàng có toàn bộ quyền
-- =========================================================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.code = 'owner';


-- =========================================================
-- 6. Vai trò customer
-- Khách hàng không cần quyền admin nên chưa gán permissions
-- =========================================================