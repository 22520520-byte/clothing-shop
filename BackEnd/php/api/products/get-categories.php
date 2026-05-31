<?php
// =========================================================
// File: api/products/get-categories.php
// Mục đích: API lấy danh sách danh mục sản phẩm
// Method: GET
// =========================================================

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/response.php';


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


// 3. Kết nối database
$conn = getDatabaseConnection();

try {
    // 4. Lấy toàn bộ danh mục đang active
    $sql = "
        SELECT
            c.id,
            c.name,
            c.slug,
            c.description,
            c.parent_id,
            parent.name AS parent_name,
            parent.slug AS parent_slug,
            c.thumbnail,
            c.sort_order,
            c.status,

            COUNT(p.id) AS total_products,

            c.created_at,
            c.updated_at
        FROM categories c
        LEFT JOIN categories parent
            ON c.parent_id = parent.id
        LEFT JOIN products p
            ON c.id = p.category_id
            AND p.status = 'active'
        WHERE c.status = 'active'
        GROUP BY
            c.id,
            c.name,
            c.slug,
            c.description,
            c.parent_id,
            parent.name,
            parent.slug,
            c.thumbnail,
            c.sort_order,
            c.status,
            c.created_at,
            c.updated_at
        ORDER BY
            c.parent_id IS NOT NULL,
            c.parent_id,
            c.sort_order,
            c.id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $categories = $stmt->fetchAll();


    // 5. Format danh sách phẳng
    $formattedCategories = array_map(function ($category) {
        return [
            'id' => (int) $category['id'],
            'name' => $category['name'],
            'slug' => $category['slug'],
            'description' => $category['description'],

            'parent_id' => $category['parent_id'] !== null ? (int) $category['parent_id'] : null,
            'parent_name' => $category['parent_name'],
            'parent_slug' => $category['parent_slug'],

            'thumbnail' => $category['thumbnail'],
            'sort_order' => (int) $category['sort_order'],
            'status' => $category['status'],

            'total_products' => (int) $category['total_products'],

            'created_at' => $category['created_at'],
            'updated_at' => $category['updated_at']
        ];
    }, $categories);


    // 6. Tạo cây danh mục cha - con
    $categoryMap = [];
    $categoryTree = [];

    foreach ($formattedCategories as $category) {
        $category['children'] = [];
        $categoryMap[$category['id']] = $category;
    }

    foreach ($categoryMap as $id => $category) {
        if ($category['parent_id'] === null) {
            $categoryTree[] = &$categoryMap[$id];
        } else {
            $parentId = $category['parent_id'];

            if (isset($categoryMap[$parentId])) {
                $categoryMap[$parentId]['children'][] = &$categoryMap[$id];
            }
        }
    }


    // 7. Tách danh mục cha
    $parentCategories = array_values(array_filter($formattedCategories, function ($category) {
        return $category['parent_id'] === null;
    }));


    // 8. Tách danh mục con
    $childCategories = array_values(array_filter($formattedCategories, function ($category) {
        return $category['parent_id'] !== null;
    }));


    // 9. Trả kết quả
    sendSuccess('Lay danh sach danh muc thanh cong', [
        'categories' => $formattedCategories,
        'parent_categories' => $parentCategories,
        'child_categories' => $childCategories,
        'category_tree' => $categoryTree
    ]);

} catch (PDOException $e) {
    sendError('Lay danh sach danh muc that bai', 500, [
        'database' => $e->getMessage()
    ]);
}