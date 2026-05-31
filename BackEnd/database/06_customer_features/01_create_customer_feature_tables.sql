USE clothing_store;

-- =========================================================
-- File: 01_create_customer_feature_tables.sql
-- Mục đích: Tạo bảng tính năng khách hàng
-- Gồm: sản phẩm yêu thích, lịch sử điểm tích lũy
-- Yêu cầu: Chạy sau nhóm 01_account, 02_product, 04_order
-- =========================================================


-- =========================================================
-- 1. Bảng wishlists
-- Lưu sản phẩm yêu thích của khách hàng
-- =========================================================
CREATE TABLE IF NOT EXISTS wishlists (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    product_id INT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_wishlists_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_wishlists_products
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_wishlist_user_product
        UNIQUE (user_id, product_id)
) ENGINE=InnoDB;


-- =========================================================
-- 2. Bảng points_history
-- Lưu lịch sử cộng/trừ điểm tích lũy của khách hàng
-- =========================================================
CREATE TABLE IF NOT EXISTS points_history (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    order_id INT NULL,

    type ENUM('earn', 'use', 'refund', 'bonus') NOT NULL,

    points INT NOT NULL,

    description VARCHAR(255),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_points_history_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_points_history_orders
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;