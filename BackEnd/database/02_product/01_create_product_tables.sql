USE clothing_store;

-- =========================================================
-- File: 01_create_product_tables.sql
-- Mục đích: Tạo 8 bảng nhóm sản phẩm cho web bán hàng quần áo
-- Yêu cầu: Chạy sau nhóm 01_account vì có liên kết tới bảng users
-- =========================================================


-- =========================================================
-- 1. Bảng categories
-- Lưu danh mục sản phẩm
-- Ví dụ: Áo thun, Áo sơ mi, Quần dài, Váy, Phụ kiện
-- =========================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,

    parent_id INT NULL,
    thumbnail VARCHAR(255),

    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 2. Bảng products
-- Lưu thông tin chính của sản phẩm
-- =========================================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,

    category_id INT NOT NULL,

    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,

    short_description VARCHAR(255),
    description TEXT,

    base_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    old_price DECIMAL(15, 2) NULL,

    gender ENUM('male', 'female', 'unisex') DEFAULT 'unisex',
    material VARCHAR(150),
    brand VARCHAR(150),

    is_featured TINYINT(1) DEFAULT 0,
    is_new TINYINT(1) DEFAULT 0,
    is_sale TINYINT(1) DEFAULT 0,

    status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_categories
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 3. Bảng colors
-- Lưu danh sách màu sắc
-- Ví dụ: Đen, Trắng, Be, Nâu, Xanh navy
-- =========================================================
CREATE TABLE IF NOT EXISTS colors (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    hex_code VARCHAR(20),

    status ENUM('active', 'inactive') DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- =========================================================
-- 4. Bảng sizes
-- Lưu danh sách size sản phẩm
-- Ví dụ: S, M, L, XL, Free size
-- =========================================================
CREATE TABLE IF NOT EXISTS sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,

    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- =========================================================
-- 5. Bảng product_variants
-- Lưu biến thể sản phẩm theo màu + size
-- Đây là bảng quản lý SKU và tồn kho
-- =========================================================
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,

    product_id INT NOT NULL,
    color_id INT NOT NULL,
    size_id INT NOT NULL,

    sku VARCHAR(100) NOT NULL UNIQUE,

    price DECIMAL(15, 2) NULL,
    old_price DECIMAL(15, 2) NULL,

    stock_quantity INT NOT NULL DEFAULT 0,

    status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_variants_products
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_product_variants_colors
        FOREIGN KEY (color_id)
        REFERENCES colors(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_product_variants_sizes
        FOREIGN KEY (size_id)
        REFERENCES sizes(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uq_product_color_size
        UNIQUE (product_id, color_id, size_id)
) ENGINE=InnoDB;


-- =========================================================
-- 6. Bảng product_images
-- Lưu ảnh sản phẩm
-- Có thể lưu ảnh chung theo sản phẩm hoặc ảnh riêng theo biến thể
-- =========================================================
CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,

    product_id INT NOT NULL,
    variant_id INT NULL,

    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255),

    is_main TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_images_products
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_product_images_variants
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 7. Bảng product_reviews
-- Lưu đánh giá sản phẩm của khách hàng
-- order_id sẽ dùng sau khi tạo nhóm bảng đơn hàng
-- =========================================================
CREATE TABLE IF NOT EXISTS product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,

    product_id INT NOT NULL,
    user_id INT NULL,

    order_id INT NULL,

    rating TINYINT NOT NULL,
    content TEXT,

    status ENUM('pending', 'active', 'hidden') DEFAULT 'pending',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_reviews_products
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_product_reviews_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_product_reviews_rating
        CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB;


-- =========================================================
-- 8. Bảng product_stock_logs
-- Lưu lịch sử thay đổi tồn kho của từng biến thể sản phẩm
-- =========================================================
CREATE TABLE IF NOT EXISTS product_stock_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    variant_id INT NOT NULL,
    user_id INT NULL,

    change_type ENUM('import', 'sale', 'update', 'return', 'cancel') NOT NULL,

    quantity_change INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,

    note VARCHAR(255),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_stock_logs_variants
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_product_stock_logs_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;