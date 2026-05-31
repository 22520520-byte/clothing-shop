USE clothing_store;

-- =========================================================
-- File: 01_create_cart_tables.sql
-- Mục đích: Tạo bảng giỏ hàng cho web bán hàng quần áo
-- Yêu cầu: Chạy sau nhóm 01_account và 02_product
-- Vì có liên kết tới users và product_variants
-- =========================================================


-- =========================================================
-- 1. Bảng carts
-- Lưu giỏ hàng của người dùng
-- =========================================================
CREATE TABLE IF NOT EXISTS carts (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    status ENUM('active', 'ordered', 'abandoned') DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_carts_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 2. Bảng cart_items
-- Lưu từng sản phẩm/biến thể trong giỏ hàng
-- =========================================================
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    cart_id INT NOT NULL,
    variant_id INT NOT NULL,

    quantity INT NOT NULL DEFAULT 1,
    price_at_time DECIMAL(15, 2) NOT NULL DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_cart_items_carts
        FOREIGN KEY (cart_id)
        REFERENCES carts(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_cart_items_product_variants
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uq_cart_variant
        UNIQUE (cart_id, variant_id),

    CONSTRAINT chk_cart_items_quantity
        CHECK (quantity > 0)
) ENGINE=InnoDB;