USE clothing_store;

-- =========================================================
-- File: 03_insert_sample_products.sql
-- Mục đích: Thêm sản phẩm mẫu, biến thể, ảnh, đánh giá, lịch sử tồn kho
-- Yêu cầu: Chạy sau file 02_insert_product_base_data.sql
-- =========================================================


-- =========================================================
-- 1. Thêm sản phẩm mẫu
-- =========================================================
INSERT INTO products (
    category_id,
    name,
    slug,
    short_description,
    description,
    base_price,
    old_price,
    gender,
    material,
    brand,
    is_featured,
    is_new,
    is_sale,
    status
)
VALUES
(
    (SELECT id FROM categories WHERE slug = 'ao-thun'),
    'Áo thun basic nam',
    'ao-thun-basic-nam',
    'Áo thun basic dễ mặc, phù hợp đi học, đi chơi hằng ngày.',
    'Áo thun basic nam chất cotton mềm, form regular, dễ phối với quần jean, quần kaki hoặc quần short.',
    199000,
    249000,
    'male',
    'Cotton',
    'Local Brand',
    1,
    1,
    1,
    'active'
),
(
    (SELECT id FROM categories WHERE slug = 'ao-so-mi'),
    'Áo sơ mi trắng nữ',
    'ao-so-mi-trang-nu',
    'Áo sơ mi trắng nữ thanh lịch, phù hợp đi học, đi làm.',
    'Áo sơ mi trắng nữ chất vải kate mềm, form vừa người, dễ phối với chân váy hoặc quần tây.',
    299000,
    359000,
    'female',
    'Kate',
    'Local Brand',
    1,
    1,
    1,
    'active'
),
(
    (SELECT id FROM categories WHERE slug = 'ao-polo'),
    'Áo polo nam cổ basic',
    'ao-polo-nam-co-basic',
    'Áo polo nam cổ basic lịch sự, dễ phối đồ.',
    'Áo polo nam chất cá sấu cotton, form đứng dáng, phù hợp đi chơi, đi làm hoặc gặp gỡ bạn bè.',
    259000,
    319000,
    'male',
    'Cotton cá sấu',
    'Local Brand',
    1,
    0,
    1,
    'active'
),
(
    (SELECT id FROM categories WHERE slug = 'ao-khoac'),
    'Áo khoác kaki unisex',
    'ao-khoac-kaki-unisex',
    'Áo khoác kaki unisex phong cách trẻ trung.',
    'Áo khoác kaki unisex chất vải dày vừa, có túi tiện dụng, phù hợp mặc ngoài khi đi học, đi chơi.',
    399000,
    459000,
    'unisex',
    'Kaki',
    'Local Brand',
    1,
    1,
    1,
    'active'
),
(
    (SELECT id FROM categories WHERE slug = 'quan-dai'),
    'Quần jean ống rộng nữ',
    'quan-jean-ong-rong-nu',
    'Quần jean ống rộng nữ cá tính, dễ phối áo thun hoặc croptop.',
    'Quần jean ống rộng nữ chất denim bền, form thoải mái, phù hợp phong cách năng động.',
    359000,
    429000,
    'female',
    'Denim',
    'Local Brand',
    1,
    0,
    1,
    'active'
),
(
    (SELECT id FROM categories WHERE slug = 'quan-ngan'),
    'Quần short kaki nam',
    'quan-short-kaki-nam',
    'Quần short kaki nam đơn giản, thoải mái.',
    'Quần short kaki nam chất vải mềm, có túi, phù hợp mặc hằng ngày hoặc đi du lịch.',
    229000,
    279000,
    'male',
    'Kaki',
    'Local Brand',
    0,
    1,
    1,
    'active'
),
(
    (SELECT id FROM categories WHERE slug = 'vay-ngan'),
    'Váy ngắn xếp ly nữ',
    'vay-ngan-xep-ly-nu',
    'Váy ngắn xếp ly nữ trẻ trung, dễ phối đồ.',
    'Váy ngắn xếp ly nữ chất vải mềm, form đẹp, phù hợp đi chơi, đi học hoặc chụp ảnh.',
    269000,
    329000,
    'female',
    'Polyester',
    'Local Brand',
    1,
    1,
    1,
    'active'
),
(
    (SELECT id FROM categories WHERE slug = 'mu'),
    'Mũ lưỡi trai basic',
    'mu-luoi-trai-basic',
    'Mũ lưỡi trai basic unisex, phù hợp nhiều phong cách.',
    'Mũ lưỡi trai basic chất vải cotton, có khóa chỉnh size phía sau, phù hợp nam nữ.',
    99000,
    129000,
    'unisex',
    'Cotton',
    'Local Brand',
    0,
    1,
    1,
    'active'
)
ON DUPLICATE KEY UPDATE
    category_id = VALUES(category_id),
    name = VALUES(name),
    short_description = VALUES(short_description),
    description = VALUES(description),
    base_price = VALUES(base_price),
    old_price = VALUES(old_price),
    gender = VALUES(gender),
    material = VALUES(material),
    brand = VALUES(brand),
    is_featured = VALUES(is_featured),
    is_new = VALUES(is_new),
    is_sale = VALUES(is_sale),
    status = VALUES(status);


-- =========================================================
-- 2. Thêm biến thể sản phẩm
-- =========================================================

-- Áo thun basic nam
INSERT INTO product_variants (
    product_id,
    color_id,
    size_id,
    sku,
    price,
    old_price,
    stock_quantity,
    status
)
VALUES
(
    (SELECT id FROM products WHERE slug = 'ao-thun-basic-nam'),
    (SELECT id FROM colors WHERE code = 'black'),
    (SELECT id FROM sizes WHERE code = 'M'),
    'ATB-NAM-BLACK-M',
    199000,
    249000,
    30,
    'active'
),
(
    (SELECT id FROM products WHERE slug = 'ao-thun-basic-nam'),
    (SELECT id FROM colors WHERE code = 'black'),
    (SELECT id FROM sizes WHERE code = 'L'),
    'ATB-NAM-BLACK-L',
    199000,
    249000,
    25,
    'active'
),
(
    (SELECT id FROM products WHERE slug = 'ao-thun-basic-nam'),
    (SELECT id FROM colors WHERE code = 'white'),
    (SELECT id FROM sizes WHERE code = 'M'),
    'ATB-NAM-WHITE-M',
    199000,
    249000,
    28,
    'active'
),
(
    (SELECT id FROM products WHERE slug = 'ao-thun-basic-nam'),
    (SELECT id FROM colors WHERE code = 'white'),
    (SELECT id FROM sizes WHERE code = 'L'),
    'ATB-NAM-WHITE-L',
    199000,
    249000,
    20,
    'active'
),

-- Áo sơ mi trắng nữ
(
    (SELECT id FROM products WHERE slug = 'ao-so-mi-trang-nu'),
    (SELECT id FROM colors WHERE code = 'white'),
    (SELECT id FROM sizes WHERE code = 'S'),
    'ASM-TRANG-NU-S',
    299000,
    359000,
    18,
    'active'
),
(
    (SELECT id FROM products WHERE slug = 'ao-so-mi-trang-nu'),
    (SELECT id FROM colors WHERE code = 'white'),
    (SELECT id FROM sizes WHERE code = 'M'),
    'ASM-TRANG-NU-M',
    299000,
    359000,
    22,
    'active'
),

-- Áo polo nam
(
    (SELECT id FROM products WHERE slug = 'ao-polo-nam-co-basic'),
    (SELECT id FROM colors WHERE code = 'navy'),
    (SELECT id FROM sizes WHERE code = 'M'),
    'APOLO-NAVY-M',
    259000,
    319000,
    20,
    'active'
),
(
    (SELECT id FROM products WHERE slug = 'ao-polo-nam-co-basic'),
    (SELECT id FROM colors WHERE code = 'navy'),
    (SELECT id FROM sizes WHERE code = 'L'),
    'APOLO-NAVY-L',
    259000,
    319000,
    16,
    'active'
),

-- Áo khoác kaki unisex
(
    (SELECT id FROM products WHERE slug = 'ao-khoac-kaki-unisex'),
    (SELECT id FROM colors WHERE code = 'beige'),
    (SELECT id FROM sizes WHERE code = 'M'),
    'AKK-BEIGE-M',
    399000,
    459000,
    15,
    'active'
),
(
    (SELECT id FROM products WHERE slug = 'ao-khoac-kaki-unisex'),
    (SELECT id FROM colors WHERE code = 'beige'),
    (SELECT id FROM sizes WHERE code = 'L'),
    'AKK-BEIGE-L',
    399000,
    459000,
    12,
    'active'
),

-- Quần jean ống rộng nữ
(
    (SELECT id FROM products WHERE slug = 'quan-jean-ong-rong-nu'),
    (SELECT id FROM colors WHERE code = 'blue'),
    (SELECT id FROM sizes WHERE code = 'M'),
    'QJ-ONGRONG-BLUE-M',
    359000,
    429000,
    14,
    'active'
),
(
    (SELECT id FROM products WHERE slug = 'quan-jean-ong-rong-nu'),
    (SELECT id FROM colors WHERE code = 'blue'),
    (SELECT id FROM sizes WHERE code = 'L'),
    'QJ-ONGRONG-BLUE-L',
    359000,
    429000,
    10,
    'active'
),

-- Quần short kaki nam
(
    (SELECT id FROM products WHERE slug = 'quan-short-kaki-nam'),
    (SELECT id FROM colors WHERE code = 'brown'),
    (SELECT id FROM sizes WHERE code = 'M'),
    'QSHORT-BROWN-M',
    229000,
    279000,
    18,
    'active'
),
(
    (SELECT id FROM products WHERE slug = 'quan-short-kaki-nam'),
    (SELECT id FROM colors WHERE code = 'brown'),
    (SELECT id FROM sizes WHERE code = 'L'),
    'QSHORT-BROWN-L',
    229000,
    279000,
    13,
    'active'
),

-- Váy ngắn xếp ly nữ
(
    (SELECT id FROM products WHERE slug = 'vay-ngan-xep-ly-nu'),
    (SELECT id FROM colors WHERE code = 'pink'),
    (SELECT id FROM sizes WHERE code = 'S'),
    'VAY-XEPLY-PINK-S',
    269000,
    329000,
    15,
    'active'
),
(
    (SELECT id FROM products WHERE slug = 'vay-ngan-xep-ly-nu'),
    (SELECT id FROM colors WHERE code = 'pink'),
    (SELECT id FROM sizes WHERE code = 'M'),
    'VAY-XEPLY-PINK-M',
    269000,
    329000,
    11,
    'active'
),

-- Mũ lưỡi trai basic
(
    (SELECT id FROM products WHERE slug = 'mu-luoi-trai-basic'),
    (SELECT id FROM colors WHERE code = 'black'),
    (SELECT id FROM sizes WHERE code = 'FREE'),
    'MU-BASIC-BLACK-FREE',
    99000,
    129000,
    35,
    'active'
),
(
    (SELECT id FROM products WHERE slug = 'mu-luoi-trai-basic'),
    (SELECT id FROM colors WHERE code = 'white'),
    (SELECT id FROM sizes WHERE code = 'FREE'),
    'MU-BASIC-WHITE-FREE',
    99000,
    129000,
    30,
    'active'
)
ON DUPLICATE KEY UPDATE
    product_id = VALUES(product_id),
    color_id = VALUES(color_id),
    size_id = VALUES(size_id),
    price = VALUES(price),
    old_price = VALUES(old_price),
    stock_quantity = VALUES(stock_quantity),
    status = VALUES(status);


-- =========================================================
-- 3. Thêm ảnh sản phẩm mẫu
-- Lưu ý: image_url có thể đổi lại theo folder ảnh thật của project
-- =========================================================

INSERT INTO product_images (
    product_id,
    variant_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)
SELECT
    p.id,
    NULL,
    '../images/products/ao-thun-basic-nam-1.jpg',
    'Áo thun basic nam ảnh chính',
    1,
    1
FROM products p
WHERE p.slug = 'ao-thun-basic-nam'
AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
    AND pi.image_url = '../images/products/ao-thun-basic-nam-1.jpg'
);

INSERT INTO product_images (
    product_id,
    variant_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)
SELECT
    p.id,
    NULL,
    '../images/products/ao-thun-basic-nam-2.jpg',
    'Áo thun basic nam ảnh phụ',
    0,
    2
FROM products p
WHERE p.slug = 'ao-thun-basic-nam'
AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
    AND pi.image_url = '../images/products/ao-thun-basic-nam-2.jpg'
);


INSERT INTO product_images (
    product_id,
    variant_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)
SELECT
    p.id,
    NULL,
    '../images/products/ao-so-mi-trang-nu-1.jpg',
    'Áo sơ mi trắng nữ ảnh chính',
    1,
    1
FROM products p
WHERE p.slug = 'ao-so-mi-trang-nu'
AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
    AND pi.image_url = '../images/products/ao-so-mi-trang-nu-1.jpg'
);


INSERT INTO product_images (
    product_id,
    variant_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)
SELECT
    p.id,
    NULL,
    '../images/products/ao-polo-nam-co-basic-1.jpg',
    'Áo polo nam cổ basic ảnh chính',
    1,
    1
FROM products p
WHERE p.slug = 'ao-polo-nam-co-basic'
AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
    AND pi.image_url = '../images/products/ao-polo-nam-co-basic-1.jpg'
);


INSERT INTO product_images (
    product_id,
    variant_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)
SELECT
    p.id,
    NULL,
    '../images/products/ao-khoac-kaki-unisex-1.jpg',
    'Áo khoác kaki unisex ảnh chính',
    1,
    1
FROM products p
WHERE p.slug = 'ao-khoac-kaki-unisex'
AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
    AND pi.image_url = '../images/products/ao-khoac-kaki-unisex-1.jpg'
);


INSERT INTO product_images (
    product_id,
    variant_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)
SELECT
    p.id,
    NULL,
    '../images/products/quan-jean-ong-rong-nu-1.jpg',
    'Quần jean ống rộng nữ ảnh chính',
    1,
    1
FROM products p
WHERE p.slug = 'quan-jean-ong-rong-nu'
AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
    AND pi.image_url = '../images/products/quan-jean-ong-rong-nu-1.jpg'
);


INSERT INTO product_images (
    product_id,
    variant_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)
SELECT
    p.id,
    NULL,
    '../images/products/quan-short-kaki-nam-1.jpg',
    'Quần short kaki nam ảnh chính',
    1,
    1
FROM products p
WHERE p.slug = 'quan-short-kaki-nam'
AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
    AND pi.image_url = '../images/products/quan-short-kaki-nam-1.jpg'
);


INSERT INTO product_images (
    product_id,
    variant_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)
SELECT
    p.id,
    NULL,
    '../images/products/vay-ngan-xep-ly-nu-1.jpg',
    'Váy ngắn xếp ly nữ ảnh chính',
    1,
    1
FROM products p
WHERE p.slug = 'vay-ngan-xep-ly-nu'
AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
    AND pi.image_url = '../images/products/vay-ngan-xep-ly-nu-1.jpg'
);


INSERT INTO product_images (
    product_id,
    variant_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)
SELECT
    p.id,
    NULL,
    '../images/products/mu-luoi-trai-basic-1.jpg',
    'Mũ lưỡi trai basic ảnh chính',
    1,
    1
FROM products p
WHERE p.slug = 'mu-luoi-trai-basic'
AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id
    AND pi.image_url = '../images/products/mu-luoi-trai-basic-1.jpg'
);


-- =========================================================
-- 4. Thêm đánh giá sản phẩm mẫu
-- =========================================================
INSERT INTO product_reviews (
    product_id,
    user_id,
    order_id,
    rating,
    content,
    status
)
SELECT
    p.id,
    u.id,
    NULL,
    5,
    'Sản phẩm đẹp, chất vải ổn, mặc vừa size.',
    'active'
FROM products p
JOIN users u
WHERE p.slug = 'ao-thun-basic-nam'
AND u.email = 'customer@example.com'
AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
    AND pr.user_id = u.id
    AND pr.content = 'Sản phẩm đẹp, chất vải ổn, mặc vừa size.'
);


INSERT INTO product_reviews (
    product_id,
    user_id,
    order_id,
    rating,
    content,
    status
)
SELECT
    p.id,
    u.id,
    NULL,
    4,
    'Form đẹp, giao hàng nhanh, màu giống hình.',
    'active'
FROM products p
JOIN users u
WHERE p.slug = 'ao-so-mi-trang-nu'
AND u.email = 'customer@example.com'
AND NOT EXISTS (
    SELECT 1 FROM product_reviews pr
    WHERE pr.product_id = p.id
    AND pr.user_id = u.id
    AND pr.content = 'Form đẹp, giao hàng nhanh, màu giống hình.'
);


-- =========================================================
-- 5. Thêm lịch sử tồn kho mẫu
-- =========================================================
INSERT INTO product_stock_logs (
    variant_id,
    user_id,
    change_type,
    quantity_change,
    quantity_before,
    quantity_after,
    note
)
SELECT
    pv.id,
    u.id,
    'import',
    pv.stock_quantity,
    0,
    pv.stock_quantity,
    CONCAT('Nhập kho ban đầu cho SKU ', pv.sku)
FROM product_variants pv
LEFT JOIN users u
    ON u.email = 'admin@example.com'
WHERE NOT EXISTS (
    SELECT 1 FROM product_stock_logs psl
    WHERE psl.variant_id = pv.id
    AND psl.change_type = 'import'
    AND psl.note = CONCAT('Nhập kho ban đầu cho SKU ', pv.sku)
);