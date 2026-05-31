<?php
// =========================================================
// File: test-db.php
// Mục đích: Test kết nối database clothing_store
// =========================================================

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';


// 1. Kết nối database
$conn = getDatabaseConnection();


// 2. Test truy vấn bảng users
$sql = "
    SELECT 
        COUNT(*) AS total_users
    FROM users
";

$stmt = $conn->prepare($sql);
$stmt->execute();

$result = $stmt->fetch();


// 3. Trả kết quả test
sendSuccess('Ket noi database thanh cong', [
    'database' => DB_NAME,
    'total_users' => $result['total_users']
]);