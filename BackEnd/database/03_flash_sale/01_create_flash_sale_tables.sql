-- =========================================================
-- File: BackEnd/database/03_flash_sale/01_create_flash_sale_tables.sql
-- Muc dich: Tao bang quan ly Flash Sale
-- =========================================================

CREATE TABLE IF NOT EXISTS flash_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    description TEXT NULL,

    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,

    status ENUM('draft', 'active', 'inactive', 'ended') NOT NULL DEFAULT 'draft',

    banner_image VARCHAR(500) NULL,

    created_by INT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_flash_sales_status (status),
    INDEX idx_flash_sales_time (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS flash_sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    flash_sale_id INT NOT NULL,

    product_id INT NOT NULL,
    variant_id INT NULL,

    original_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(12, 2) NOT NULL DEFAULT 0,

    quantity_limit INT NOT NULL DEFAULT 0,
    sold_quantity INT NOT NULL DEFAULT 0,

    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_flash_sale_items_flash_sale
        FOREIGN KEY (flash_sale_id)
        REFERENCES flash_sales(id)
        ON DELETE CASCADE,

    INDEX idx_flash_sale_items_flash_sale_id (flash_sale_id),
    INDEX idx_flash_sale_items_product_id (product_id),
    INDEX idx_flash_sale_items_variant_id (variant_id),
    INDEX idx_flash_sale_items_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;