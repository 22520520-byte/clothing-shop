USE clothing_store;

-- =========================================================
-- File: 02_insert_product_base_data.sql
-- Mục đích: Thêm dữ liệu nền cho nhóm sản phẩm
-- Gồm: categories, colors, sizes
-- =========================================================


-- =========================================================
-- 1. Thêm danh mục cha
-- =========================================================
INSERT INTO categories (
    name,
    slug,
    description,
    parent_id,
    thumbnail,
    sort_order,
    status
)
VALUES
('Áo', 'ao', 'Nhóm sản phẩm áo thời trang nam nữ', NULL, NULL, 1, 'active'),
('Quần', 'quan', 'Nhóm sản phẩm quần thời trang nam nữ', NULL, NULL, 2, 'active'),
('Váy', 'vay', 'Nhóm sản phẩm váy thời trang nữ', NULL, NULL, 3, 'active'),
('Phụ kiện', 'phu-kien', 'Nhóm sản phẩm phụ kiện thời trang', NULL, NULL, 4, 'active')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    parent_id = VALUES(parent_id),
    thumbnail = VALUES(thumbnail),
    sort_order = VALUES(sort_order),
    status = VALUES(status);


-- =========================================================
-- 2. Thêm danh mục con thuộc nhóm Áo
-- =========================================================
INSERT INTO categories (
    name,
    slug,
    description,
    parent_id,
    thumbnail,
    sort_order,
    status
)
VALUES
(
    'Áo thun',
    'ao-thun',
    'Danh mục áo thun nam nữ',
    (SELECT id FROM categories AS c WHERE c.slug = 'ao'),
    NULL,
    1,
    'active'
),
(
    'Áo sơ mi',
    'ao-so-mi',
    'Danh mục áo sơ mi nam nữ',
    (SELECT id FROM categories AS c WHERE c.slug = 'ao'),
    NULL,
    2,
    'active'
),
(
    'Áo polo',
    'ao-polo',
    'Danh mục áo polo nam nữ',
    (SELECT id FROM categories AS c WHERE c.slug = 'ao'),
    NULL,
    3,
    'active'
),
(
    'Áo tay ngắn',
    'ao-tay-ngan',
    'Danh mục áo tay ngắn',
    (SELECT id FROM categories AS c WHERE c.slug = 'ao'),
    NULL,
    4,
    'active'
),
(
    'Áo tay dài',
    'ao-tay-dai',
    'Danh mục áo tay dài',
    (SELECT id FROM categories AS c WHERE c.slug = 'ao'),
    NULL,
    5,
    'active'
),
(
    'Áo khoác',
    'ao-khoac',
    'Danh mục áo khoác',
    (SELECT id FROM categories AS c WHERE c.slug = 'ao'),
    NULL,
    6,
    'active'
),
(
    'Áo hoodie',
    'ao-hoodie',
    'Danh mục áo hoodie',
    (SELECT id FROM categories AS c WHERE c.slug = 'ao'),
    NULL,
    7,
    'active'
),
(
    'Áo sweater',
    'ao-sweater',
    'Danh mục áo sweater',
    (SELECT id FROM categories AS c WHERE c.slug = 'ao'),
    NULL,
    8,
    'active'
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    parent_id = VALUES(parent_id),
    thumbnail = VALUES(thumbnail),
    sort_order = VALUES(sort_order),
    status = VALUES(status);


-- =========================================================
-- 3. Thêm danh mục con thuộc nhóm Quần
-- =========================================================
INSERT INTO categories (
    name,
    slug,
    description,
    parent_id,
    thumbnail,
    sort_order,
    status
)
VALUES
(
    'Quần dài',
    'quan-dai',
    'Danh mục quần dài nam nữ',
    (SELECT id FROM categories AS c WHERE c.slug = 'quan'),
    NULL,
    1,
    'active'
),
(
    'Quần ngắn',
    'quan-ngan',
    'Danh mục quần ngắn nam nữ',
    (SELECT id FROM categories AS c WHERE c.slug = 'quan'),
    NULL,
    2,
    'active'
),
(
    'Quần lót',
    'quan-lot',
    'Danh mục quần lót',
    (SELECT id FROM categories AS c WHERE c.slug = 'quan'),
    NULL,
    3,
    'active'
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    parent_id = VALUES(parent_id),
    thumbnail = VALUES(thumbnail),
    sort_order = VALUES(sort_order),
    status = VALUES(status);


-- =========================================================
-- 4. Thêm danh mục con thuộc nhóm Váy
-- =========================================================
INSERT INTO categories (
    name,
    slug,
    description,
    parent_id,
    thumbnail,
    sort_order,
    status
)
VALUES
(
    'Váy dài',
    'vay-dai',
    'Danh mục váy dài thời trang nữ',
    (SELECT id FROM categories AS c WHERE c.slug = 'vay'),
    NULL,
    1,
    'active'
),
(
    'Váy ngắn',
    'vay-ngan',
    'Danh mục váy ngắn thời trang nữ',
    (SELECT id FROM categories AS c WHERE c.slug = 'vay'),
    NULL,
    2,
    'active'
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    parent_id = VALUES(parent_id),
    thumbnail = VALUES(thumbnail),
    sort_order = VALUES(sort_order),
    status = VALUES(status);


-- =========================================================
-- 5. Thêm danh mục con thuộc nhóm Phụ kiện
-- =========================================================
INSERT INTO categories (
    name,
    slug,
    description,
    parent_id,
    thumbnail,
    sort_order,
    status
)
VALUES
(
    'Mũ',
    'mu',
    'Danh mục mũ thời trang',
    (SELECT id FROM categories AS c WHERE c.slug = 'phu-kien'),
    NULL,
    1,
    'active'
),
(
    'Tất',
    'tat',
    'Danh mục tất thời trang',
    (SELECT id FROM categories AS c WHERE c.slug = 'phu-kien'),
    NULL,
    2,
    'active'
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    parent_id = VALUES(parent_id),
    thumbnail = VALUES(thumbnail),
    sort_order = VALUES(sort_order),
    status = VALUES(status);


-- =========================================================
-- 6. Thêm dữ liệu màu sắc
-- =========================================================
INSERT INTO colors (
    name,
    code,
    hex_code,
    status
)
VALUES
('Đen', 'black', '#000000', 'active'),
('Trắng', 'white', '#FFFFFF', 'active'),
('Xám', 'gray', '#808080', 'active'),
('Be', 'beige', '#F5F5DC', 'active'),
('Nâu', 'brown', '#8B4513', 'active'),
('Xanh navy', 'navy', '#000080', 'active'),
('Xanh dương', 'blue', '#1E90FF', 'active'),
('Xanh lá', 'green', '#228B22', 'active'),
('Đỏ', 'red', '#FF0000', 'active'),
('Hồng', 'pink', '#FFC0CB', 'active')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    hex_code = VALUES(hex_code),
    status = VALUES(status);


-- =========================================================
-- 7. Thêm dữ liệu size
-- =========================================================
INSERT INTO sizes (
    name,
    code,
    sort_order,
    status
)
VALUES
('XS', 'XS', 1, 'active'),
('S', 'S', 2, 'active'),
('M', 'M', 3, 'active'),
('L', 'L', 4, 'active'),
('XL', 'XL', 5, 'active'),
('XXL', 'XXL', 6, 'active'),
('Free size', 'FREE', 7, 'active')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    sort_order = VALUES(sort_order),
    status = VALUES(status);