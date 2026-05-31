<?php
// =========================================================
// File: api/auth/logout.php
// Mục đích: API đăng xuất tài khoản
// Method: POST
// =========================================================

session_start();

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/response.php';


// 1. Cho phép gọi API từ frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}


// 2. Chỉ cho phép POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Phuong thuc khong hop le', 405);
}


// 3. Kiểm tra session hiện tại
$userId = $_SESSION['user_id'] ?? null;
$currentSessionId = session_id();


// 4. Nếu có session thì cập nhật revoked_at trong user_sessions
if (!empty($userId) && !empty($currentSessionId)) {
    $conn = getDatabaseConnection();

    try {
        $sessionTokenHash = hash('sha256', $currentSessionId);

        $sql = "
            UPDATE user_sessions
            SET 
                revoked_at = NOW(),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = :user_id
            AND session_token_hash = :session_token_hash
            AND revoked_at IS NULL
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':session_token_hash' => $sessionTokenHash
        ]);

    } catch (PDOException $e) {
        sendError('Dang xuat that bai', 500, [
            'database' => $e->getMessage()
        ]);
    }
}


// 5. Xóa toàn bộ session
$_SESSION = [];


// 6. Xóa cookie session nếu có
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();

    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}


// 7. Hủy session
session_destroy();


// 8. Trả kết quả
sendSuccess('Dang xuat thanh cong');