USE clothing_store;

-- =========================================================
-- File: 01_create_promotion_tables.sql
-- Mục đích: Tạo bảng khuyến mãi, voucher, flash sale
-- Yêu cầu: Chạy sau nhóm 01_account, 02_product, 04_order
-- Vì có liên kết tới users, orders, products, product_variants
-- =========================================================


-- =========================================================
-- 1. Bảng vouchers
-- Lưu mã giảm giá
-- Ví dụ: GIAM50K, FREESHIP, WELCOME10
-- =========================================================
CREATE TABLE IF NOT EXISTS vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,

    discount_type ENUM('fixed', 'percent', 'freeship') NOT NULL,

    discount_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    min_order_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    max_discount_amount DECIMAL(15, 2) NULL,

    quantity INT NOT NULL DEFAULT 0,
    used_quantity INT NOT NULL DEFAULT 0,
    usage_limit_per_user INT NOT NULL DEFAULT 1,

    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,

    status ENUM('active', 'inactive', 'expired') DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_vouchers_discount_value
        CHECK (discount_value >= 0),

    CONSTRAINT chk_vouchers_min_order_value
        CHECK (min_order_value >= 0),

    CONSTRAINT chk_vouchers_max_discount_amount
        CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),

    CONSTRAINT chk_vouchers_quantity
        CHECK (quantity >= 0),

    CONSTRAINT chk_vouchers_used_quantity
        CHECK (used_quantity >= 0),

    CONSTRAINT chk_vouchers_usage_limit_per_user
        CHECK (usage_limit_per_user > 0),

    CONSTRAINT chk_vouchers_date
        CHECK (end_date > start_date)
) ENGINE=InnoDB;


-- =========================================================
-- 2. Bảng voucher_usages
-- Lưu lịch sử sử dụng voucher
-- =========================================================
CREATE TABLE IF NOT EXISTS voucher_usages (
    id INT AUTO_INCREMENT PRIMARY KEY,

    voucher_id INT NOT NULL,
    user_id INT NULL,
    order_id INT NOT NULL,

    discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,

    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_voucher_usages_vouchers
        FOREIGN KEY (voucher_id)
        REFERENCES vouchers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_voucher_usages_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_voucher_usages_orders
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_voucher_order
        UNIQUE (voucher_id, order_id),

    CONSTRAINT chk_voucher_usages_discount_amount
        CHECK (discount_amount >= 0)
) ENGINE=InnoDB;


-- =========================================================
-- 3. Bảng promotion_campaigns
-- Lưu chương trình khuyến mãi / flash sale
-- Ví dụ: Flash Sale Cuối Tuần, Sale 6.6, Big Voucher
-- =========================================================
CREATE TABLE IF NOT EXISTS promotion_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,

    banner_image VARCHAR(255),

    campaign_type ENUM(
        'flash_sale',
        'big_voucher',
        'seasonal_sale',
        'normal'
    ) DEFAULT 'normal',

    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,

    status ENUM('active', 'inactive', 'ended') DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_promotion_campaigns_date
        CHECK (end_date > start_date)
) ENGINE=InnoDB;


-- =========================================================
-- 4. Bảng promotion_products
-- Lưu sản phẩm tham gia chương trình khuyến mãi
-- Có thể áp dụng cho toàn bộ sản phẩm hoặc một biến thể cụ thể
-- =========================================================
CREATE TABLE IF NOT EXISTS promotion_products (
    id INT AUTO_INCREMENT PRIMARY KEY,

    campaign_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,

    sale_price DECIMAL(15, 2) NULL,
    discount_percent DECIMAL(5, 2) NULL,

    sale_stock_limit INT NULL,
    sold_quantity INT NOT NULL DEFAULT 0,

    status ENUM('active', 'inactive', 'sold_out') DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_promotion_products_campaigns
        FOREIGN KEY (campaign_id)
        REFERENCES promotion_campaigns(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_promotion_products_products
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_promotion_products_variants
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT uq_campaign_product_variant
        UNIQUE (campaign_id, product_id, variant_id),

    CONSTRAINT chk_promotion_products_sale_price
        CHECK (sale_price IS NULL OR sale_price >= 0),

    CONSTRAINT chk_promotion_products_discount_percent
        CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100)),

    CONSTRAINT chk_promotion_products_sale_stock_limit
        CHECK (sale_stock_limit IS NULL OR sale_stock_limit >= 0),

    CONSTRAINT chk_promotion_products_sold_quantity
        CHECK (sold_quantity >= 0)
) ENGINE=InnoDB;