<?php
// =========================================================
// File: config/db.php
// Mục đích: Kết nối PHP với database MySQL/MariaDB
// Database: clothing_store
// =========================================================


// 1. Cấu hình database
define('DB_HOST', 'localhost');
define('DB_NAME', 'clothing_store');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');


// 2. Hàm kết nối database bằng PDO
function getDatabaseConnection()
{
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ];

    try {
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        http_response_code(500);

        echo json_encode([
            'success' => false,
            'message' => 'Khong the ket noi database',
            'error' => $e->getMessage()
        ]);

        exit;
    }
}