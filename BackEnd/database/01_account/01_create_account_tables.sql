CREATE DATABASE IF NOT EXISTS clothing_store
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE clothing_store;

-- =========================================================
-- 1. Bảng roles
-- Lưu vai trò tài khoản: khách hàng, nhân viên, admin, chủ cửa hàng
-- =========================================================
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- =========================================================
-- 2. Bảng permissions
-- Lưu danh sách quyền thao tác trong hệ thống admin
-- =========================================================
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    module VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- =========================================================
-- 3. Bảng role_permissions
-- Gán quyền cho từng vai trò
-- =========================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (role_id, permission_id),

    CONSTRAINT fk_role_permissions_roles
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_role_permissions_permissions
        FOREIGN KEY (permission_id)
        REFERENCES permissions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 4. Bảng users
-- Lưu tài khoản đăng nhập chung cho khách hàng, nhân viên, admin
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,

    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    avatar VARCHAR(255),
    gender ENUM('male', 'female', 'other') DEFAULT 'other',
    date_of_birth DATE,

    status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
    last_login_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_roles
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 5. Bảng customer_profiles
-- Lưu thông tin riêng của khách hàng
-- =========================================================
CREATE TABLE IF NOT EXISTS customer_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,

    membership_level ENUM('normal', 'silver', 'gold', 'diamond') DEFAULT 'normal',
    points_balance INT DEFAULT 0,
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(15, 2) DEFAULT 0,

    note VARCHAR(255),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_profiles_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 6. Bảng staff_profiles
-- Lưu thông tin riêng của nhân viên/admin/chủ cửa hàng
-- =========================================================
CREATE TABLE IF NOT EXISTS staff_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,

    staff_code VARCHAR(50) NOT NULL UNIQUE,
    position_name VARCHAR(100),
    department VARCHAR(100),
    start_date DATE,
    end_date DATE,

    work_status ENUM('working', 'paused', 'resigned') DEFAULT 'working',
    note VARCHAR(255),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_staff_profiles_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 7. Bảng user_addresses
-- Lưu địa chỉ giao hàng của khách hàng
-- =========================================================
CREATE TABLE IF NOT EXISTS user_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    receiver_name VARCHAR(150) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,

    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    address_detail VARCHAR(255) NOT NULL,

    is_default TINYINT(1) DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_addresses_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 8. Bảng staff_activity_logs
-- Lưu lịch sử hoạt động của nhân viên/admin
-- =========================================================
CREATE TABLE IF NOT EXISTS staff_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,

    action_code VARCHAR(100) NOT NULL,
    action_name VARCHAR(150) NOT NULL,

    target_type VARCHAR(100),
    target_id INT,

    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_staff_activity_logs_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 9. Bảng password_resets
-- Lưu token đặt lại mật khẩu
-- =========================================================
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,
    email VARCHAR(150) NOT NULL,
    token_hash VARCHAR(191) NOT NULL UNIQUE,

    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_resets_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 10. Bảng user_sessions
-- Lưu phiên đăng nhập của người dùng
-- =========================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    session_token_hash VARCHAR(191) NOT NULL UNIQUE,

    ip_address VARCHAR(45),
    user_agent TEXT,
    device_name VARCHAR(150),

    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_sessions_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;