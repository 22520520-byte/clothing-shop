<?php
// =========================================================
// File: api/admin/products/update-product-status.php
// Mục đích: API admin cập nhật trạng thái sản phẩm
// Method: POST
// =========================================================

session_start();

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../helpers/response.php';


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


// 3. Kiểm tra đăng nhập
if (empty($_SESSION['user_id'])) {
    sendError('Vui long dang nhap de cap nhat trang thai san pham', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Lấy dữ liệu request
$productId = isset($input['product_id']) ? (int) $input['product_id'] : 0;
$status = trim($input['status'] ?? '');


// 6. Validate dữ liệu
$errors = [];

if ($productId <= 0) {
    $errors['product_id'] = 'Vui long truyen ma san pham';
}

$allowedStatuses = ['active', 'inactive'];

if (!in_array($status, $allowedStatuses)) {
    $errors['status'] = 'Trang thai san pham khong hop le';
}

if (!empty($errors)) {
    sendError('Du lieu khong hop le', 422, $errors);
}


// 7. Kết nối database
$conn = getDatabaseConnection();

try {
    // 8. Kiểm tra quyền admin/staff
    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.status,
            r.code AS role_code,
            r.name AS role_name
        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        WHERE u.id = :user_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId
    ]);

    $user = $stmt->fetch();

    if (!$user) {
        sendError('Khong tim thay nguoi dung', 404);
    }

    if ($user['status'] !== 'active') {
        sendError('Tai khoan dang bi khoa hoac khong hoat dong', 403);
    }

    $allowedRoles = ['owner', 'admin', 'staff'];

    if (!in_array($user['role_code'], $allowedRoles)) {
        sendError('Ban khong co quyen cap nhat trang thai san pham', 403);
    }


    // 9. Kiểm tra sản phẩm tồn tại
    $sql = "
        SELECT
            id,
            name,
            slug,
            status
        FROM products
        WHERE id = :product_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':product_id' => $productId
    ]);

    $product = $stmt->fetch();

    if (!$product) {
        sendError('Khong tim thay san pham', 404);
    }

    $oldStatus = $product['status'];


    // 10. Nếu trạng thái không đổi
    if ($oldStatus === $status) {
        sendSuccess('Trang thai san pham khong thay doi', [
            'product' => [
                'id' => (int) $product['id'],
                'name' => $product['name'],
                'slug' => $product['slug'],
                'old_status' => $oldStatus,
                'new_status' => $status
            ]
        ]);
    }


    // 11. Bắt đầu transaction
    $conn->beginTransaction();


    // 12. Cập nhật trạng thái sản phẩm
    $sql = "
        UPDATE products
        SET
            status = :status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :product_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':status' => $status,
        ':product_id' => $productId
    ]);


    // 13. Nếu ẩn sản phẩm thì ẩn luôn biến thể để tránh bán nhầm
    if ($status === 'inactive') {
        $sql = "
            UPDATE product_variants
            SET
                status = 'inactive',
                updated_at = CURRENT_TIMESTAMP
            WHERE product_id = :product_id_variants
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':product_id_variants' => $productId
        ]);
    }


    // 14. Đếm lại biến thể của sản phẩm
    $sql = "
        SELECT
            COUNT(*) AS total_variants,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_variants,
            COALESCE(SUM(stock_quantity), 0) AS total_stock
        FROM product_variants
        WHERE product_id = :product_id_summary
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':product_id_summary' => $productId
    ]);

    $variantSummary = $stmt->fetch();


    // 15. Ghi log hoạt động nhân viên nếu có bảng staff_activity_logs
    try {
        $description = 'Cap nhat trang thai san pham "' . $product['name'] . '" tu ' . $oldStatus . ' sang ' . $status;

        $sql = "
            INSERT INTO staff_activity_logs (
                user_id,
                action_type,
                target_type,
                target_id,
                description
            )
            VALUES (
                :user_id,
                'update_status',
                'product',
                :target_id,
                :description
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':target_id' => $productId,
            ':description' => $description
        ]);
    } catch (PDOException $logError) {
        // Bỏ qua nếu bảng log khác cấu trúc
    }


    // 16. Hoàn tất transaction
    $conn->commit();


    // 17. Trả kết quả
    sendSuccess('Admin cap nhat trang thai san pham thanh cong', [
        'current_user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => [
                'code' => $user['role_code'],
                'name' => $user['role_name']
            ]
        ],

        'product' => [
            'id' => (int) $product['id'],
            'name' => $product['name'],
            'slug' => $product['slug'],
            'old_status' => $oldStatus,
            'new_status' => $status
        ],

        'variant_summary' => [
            'total_variants' => (int) ($variantSummary['total_variants'] ?? 0),
            'active_variants' => (int) ($variantSummary['active_variants'] ?? 0),
            'total_stock' => (int) ($variantSummary['total_stock'] ?? 0)
        ]
    ]);

} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Admin cap nhat trang thai san pham that bai', 500, [
        'database' => $e->getMessage()
    ]);
}