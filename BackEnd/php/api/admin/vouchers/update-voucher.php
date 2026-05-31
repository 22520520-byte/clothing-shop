<?php
// =========================================================
// File: api/admin/vouchers/update-voucher.php
// Mục đích: API admin cập nhật voucher
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
    sendError('Vui long dang nhap de cap nhat voucher', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Hàm chuẩn hóa ngày giờ
function normalizeDateTimeValue($value)
{
    $value = trim($value);

    if ($value === '') {
        return '';
    }

    $value = str_replace('T', ' ', $value);

    if (strlen($value) === 16) {
        $value .= ':00';
    }

    return $value;
}


// 6. Lấy dữ liệu request
$voucherId = isset($input['voucher_id']) ? (int) $input['voucher_id'] : 0;

$code = strtoupper(trim($input['code'] ?? ''));
$name = trim($input['name'] ?? '');
$description = trim($input['description'] ?? '');

$discountType = trim($input['discount_type'] ?? '');
$discountValue = isset($input['discount_value']) ? (float) $input['discount_value'] : 0;

$minOrderValue = isset($input['min_order_value']) ? (float) $input['min_order_value'] : 0;
$maxDiscountAmount = isset($input['max_discount_amount']) && $input['max_discount_amount'] !== ''
    ? (float) $input['max_discount_amount']
    : null;

$quantity = isset($input['quantity']) ? (int) $input['quantity'] : 0;
$usageLimitPerUser = isset($input['usage_limit_per_user']) ? (int) $input['usage_limit_per_user'] : 1;

$startDate = normalizeDateTimeValue($input['start_date'] ?? '');
$endDate = normalizeDateTimeValue($input['end_date'] ?? '');

$status = trim($input['status'] ?? 'active');


// 7. Validate dữ liệu
$errors = [];

if ($voucherId <= 0) {
    $errors['voucher_id'] = 'Vui long truyen ma voucher';
}

if ($code === '') {
    $errors['code'] = 'Vui long nhap ma voucher';
} elseif (!preg_match('/^[A-Z0-9_-]{3,50}$/', $code)) {
    $errors['code'] = 'Ma voucher chi gom chu in hoa, so, dau gach ngang hoac gach duoi';
}

if ($name === '') {
    $errors['name'] = 'Vui long nhap ten voucher';
}

$allowedDiscountTypes = [
    'fixed',
    'percent',
    'freeship'
];

if (!in_array($discountType, $allowedDiscountTypes)) {
    $errors['discount_type'] = 'Loai giam gia khong hop le';
}

if ($discountType === 'fixed') {
    if ($discountValue <= 0) {
        $errors['discount_value'] = 'Gia tri giam tien phai lon hon 0';
    }
} elseif ($discountType === 'percent') {
    if ($discountValue <= 0 || $discountValue > 100) {
        $errors['discount_value'] = 'Gia tri phan tram phai tu 1 den 100';
    }
} elseif ($discountType === 'freeship') {
    $discountValue = 0;
    $maxDiscountAmount = null;
}

if ($minOrderValue < 0) {
    $errors['min_order_value'] = 'Gia tri don hang toi thieu khong duoc am';
}

if ($maxDiscountAmount !== null && $maxDiscountAmount < 0) {
    $errors['max_discount_amount'] = 'Muc giam toi da khong duoc am';
}

if ($quantity <= 0) {
    $errors['quantity'] = 'So luong voucher phai lon hon 0';
}

if ($usageLimitPerUser <= 0) {
    $errors['usage_limit_per_user'] = 'So lan dung moi nguoi phai lon hon 0';
}

$startDateObj = DateTime::createFromFormat('Y-m-d H:i:s', $startDate);
$endDateObj = DateTime::createFromFormat('Y-m-d H:i:s', $endDate);

if (!$startDateObj || $startDateObj->format('Y-m-d H:i:s') !== $startDate) {
    $errors['start_date'] = 'Ngay bat dau khong hop le';
}

if (!$endDateObj || $endDateObj->format('Y-m-d H:i:s') !== $endDate) {
    $errors['end_date'] = 'Ngay ket thuc khong hop le';
}

if ($startDateObj && $endDateObj && $startDateObj >= $endDateObj) {
    $errors['end_date'] = 'Ngay ket thuc phai lon hon ngay bat dau';
}

$allowedStatuses = [
    'active',
    'inactive'
];

if (!in_array($status, $allowedStatuses)) {
    $errors['status'] = 'Trang thai voucher khong hop le';
}

if (!empty($errors)) {
    sendError('Du lieu khong hop le', 422, $errors);
}


// 8. Kết nối database
$conn = getDatabaseConnection();

try {
    // 9. Kiểm tra quyền admin/staff
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
        sendError('Ban khong co quyen cap nhat voucher', 403);
    }


    // 10. Kiểm tra voucher tồn tại
    $sql = "
        SELECT
            id,
            code,
            name,
            used_quantity
        FROM vouchers
        WHERE id = :voucher_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':voucher_id' => $voucherId
    ]);

    $currentVoucher = $stmt->fetch();

    if (!$currentVoucher) {
        sendError('Khong tim thay voucher', 404);
    }


    // 11. Không cho giảm quantity nhỏ hơn số đã dùng
    $usedQuantity = (int) $currentVoucher['used_quantity'];

    if ($quantity < $usedQuantity) {
        sendError('So luong voucher khong duoc nho hon so luong da su dung', 422, [
            'quantity' => 'Voucher da duoc su dung ' . $usedQuantity . ' lan'
        ]);
    }


    // 12. Kiểm tra mã voucher có bị trùng với voucher khác không
    $sql = "
        SELECT id
        FROM vouchers
        WHERE code = :code
        AND id != :voucher_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':code' => $code,
        ':voucher_id' => $voucherId
    ]);

    if ($stmt->fetch()) {
        sendError('Ma voucher da ton tai', 409, [
            'code' => 'Ma voucher da duoc su dung'
        ]);
    }


    // 13. Bắt đầu transaction
    $conn->beginTransaction();


    // 14. Cập nhật voucher
    $sql = "
        UPDATE vouchers
        SET
            code = :code,
            name = :name,
            description = :description,
            discount_type = :discount_type,
            discount_value = :discount_value,
            min_order_value = :min_order_value,
            max_discount_amount = :max_discount_amount,
            quantity = :quantity,
            usage_limit_per_user = :usage_limit_per_user,
            start_date = :start_date,
            end_date = :end_date,
            status = :status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :voucher_id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':code' => $code,
        ':name' => $name,
        ':description' => $description !== '' ? $description : null,
        ':discount_type' => $discountType,
        ':discount_value' => $discountValue,
        ':min_order_value' => $minOrderValue,
        ':max_discount_amount' => $maxDiscountAmount,
        ':quantity' => $quantity,
        ':usage_limit_per_user' => $usageLimitPerUser,
        ':start_date' => $startDate,
        ':end_date' => $endDate,
        ':status' => $status,
        ':voucher_id' => $voucherId
    ]);


    // 15. Ghi log hoạt động nhân viên nếu có bảng staff_activity_logs
    try {
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
                'update',
                'voucher',
                :target_id,
                :description
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':target_id' => $voucherId,
            ':description' => 'Cap nhat voucher: ' . $code
        ]);
    } catch (PDOException $logError) {
        // Bỏ qua nếu bảng log khác cấu trúc
    }


    // 16. Lấy lại voucher sau cập nhật
    $sql = "
        SELECT
            id,
            code,
            name,
            description,
            discount_type,
            discount_value,
            min_order_value,
            max_discount_amount,
            quantity,
            used_quantity,
            usage_limit_per_user,
            start_date,
            end_date,
            status,
            created_at,
            updated_at
        FROM vouchers
        WHERE id = :voucher_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':voucher_id' => $voucherId
    ]);

    $voucher = $stmt->fetch();


    // 17. Hoàn tất transaction
    $conn->commit();


    // 18. Tạo nhãn giảm giá
    $discountLabel = '';

    if ($voucher['discount_type'] === 'fixed') {
        $discountLabel = 'Giam ' . number_format((float) $voucher['discount_value'], 0, ',', '.') . 'd';
    } elseif ($voucher['discount_type'] === 'percent') {
        $discountLabel = 'Giam ' . (float) $voucher['discount_value'] . '%';
    } elseif ($voucher['discount_type'] === 'freeship') {
        $discountLabel = 'Mien phi van chuyen';
    }


    // 19. Trả kết quả
    sendSuccess('Admin cap nhat voucher thanh cong', [
        'current_user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => [
                'code' => $user['role_code'],
                'name' => $user['role_name']
            ]
        ],

        'voucher' => [
            'id' => (int) $voucher['id'],
            'code' => $voucher['code'],
            'name' => $voucher['name'],
            'description' => $voucher['description'],

            'discount_type' => $voucher['discount_type'],
            'discount_value' => (float) $voucher['discount_value'],
            'discount_label' => $discountLabel,

            'min_order_value' => (float) $voucher['min_order_value'],
            'max_discount_amount' => $voucher['max_discount_amount'] !== null
                ? (float) $voucher['max_discount_amount']
                : null,

            'quantity' => (int) $voucher['quantity'],
            'used_quantity' => (int) $voucher['used_quantity'],
            'remaining_quantity' => (int) $voucher['quantity'] - (int) $voucher['used_quantity'],
            'usage_limit_per_user' => (int) $voucher['usage_limit_per_user'],

            'start_date' => $voucher['start_date'],
            'end_date' => $voucher['end_date'],
            'status' => $voucher['status'],

            'created_at' => $voucher['created_at'],
            'updated_at' => $voucher['updated_at']
        ]
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Admin cap nhat voucher that bai', 500, [
        'error' => $e->getMessage()
    ]);
}