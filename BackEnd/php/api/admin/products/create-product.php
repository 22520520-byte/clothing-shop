<?php
// =========================================================
// File: api/admin/products/create-product.php
// Mục đích: API admin thêm sản phẩm mới
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
    sendError('Vui long dang nhap de them san pham', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Đọc dữ liệu gửi lên
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = $_POST;
}


// 5. Hàm tạo slug đơn giản
function createSlug($text)
{
    $text = trim($text);
    $text = mb_strtolower($text, 'UTF-8');

    $unicode = [
        'a' => 'á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ',
        'd' => 'đ',
        'e' => 'é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ',
        'i' => 'í|ì|ỉ|ĩ|ị',
        'o' => 'ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ',
        'u' => 'ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự',
        'y' => 'ý|ỳ|ỷ|ỹ|ỵ'
    ];

    foreach ($unicode as $nonUnicode => $unicodeChars) {
        $text = preg_replace("/($unicodeChars)/u", $nonUnicode, $text);
    }

    $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
    $text = preg_replace('/[\s-]+/', '-', $text);
    $text = trim($text, '-');

    return $text;
}


// 6. Lấy dữ liệu sản phẩm
$categoryId = isset($input['category_id']) ? (int) $input['category_id'] : 0;

$name = trim($input['name'] ?? '');
$slug = trim($input['slug'] ?? '');
$shortDescription = trim($input['short_description'] ?? '');

$basePrice = isset($input['base_price']) ? (float) $input['base_price'] : 0;
$oldPrice = isset($input['old_price']) && $input['old_price'] !== '' ? (float) $input['old_price'] : null;

$gender = trim($input['gender'] ?? 'unisex');
$material = trim($input['material'] ?? '');
$brand = trim($input['brand'] ?? 'Local Brand');

$isFeatured = isset($input['is_featured']) ? (int) $input['is_featured'] : 0;
$isNew = isset($input['is_new']) ? (int) $input['is_new'] : 1;
$isSale = isset($input['is_sale']) ? (int) $input['is_sale'] : 0;

$status = trim($input['status'] ?? 'active');

$images = $input['images'] ?? [];
$variants = $input['variants'] ?? [];


// 7. Tự tạo slug nếu chưa truyền
if ($slug === '' && $name !== '') {
    $slug = createSlug($name);
}


// 8. Validate dữ liệu
$errors = [];

if ($categoryId <= 0) {
    $errors['category_id'] = 'Vui long chon danh muc';
}

if ($name === '') {
    $errors['name'] = 'Vui long nhap ten san pham';
}

if ($slug === '') {
    $errors['slug'] = 'Slug san pham khong hop le';
}

if ($basePrice <= 0) {
    $errors['base_price'] = 'Gia san pham phai lon hon 0';
}

if ($oldPrice !== null && $oldPrice < $basePrice) {
    $errors['old_price'] = 'Gia cu khong duoc nho hon gia ban';
}

$allowedGenders = ['male', 'female', 'unisex'];

if (!in_array($gender, $allowedGenders)) {
    $errors['gender'] = 'Gioi tinh san pham khong hop le';
}

$allowedStatuses = ['active', 'inactive'];

if (!in_array($status, $allowedStatuses)) {
    $errors['status'] = 'Trang thai san pham khong hop le';
}

foreach (['is_featured', 'is_new', 'is_sale'] as $booleanField) {
    $value = (int) ($input[$booleanField] ?? 0);

    if (!in_array($value, [0, 1])) {
        $errors[$booleanField] = 'Gia tri chi duoc la 0 hoac 1';
    }
}

if (!is_array($images)) {
    $errors['images'] = 'Danh sach hinh anh khong hop le';
}

if (!is_array($variants)) {
    $errors['variants'] = 'Danh sach bien the khong hop le';
}

if (!empty($errors)) {
    sendError('Du lieu khong hop le', 422, $errors);
}


// 9. Kết nối database
$conn = getDatabaseConnection();

try {
    // 10. Kiểm tra quyền admin/staff
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
        sendError('Ban khong co quyen them san pham', 403);
    }


    // 11. Kiểm tra danh mục tồn tại
    $sql = "
        SELECT
            id,
            name,
            slug
        FROM categories
        WHERE id = :category_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':category_id' => $categoryId
    ]);

    $category = $stmt->fetch();

    if (!$category) {
        sendError('Danh muc khong ton tai', 404);
    }


    // 12. Kiểm tra slug sản phẩm đã tồn tại chưa
    $sql = "
        SELECT id
        FROM products
        WHERE slug = :slug
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':slug' => $slug
    ]);

    if ($stmt->fetch()) {
        sendError('Slug san pham da ton tai', 409, [
            'slug' => 'Slug da duoc su dung'
        ]);
    }


    // 13. Validate ảnh sản phẩm
    $hasMainImage = false;

    foreach ($images as $index => $image) {
        $imageUrl = trim($image['image_url'] ?? '');

        if ($imageUrl === '') {
            sendError('Du lieu hinh anh khong hop le', 422, [
                'images' => 'Image url o vi tri ' . $index . ' khong duoc de trong'
            ]);
        }

        if ((int) ($image['is_main'] ?? 0) === 1) {
            $hasMainImage = true;
        }
    }

    if (count($images) > 0 && !$hasMainImage) {
        $images[0]['is_main'] = 1;
    }


    // 14. Validate biến thể
    foreach ($variants as $index => $variant) {
        $colorId = isset($variant['color_id']) ? (int) $variant['color_id'] : 0;
        $sizeId = isset($variant['size_id']) ? (int) $variant['size_id'] : 0;
        $sku = trim($variant['sku'] ?? '');
        $stockQuantity = isset($variant['stock_quantity']) ? (int) $variant['stock_quantity'] : 0;
        $variantStatus = trim($variant['status'] ?? 'active');

        if ($colorId <= 0) {
            sendError('Du lieu bien the khong hop le', 422, [
                'variants' => 'Color ID o vi tri ' . $index . ' khong hop le'
            ]);
        }

        if ($sizeId <= 0) {
            sendError('Du lieu bien the khong hop le', 422, [
                'variants' => 'Size ID o vi tri ' . $index . ' khong hop le'
            ]);
        }

        if ($sku === '') {
            sendError('Du lieu bien the khong hop le', 422, [
                'variants' => 'SKU o vi tri ' . $index . ' khong duoc de trong'
            ]);
        }

        if ($stockQuantity < 0) {
            sendError('Du lieu bien the khong hop le', 422, [
                'variants' => 'So luong ton kho khong duoc am'
            ]);
        }

        if (!in_array($variantStatus, ['active', 'inactive'])) {
            sendError('Du lieu bien the khong hop le', 422, [
                'variants' => 'Trang thai bien the o vi tri ' . $index . ' khong hop le'
            ]);
        }
    }


    // 15. Bắt đầu transaction
    $conn->beginTransaction();


    // 16. Thêm sản phẩm chính
    $sql = "
        INSERT INTO products (
            category_id,
            name,
            slug,
            short_description,
            base_price,
            old_price,
            gender,
            material,
            brand,
            is_featured,
            is_new,
            is_sale,
            status
        )
        VALUES (
            :category_id,
            :name,
            :slug,
            :short_description,
            :base_price,
            :old_price,
            :gender,
            :material,
            :brand,
            :is_featured,
            :is_new,
            :is_sale,
            :status
        )
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':category_id' => $categoryId,
        ':name' => $name,
        ':slug' => $slug,
        ':short_description' => $shortDescription,
        ':base_price' => $basePrice,
        ':old_price' => $oldPrice,
        ':gender' => $gender,
        ':material' => $material !== '' ? $material : null,
        ':brand' => $brand !== '' ? $brand : null,
        ':is_featured' => $isFeatured,
        ':is_new' => $isNew,
        ':is_sale' => $isSale,
        ':status' => $status
    ]);

    $productId = (int) $conn->lastInsertId();


    // 17. Thêm ảnh sản phẩm
    $createdImages = [];

    foreach ($images as $image) {
        $imageUrl = trim($image['image_url'] ?? '');
        $isMain = isset($image['is_main']) ? (int) $image['is_main'] : 0;

        $sql = "
            INSERT INTO product_images (
                product_id,
                image_url,
                is_main
            )
            VALUES (
                :product_id,
                :image_url,
                :is_main
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':product_id' => $productId,
            ':image_url' => $imageUrl,
            ':is_main' => $isMain
        ]);

        $createdImages[] = [
            'id' => (int) $conn->lastInsertId(),
            'product_id' => $productId,
            'image_url' => $imageUrl,
            'is_main' => $isMain
        ];
    }


    // 18. Thêm biến thể sản phẩm
    $createdVariants = [];

    foreach ($variants as $variant) {
        $colorId = (int) $variant['color_id'];
        $sizeId = (int) $variant['size_id'];
        $sku = trim($variant['sku']);
        $stockQuantity = (int) $variant['stock_quantity'];
        $variantStatus = trim($variant['status'] ?? 'active');

        // Kiểm tra SKU trùng
        $sql = "
            SELECT id
            FROM product_variants
            WHERE sku = :sku
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':sku' => $sku
        ]);

        if ($stmt->fetch()) {
            throw new Exception('SKU da ton tai: ' . $sku);
        }

        // Kiểm tra màu tồn tại
        $sql = "
            SELECT id, name, code, hex_code
            FROM colors
            WHERE id = :color_id
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':color_id' => $colorId
        ]);

        $color = $stmt->fetch();

        if (!$color) {
            throw new Exception('Color ID khong ton tai: ' . $colorId);
        }

        // Kiểm tra size tồn tại
        $sql = "
            SELECT id, name, code
            FROM sizes
            WHERE id = :size_id
            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':size_id' => $sizeId
        ]);

        $size = $stmt->fetch();

        if (!$size) {
            throw new Exception('Size ID khong ton tai: ' . $sizeId);
        }

        // Thêm biến thể
        $sql = "
            INSERT INTO product_variants (
                product_id,
                color_id,
                size_id,
                sku,
                stock_quantity,
                status
            )
            VALUES (
                :product_id,
                :color_id,
                :size_id,
                :sku,
                :stock_quantity,
                :status
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':product_id' => $productId,
            ':color_id' => $colorId,
            ':size_id' => $sizeId,
            ':sku' => $sku,
            ':stock_quantity' => $stockQuantity,
            ':status' => $variantStatus
        ]);

        $variantId = (int) $conn->lastInsertId();

        $createdVariants[] = [
            'id' => $variantId,
            'product_id' => $productId,
            'sku' => $sku,
            'color' => [
                'id' => (int) $color['id'],
                'name' => $color['name'],
                'code' => $color['code'],
                'hex_code' => $color['hex_code']
            ],
            'size' => [
                'id' => (int) $size['id'],
                'name' => $size['name'],
                'code' => $size['code']
            ],
            'stock_quantity' => $stockQuantity,
            'status' => $variantStatus
        ];

        // Ghi log nhập kho ban đầu nếu có tồn kho
        if ($stockQuantity > 0) {
            $sql = "
                INSERT INTO product_stock_logs (
                    variant_id,
                    user_id,
                    change_type,
                    quantity_change,
                    quantity_before,
                    quantity_after,
                    note
                )
                VALUES (
                    :variant_id,
                    :user_id,
                    'import',
                    :quantity_change,
                    0,
                    :quantity_after,
                    :note
                )
            ";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':variant_id' => $variantId,
                ':user_id' => $userId,
                ':quantity_change' => $stockQuantity,
                ':quantity_after' => $stockQuantity,
                ':note' => 'Nhap kho ban dau khi tao san pham'
            ]);
        }
    }


    // 19. Ghi log hoạt động nhân viên nếu có bảng staff_activity_logs
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
                'create',
                'product',
                :target_id,
                :description
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':target_id' => $productId,
            ':description' => 'Them san pham moi: ' . $name
        ]);
    } catch (PDOException $logError) {
        // Bỏ qua nếu bảng log khác cấu trúc
    }


    // 20. Hoàn tất transaction
    $conn->commit();


    // 21. Trả kết quả
    sendSuccess('Admin them san pham thanh cong', [
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
            'id' => $productId,
            'category' => [
                'id' => (int) $category['id'],
                'name' => $category['name'],
                'slug' => $category['slug']
            ],
            'name' => $name,
            'slug' => $slug,
            'short_description' => $shortDescription,
            'base_price' => $basePrice,
            'old_price' => $oldPrice,
            'gender' => $gender,
            'material' => $material,
            'brand' => $brand,
            'is_featured' => $isFeatured,
            'is_new' => $isNew,
            'is_sale' => $isSale,
            'status' => $status,
            'images' => $createdImages,
            'variants' => $createdVariants
        ]
    ], 201);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Admin them san pham that bai', 500, [
        'error' => $e->getMessage()
    ]);
}