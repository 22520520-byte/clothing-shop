<?php
// =========================================================
// File: BackEnd/php/api/admin/products/upload-product-image.php
// Mục đích: Upload ảnh sản phẩm admin và trả về đường dẫn ảnh
// =========================================================


// 1. Khởi tạo session và nạp file dùng chung
session_start();

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../helpers/response.php';


// 2. Chỉ cho phép POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Phuong thuc khong hop le', 405);
}


// 3. Kiểm tra đăng nhập
$userId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;

if ($userId <= 0) {
    sendError('Vui long dang nhap', 401);
}


// 4. Kết nối database và kiểm tra quyền admin/staff
$conn = getDatabaseConnection();

try {
    $sql = "
        SELECT 
            u.id,
            u.full_name,
            u.email,
            u.status,
            r.code AS role_code,
            r.name AS role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
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
        sendError('Ban khong co quyen upload anh san pham', 403);
    }
} catch (PDOException $e) {
    sendError('Kiem tra quyen upload anh that bai', 500, [
        'database' => $e->getMessage()
    ]);
}


// 5. Kiểm tra file ảnh gửi lên
$fileInputName = '';

if (isset($_FILES['image'])) {
    $fileInputName = 'image';
} elseif (isset($_FILES['product_image'])) {
    $fileInputName = 'product_image';
}

if ($fileInputName === '') {
    sendError('Vui long chon anh san pham', 422, [
        'image' => 'Khong tim thay file anh'
    ]);
}

$file = $_FILES[$fileInputName];

if (!isset($file['error']) || is_array($file['error'])) {
    sendError('Du lieu file khong hop le', 422);
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE => 'File vuot qua dung luong upload cua server',
        UPLOAD_ERR_FORM_SIZE => 'File vuot qua dung luong cho phep cua form',
        UPLOAD_ERR_PARTIAL => 'File chi duoc upload mot phan',
        UPLOAD_ERR_NO_FILE => 'Chua chon file',
        UPLOAD_ERR_NO_TMP_DIR => 'Server thieu thu muc tam',
        UPLOAD_ERR_CANT_WRITE => 'Khong ghi duoc file len server',
        UPLOAD_ERR_EXTENSION => 'Upload bi chan boi PHP extension'
    ];

    $message = $uploadErrors[$file['error']] ?? 'Upload anh that bai';

    sendError($message, 422);
}


// 6. Validate dung lượng
$maxFileSize = 5 * 1024 * 1024;

if ((int) $file['size'] <= 0) {
    sendError('File anh rong hoac khong hop le', 422);
}

if ((int) $file['size'] > $maxFileSize) {
    sendError('Anh san pham khong duoc vuot qua 5MB', 422);
}


// 7. Validate MIME type
$allowedMimeTypes = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif'
];

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!isset($allowedMimeTypes[$mimeType])) {
    sendError('Dinh dang anh khong hop le. Chi cho phep JPG, PNG, WEBP, GIF', 422, [
        'mime_type' => $mimeType
    ]);
}

$extension = $allowedMimeTypes[$mimeType];


// 8. Tạo thư mục upload nếu chưa có
$uploadDir = realpath(__DIR__ . '/../../../../uploads');

if ($uploadDir === false) {
    $uploadDir = __DIR__ . '/../../../../uploads';

    if (!mkdir($uploadDir, 0777, true)) {
        sendError('Khong tao duoc thu muc uploads', 500);
    }
}

$productUploadDir = $uploadDir . DIRECTORY_SEPARATOR . 'products';

if (!is_dir($productUploadDir)) {
    if (!mkdir($productUploadDir, 0777, true)) {
        sendError('Khong tao duoc thu muc uploads/products', 500);
    }
}


// 9. Tạo tên file an toàn
$originalName = pathinfo($file['name'], PATHINFO_FILENAME);

$safeName = strtolower($originalName);
$safeName = preg_replace('/[^a-z0-9-_]+/i', '-', $safeName);
$safeName = trim($safeName, '-');

if ($safeName === '') {
    $safeName = 'product';
}

$fileName = $safeName . '-' . date('YmdHis') . '-' . bin2hex(random_bytes(4)) . '.' . $extension;
$targetPath = $productUploadDir . DIRECTORY_SEPARATOR . $fileName;


// 10. Di chuyển file vào thư mục uploads/products
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    sendError('Khong luu duoc anh san pham len server', 500);
}


// 11. Tạo URL public để lưu vào database
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
$projectBaseUrl = '';

$backEndPosition = strpos($scriptName, '/BackEnd/');

if ($backEndPosition !== false) {
    $projectBaseUrl = substr($scriptName, 0, $backEndPosition);
}

$imageUrl = $projectBaseUrl . '/BackEnd/uploads/products/' . $fileName;


// 12. Trả kết quả
sendSuccess('Upload anh san pham thanh cong', [
    'current_user' => [
        'id' => (int) $user['id'],
        'full_name' => $user['full_name'],
        'email' => $user['email'],
        'role' => [
            'code' => $user['role_code'],
            'name' => $user['role_name']
        ]
    ],
    'image' => [
        'file_name' => $fileName,
        'original_name' => $file['name'],
        'mime_type' => $mimeType,
        'size' => (int) $file['size'],
        'image_url' => $imageUrl
    ]
]);