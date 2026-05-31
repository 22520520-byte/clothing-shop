<?php
// =========================================================
// File: api/promotions/get-campaigns.php
// Mục đích: API lấy danh sách chương trình khuyến mãi
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


// 3. Lấy tham số từ URL
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 12;

$campaignType = trim($_GET['campaign_type'] ?? '');
$status = trim($_GET['status'] ?? 'active');
$activeOnly = isset($_GET['active_only']) ? (int) $_GET['active_only'] : 1;

$sort = trim($_GET['sort'] ?? 'latest');


// 4. Chuẩn hóa phân trang
if ($page < 1) {
    $page = 1;
}

if ($limit < 1) {
    $limit = 12;
}

if ($limit > 50) {
    $limit = 50;
}

$offset = ($page - 1) * $limit;


// 5. Validate dữ liệu lọc
$allowedCampaignTypes = [
    'flash_sale',
    'big_voucher',
    'seasonal_sale',
    'normal'
];

if ($campaignType !== '' && !in_array($campaignType, $allowedCampaignTypes)) {
    sendError('Loai chuong trinh khuyen mai khong hop le', 422);
}

$allowedStatuses = [
    'active',
    'inactive',
    'ended'
];

if ($status !== '' && !in_array($status, $allowedStatuses)) {
    sendError('Trang thai chuong trinh khuyen mai khong hop le', 422);
}


// 6. Kết nối database
$conn = getDatabaseConnection();

try {
    // 7. Tạo điều kiện lọc
    $where = [];
    $params = [];

    if ($status !== '') {
        $where[] = "pc.status = :status";
        $params[':status'] = $status;
    }

    if ($campaignType !== '') {
        $where[] = "pc.campaign_type = :campaign_type";
        $params[':campaign_type'] = $campaignType;
    }

    if ($activeOnly === 1) {
        $where[] = "NOW() BETWEEN pc.start_date AND pc.end_date";
    }

    if (empty($where)) {
        $where[] = "1 = 1";
    }

    $whereSql = implode(' AND ', $where);


    // 8. Sắp xếp
    $orderBy = "pc.created_at DESC, pc.id DESC";

    if ($sort === 'start_soon') {
        $orderBy = "pc.start_date ASC";
    } elseif ($sort === 'end_soon') {
        $orderBy = "pc.end_date ASC";
    } elseif ($sort === 'name_asc') {
        $orderBy = "pc.name ASC";
    }


    // 9. Đếm tổng chương trình
    $countSql = "
        SELECT COUNT(*) AS total
        FROM promotion_campaigns pc
        WHERE $whereSql
    ";

    $countStmt = $conn->prepare($countSql);
    $countStmt->execute($params);

    $totalCampaigns = (int) $countStmt->fetch()['total'];
    $totalPages = (int) ceil($totalCampaigns / $limit);


    // 10. Lấy danh sách chương trình khuyến mãi
    $sql = "
        SELECT
            pc.id,
            pc.name,
            pc.slug,
            pc.description,
            pc.banner_image,
            pc.campaign_type,
            pc.start_date,
            pc.end_date,
            pc.status,
            pc.created_at,
            pc.updated_at,

            COALESCE(product_summary.total_products, 0) AS total_products,
            COALESCE(product_summary.total_sale_stock_limit, 0) AS total_sale_stock_limit,
            COALESCE(product_summary.total_sold_quantity, 0) AS total_sold_quantity

        FROM promotion_campaigns pc

        LEFT JOIN (
            SELECT
                campaign_id,
                COUNT(id) AS total_products,
                COALESCE(SUM(sale_stock_limit), 0) AS total_sale_stock_limit,
                COALESCE(SUM(sold_quantity), 0) AS total_sold_quantity
            FROM promotion_products
            WHERE status = 'active'
            GROUP BY campaign_id
        ) product_summary
            ON pc.id = product_summary.campaign_id

        WHERE $whereSql
        ORDER BY $orderBy
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $campaigns = $stmt->fetchAll();


    // 11. Format dữ liệu trả về
    $campaignTypeLabels = [
        'flash_sale' => 'Flash Sale',
        'big_voucher' => 'Big Voucher',
        'seasonal_sale' => 'Sale theo mùa',
        'normal' => 'Khuyến mãi thường'
    ];

    $statusLabels = [
        'active' => 'Đang hoạt động',
        'inactive' => 'Tạm ẩn',
        'ended' => 'Đã kết thúc'
    ];

    $formattedCampaigns = array_map(function ($campaign) use ($campaignTypeLabels, $statusLabels) {
        $now = time();
        $startTime = strtotime($campaign['start_date']);
        $endTime = strtotime($campaign['end_date']);

        $isStarted = $now >= $startTime;
        $isEnded = $now > $endTime;

        $isAvailable = (
            $campaign['status'] === 'active'
            && $isStarted
            && !$isEnded
        );

        return [
            'id' => (int) $campaign['id'],
            'name' => $campaign['name'],
            'slug' => $campaign['slug'],
            'description' => $campaign['description'],
            'banner_image' => $campaign['banner_image'],

            'campaign_type' => $campaign['campaign_type'],
            'campaign_type_label' => $campaignTypeLabels[$campaign['campaign_type']] ?? $campaign['campaign_type'],

            'start_date' => $campaign['start_date'],
            'end_date' => $campaign['end_date'],

            'status' => $campaign['status'],
            'status_label' => $statusLabels[$campaign['status']] ?? $campaign['status'],

            'state' => [
                'is_started' => $isStarted,
                'is_ended' => $isEnded,
                'is_available' => $isAvailable
            ],

            'summary' => [
                'total_products' => (int) $campaign['total_products'],
                'total_sale_stock_limit' => (int) $campaign['total_sale_stock_limit'],
                'total_sold_quantity' => (int) $campaign['total_sold_quantity']
            ],

            'created_at' => $campaign['created_at'],
            'updated_at' => $campaign['updated_at']
        ];
    }, $campaigns);


    // 12. Trả kết quả
    sendSuccess('Lay danh sach chuong trinh khuyen mai thanh cong', [
        'campaigns' => $formattedCampaigns,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_campaigns' => $totalCampaigns,
            'total_pages' => $totalPages
        ],
        'filters' => [
            'campaign_type' => $campaignType,
            'status' => $status,
            'active_only' => $activeOnly,
            'sort' => $sort
        ]
    ]);

} catch (PDOException $e) {
    sendError('Lay danh sach chuong trinh khuyen mai that bai', 500, [
        'database' => $e->getMessage()
    ]);
}