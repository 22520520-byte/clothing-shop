<?php
// =========================================================
// File: api/admin/products/update-product.php
// Mục đích: API admin cập nhật sản phẩm
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
    sendError('Vui long dang nhap de cap nhat san pham', 401);
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


// 6. Lấy dữ liệu request
$productId = isset($input['product_id']) ? (int) $input['product_id'] : 0;

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
$isNew = isset($input['is_new']) ? (int) $input['is_new'] : 0;
$isSale = isset($input['is_sale']) ? (int) $input['is_sale'] : 0;

$status = trim($input['status'] ?? 'active');

$images = $input['images'] ?? null;
$variants = $input['variants'] ?? null;


// 7. Tự tạo slug nếu chưa truyền
if ($slug === '' && $name !== '') {
    $slug = createSlug($name);
}


// 8. Validate dữ liệu sản phẩm
$errors = [];

if ($productId <= 0) {
    $errors['product_id'] = 'Vui long truyen ma san pham';
}

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

if ($images !== null && !is_array($images)) {
    $errors['images'] = 'Danh sach hinh anh khong hop le';
}

if ($variants !== null && !is_array($variants)) {
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
        sendError('Ban khong co quyen cap nhat san pham', 403);
    }


    // 11. Kiểm tra sản phẩm tồn tại
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

    $currentProduct = $stmt->fetch();

    if (!$currentProduct) {
        sendError('Khong tim thay san pham', 404);
    }


    // 12. Kiểm tra danh mục tồn tại
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


    // 13. Kiểm tra slug trùng sản phẩm khác
    $sql = "
        SELECT id
        FROM products
        WHERE slug = :slug
        AND id != :product_id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':slug' => $slug,
        ':product_id' => $productId
    ]);

    if ($stmt->fetch()) {
        sendError('Slug san pham da ton tai', 409, [
            'slug' => 'Slug da duoc su dung'
        ]);
    }


    // 14. Validate ảnh nếu có truyền images
    if ($images !== null) {
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
    }


    // 15. Validate biến thể nếu có truyền variants
    if ($variants !== null) {
        foreach ($variants as $index => $variant) {
            $variantId = isset($variant['id']) ? (int) $variant['id'] : 0;
            $colorId = isset($variant['color_id']) ? (int) $variant['color_id'] : 0;
            $sizeId = isset($variant['size_id']) ? (int) $variant['size_id'] : 0;
            $sku = trim($variant['sku'] ?? '');
            $stockQuantity = isset($variant['stock_quantity']) ? (int) $variant['stock_quantity'] : 0;
            $variantStatus = trim($variant['status'] ?? 'active');

            if ($variantId < 0) {
                sendError('Du lieu bien the khong hop le', 422, [
                    'variants' => 'Variant ID o vi tri ' . $index . ' khong hop le'
                ]);
            }

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
    }


    // 16. Bắt đầu transaction
    $conn->beginTransaction();


    // 17. Cập nhật sản phẩm chính
    $sql = "
        UPDATE products
        SET
            category_id = :category_id,
            name = :name,
            slug = :slug,
            short_description = :short_description,
            base_price = :base_price,
            old_price = :old_price,
            gender = :gender,
            material = :material,
            brand = :brand,
            is_featured = :is_featured,
            is_new = :is_new,
            is_sale = :is_sale,
            status = :status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :product_id
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
        ':status' => $status,
        ':product_id' => $productId
    ]);


    // 18. Cập nhật ảnh nếu có truyền images
    $updatedImages = [];

    if ($images !== null) {
        $sql = "
            DELETE FROM product_images
            WHERE product_id = :product_id_delete_images
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':product_id_delete_images' => $productId
        ]);

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

            $updatedImages[] = [
                'id' => (int) $conn->lastInsertId(),
                'product_id' => $productId,
                'image_url' => $imageUrl,
                'is_main' => $isMain
            ];
        }
    }


    // 19. Cập nhật biến thể nếu có truyền variants
    $updatedVariants = [];

    if ($variants !== null) {
        foreach ($variants as $variant) {
            $variantId = isset($variant['id']) ? (int) $variant['id'] : 0;
            $colorId = (int) $variant['color_id'];
            $sizeId = (int) $variant['size_id'];
            $sku = trim($variant['sku']);
            $newStockQuantity = (int) $variant['stock_quantity'];
            $variantStatus = trim($variant['status'] ?? 'active');


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


            if ($variantId > 0) {
                // Cập nhật biến thể cũ

                $sql = "
                    SELECT
                        id,
                        sku,
                        stock_quantity
                    FROM product_variants
                    WHERE id = :variant_id
                    AND product_id = :product_id
                    LIMIT 1
                ";

                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    ':variant_id' => $variantId,
                    ':product_id' => $productId
                ]);

                $currentVariant = $stmt->fetch();

                if (!$currentVariant) {
                    throw new Exception('Khong tim thay bien the ID: ' . $variantId);
                }

                // Kiểm tra SKU trùng biến thể khác
                $sql = "
                    SELECT id
                    FROM product_variants
                    WHERE sku = :sku
                    AND id != :variant_id
                    LIMIT 1
                ";

                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    ':sku' => $sku,
                    ':variant_id' => $variantId
                ]);

                if ($stmt->fetch()) {
                    throw new Exception('SKU da ton tai: ' . $sku);
                }

                $oldStockQuantity = (int) $currentVariant['stock_quantity'];

                $sql = "
                    UPDATE product_variants
                    SET
                        color_id = :color_id,
                        size_id = :size_id,
                        sku = :sku,
                        stock_quantity = :stock_quantity,
                        status = :status,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = :variant_id
                    AND product_id = :product_id
                ";

                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    ':color_id' => $colorId,
                    ':size_id' => $sizeId,
                    ':sku' => $sku,
                    ':stock_quantity' => $newStockQuantity,
                    ':status' => $variantStatus,
                    ':variant_id' => $variantId,
                    ':product_id' => $productId
                ]);

                // Ghi log kho nếu số lượng thay đổi
                if ($newStockQuantity !== $oldStockQuantity) {
                    $quantityChange = $newStockQuantity - $oldStockQuantity;

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
                            'adjust',
                            :quantity_change,
                            :quantity_before,
                            :quantity_after,
                            :note
                        )
                    ";

                    $stmt = $conn->prepare($sql);
                    $stmt->execute([
                        ':variant_id' => $variantId,
                        ':user_id' => $userId,
                        ':quantity_change' => $quantityChange,
                        ':quantity_before' => $oldStockQuantity,
                        ':quantity_after' => $newStockQuantity,
                        ':note' => 'Dieu chinh ton kho khi cap nhat san pham'
                    ]);
                }
            } else {
                // Thêm biến thể mới

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
                    ':stock_quantity' => $newStockQuantity,
                    ':status' => $variantStatus
                ]);

                $variantId = (int) $conn->lastInsertId();

                if ($newStockQuantity > 0) {
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
                        ':quantity_change' => $newStockQuantity,
                        ':quantity_after' => $newStockQuantity,
                        ':note' => 'Nhap kho bien the moi khi cap nhat san pham'
                    ]);
                }
            }

            $updatedVariants[] = [
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
                'stock_quantity' => $newStockQuantity,
                'status' => $variantStatus
            ];
        }
    }


    // 20. Ghi log hoạt động nhân viên nếu có bảng staff_activity_logs
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
                'product',
                :target_id,
                :description
            )
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':target_id' => $productId,
            ':description' => 'Cap nhat san pham: ' . $name
        ]);
    } catch (PDOException $logError) {
        // Bỏ qua nếu bảng log khác cấu trúc
    }


    // 21. Hoàn tất transaction
    $conn->commit();


    // 22. Trả kết quả
    sendSuccess('Admin cap nhat san pham thanh cong', [
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
            'images_updated' => $images !== null,
            'variants_updated' => $variants !== null,
            'images' => $updatedImages,
            'variants' => $updatedVariants
        ]
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Admin cap nhat san pham that bai', 500, [
        'error' => $e->getMessage()
    ]);
}