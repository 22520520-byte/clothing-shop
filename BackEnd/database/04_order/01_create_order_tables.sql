USE clothing_store;

-- =========================================================
-- File: 01_create_order_tables.sql
-- Mục đích: Tạo bảng đơn hàng cho web bán hàng quần áo
-- Yêu cầu: Chạy sau nhóm 01_account và 02_product
-- Vì có liên kết tới users và product_variants
-- =========================================================


-- =========================================================
-- 1. Bảng orders
-- Lưu thông tin tổng của đơn hàng
-- user_id cho phép NULL để hỗ trợ khách vãng lai
-- =========================================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,

    order_code VARCHAR(50) NOT NULL UNIQUE,

    receiver_name VARCHAR(150) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    shipping_address VARCHAR(255) NOT NULL,

    note TEXT,

    total_product_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    shipping_fee DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    points_discount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    final_total DECIMAL(15, 2) NOT NULL DEFAULT 0,

    payment_method ENUM('cod', 'bank_transfer', 'momo', 'vnpay') DEFAULT 'cod',

    order_status ENUM(
        'pending',
        'confirmed',
        'shipping',
        'completed',
        'cancelled'
    ) DEFAULT 'pending',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_orders_total_product_price
        CHECK (total_product_price >= 0),

    CONSTRAINT chk_orders_shipping_fee
        CHECK (shipping_fee >= 0),

    CONSTRAINT chk_orders_discount_amount
        CHECK (discount_amount >= 0),

    CONSTRAINT chk_orders_points_discount
        CHECK (points_discount >= 0),

    CONSTRAINT chk_orders_final_total
        CHECK (final_total >= 0)
) ENGINE=InnoDB;


-- =========================================================
-- 2. Bảng order_items
-- Lưu từng sản phẩm trong đơn hàng
-- Lưu lại tên, màu, size, giá tại thời điểm mua
-- =========================================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    order_id INT NOT NULL,
    variant_id INT NULL,

    product_name VARCHAR(200) NOT NULL,
    color_name VARCHAR(100),
    size_name VARCHAR(50),
    product_image VARCHAR(255),
    sku VARCHAR(100),

    price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(15, 2) NOT NULL DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_orders
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_order_items_product_variants
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_order_items_price
        CHECK (price >= 0),

    CONSTRAINT chk_order_items_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_order_items_total_price
        CHECK (total_price >= 0)
) ENGINE=InnoDB;


-- =========================================================
-- 3. Bảng payments
-- Lưu thông tin thanh toán của đơn hàng
-- =========================================================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    order_id INT NOT NULL,

    payment_method ENUM('cod', 'bank_transfer', 'momo', 'vnpay') DEFAULT 'cod',

    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,

    payment_status ENUM(
        'unpaid',
        'paid',
        'failed',
        'refunded'
    ) DEFAULT 'unpaid',

    transaction_code VARCHAR(100),

    paid_at DATETIME NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_orders
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_payments_amount
        CHECK (amount >= 0)
) ENGINE=InnoDB;