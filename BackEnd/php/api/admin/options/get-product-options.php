<?php
// =========================================================
// File: api/admin/options/get-product-options.php
// Mục đích: API lấy dữ liệu option cho form thêm/sửa sản phẩm admin
// Method: GET
// =========================================================

session_start();

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../helpers/response.php';


// 1. Cho phép gọi API từ frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}


// 2. Chỉ cho phép GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Phuong thuc khong hop le', 405);
}


// 3. Kiểm tra đăng nhập
if (empty($_SESSION['user_id'])) {
    sendError('Vui long dang nhap de lay du lieu tuy chon san pham', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Hàm lấy danh sách cột của bảng
function getTableColumns($conn, $tableName)
{
    try {
        $stmt = $conn->query("SHOW COLUMNS FROM " . $tableName);
        $columns = $stmt->fetchAll();

        $result = [];

        foreach ($columns as $column) {
            $result[] = $column['Field'];
        }

        return $result;
    } catch (PDOException $e) {
        return [];
    }
}


// 5. Kết nối database
$conn = getDatabaseConnection();

try {
    // 6. Kiểm tra quyền admin/staff
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
        sendError('Ban khong co quyen lay du lieu tuy chon san pham', 403);
    }


    // 7. Lấy danh mục sản phẩm
    $categoryColumns = getTableColumns($conn, 'categories');

    $categories = [];

    if (!empty($categoryColumns)) {
        $hasParentId = in_array('parent_id', $categoryColumns);
        $hasStatus = in_array('status', $categoryColumns);

        if ($hasParentId) {
            $selectStatus = $hasStatus ? "c.status," : "'active' AS status,";

            $whereStatus = $hasStatus ? "WHERE c.status = 'active'" : "";

            $sql = "
                SELECT
                    c.id,
                    c.name,
                    c.slug,
                    c.parent_id,
                    parent.name AS parent_name,
                    parent.slug AS parent_slug,
                    $selectStatus
                    c.created_at
                FROM categories c
                LEFT JOIN categories parent
                    ON c.parent_id = parent.id
                $whereStatus
                ORDER BY
                    CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END,
                    parent.name ASC,
                    c.name ASC
            ";
        } else {
            $selectStatus = $hasStatus ? "status," : "'active' AS status,";

            $whereStatus = $hasStatus ? "WHERE status = 'active'" : "";

            $sql = "
                SELECT
                    id,
                    name,
                    slug,
                    NULL AS parent_id,
                    NULL AS parent_name,
                    NULL AS parent_slug,
                    $selectStatus
                    created_at
                FROM categories
                $whereStatus
                ORDER BY name ASC
            ";
        }

        $stmt = $conn->prepare($sql);
        $stmt->execute();

        $categories = $stmt->fetchAll();
    }


    // 8. Lấy màu sắc
    $colorColumns = getTableColumns($conn, 'colors');

    $colors = [];

    if (!empty($colorColumns)) {
        $hasStatus = in_array('status', $colorColumns);

        $selectStatus = $hasStatus ? "status," : "'active' AS status,";
        $whereStatus = $hasStatus ? "WHERE status = 'active'" : "";

        $sql = "
            SELECT
                id,
                name,
                code,
                hex_code,
                $selectStatus
                created_at
            FROM colors
            $whereStatus
            ORDER BY name ASC, id ASC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute();

        $colors = $stmt->fetchAll();
    }


    // 9. Lấy size
    $sizeColumns = getTableColumns($conn, 'sizes');

    $sizes = [];

    if (!empty($sizeColumns)) {
        $hasStatus = in_array('status', $sizeColumns);

        $selectStatus = $hasStatus ? "status," : "'active' AS status,";
        $whereStatus = $hasStatus ? "WHERE status = 'active'" : "";

        $sql = "
            SELECT
                id,
                name,
                code,
                $selectStatus
                created_at
            FROM sizes
            $whereStatus
            ORDER BY id ASC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute();

        $sizes = $stmt->fetchAll();
    }


    // 10. Format danh mục
    $formattedCategories = array_map(function ($category) {
        return [
            'id' => (int) $category['id'],
            'name' => $category['name'],
            'slug' => $category['slug'],

            'parent' => [
                'id' => $category['parent_id'] !== null ? (int) $category['parent_id'] : null,
                'name' => $category['parent_name'],
                'slug' => $category['parent_slug']
            ],

            'status' => $category['status'],
            'created_at' => $category['created_at']
        ];
    }, $categories);


    // 11. Tách danh mục cha và danh mục con
    $parentCategories = [];
    $childCategories = [];

    foreach ($formattedCategories as $category) {
        if ($category['parent']['id'] === null) {
            $parentCategories[] = $category;
        } else {
            $childCategories[] = $category;
        }
    }


    // 12. Format màu sắc
    $formattedColors = array_map(function ($color) {
        return [
            'id' => (int) $color['id'],
            'name' => $color['name'],
            'code' => $color['code'],
            'hex_code' => $color['hex_code'],
            'status' => $color['status'],
            'created_at' => $color['created_at']
        ];
    }, $colors);


    // 13. Format size
    $formattedSizes = array_map(function ($size) {
        return [
            'id' => (int) $size['id'],
            'name' => $size['name'],
            'code' => $size['code'],
            'status' => $size['status'],
            'created_at' => $size['created_at']
        ];
    }, $sizes);


    // 14. Option tĩnh cho form sản phẩm
    $productGenders = [
        [
            'value' => 'male',
            'label' => 'Nam'
        ],
        [
            'value' => 'female',
            'label' => 'Nữ'
        ],
        [
            'value' => 'unisex',
            'label' => 'Unisex'
        ]
    ];

    $productStatuses = [
        [
            'value' => 'active',
            'label' => 'Đang bán'
        ],
        [
            'value' => 'inactive',
            'label' => 'Tạm ẩn'
        ]
    ];

    $productFlags = [
        [
            'key' => 'is_featured',
            'label' => 'Sản phẩm nổi bật'
        ],
        [
            'key' => 'is_new',
            'label' => 'Sản phẩm mới'
        ],
        [
            'key' => 'is_sale',
            'label' => 'Sản phẩm đang sale'
        ]
    ];


    // 15. Trả kết quả
    sendSuccess('Admin lay tuy chon san pham thanh cong', [
        'current_user' => [
            'id' => (int) $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => [
                'code' => $user['role_code'],
                'name' => $user['role_name']
            ]
        ],

        'categories' => $formattedCategories,
        'parent_categories' => $parentCategories,
        'child_categories' => $childCategories,

        'colors' => $formattedColors,
        'sizes' => $formattedSizes,

        'product_genders' => $productGenders,
        'product_statuses' => $productStatuses,
        'product_flags' => $productFlags,

        'summary' => [
            'total_categories' => count($formattedCategories),
            'total_parent_categories' => count($parentCategories),
            'total_child_categories' => count($childCategories),
            'total_colors' => count($formattedColors),
            'total_sizes' => count($formattedSizes)
        ]
    ]);

} catch (PDOException $e) {
    sendError('Admin lay tuy chon san pham that bai', 500, [
        'database' => $e->getMessage()
    ]);
}