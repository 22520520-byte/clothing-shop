<?php
// =========================================================
// File: api/customer-features/spin-points.php
// Mục đích: API vòng quay may mắn cộng điểm cho khách hàng
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


// 3. Kiểm tra đăng nhập
if (empty($_SESSION['user_id'])) {
    sendError('Vui long dang nhap de quay diem may man', 401);
}

$userId = (int) $_SESSION['user_id'];


// 4. Cấu hình phần thưởng vòng quay
$rewardOptions = [
    [
        'points' => 5,
        'label' => '+5 điểm',
        'weight' => 30
    ],
    [
        'points' => 10,
        'label' => '+10 điểm',
        'weight' => 30
    ],
    [
        'points' => 20,
        'label' => '+20 điểm',
        'weight' => 20
    ],
    [
        'points' => 30,
        'label' => '+30 điểm',
        'weight' => 12
    ],
    [
        'points' => 50,
        'label' => '+50 điểm',
        'weight' => 6
    ],
    [
        'points' => 100,
        'label' => '+100 điểm',
        'weight' => 2
    ]
];


// 5. Hàm random phần thưởng theo trọng số
function getRandomReward($rewardOptions)
{
    $totalWeight = 0;

    foreach ($rewardOptions as $option) {
        $totalWeight += (int) $option['weight'];
    }

    $randomNumber = random_int(1, $totalWeight);
    $currentWeight = 0;

    foreach ($rewardOptions as $option) {
        $currentWeight += (int) $option['weight'];

        if ($randomNumber <= $currentWeight) {
            return $option;
        }
    }

    return $rewardOptions[0];
}


// 6. Kết nối database
$conn = getDatabaseConnection();

try {
    // 7. Kiểm tra user và customer profile
    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.status,

            r.code AS role_code,

            cp.id AS customer_profile_id,
            cp.membership_level,
            cp.points_balance,
            cp.total_orders,
            cp.total_spent
        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        LEFT JOIN customer_profiles cp
            ON u.id = cp.user_id
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

    if ($user['role_code'] !== 'customer') {
        sendError('Chi khach hang moi co the quay diem may man', 403);
    }

    if (empty($user['customer_profile_id'])) {
        sendError('Khong tim thay ho so khach hang', 404);
    }


    // 8. Random điểm thưởng
    $reward = getRandomReward($rewardOptions);
    $rewardPoints = (int) $reward['points'];


    // 9. Bắt đầu transaction
    $conn->beginTransaction();


    // 10. Cộng điểm vào customer_profiles
    $sql = "
        UPDATE customer_profiles
        SET
            points_balance = points_balance + :reward_points,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = :user_id_update
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':reward_points' => $rewardPoints,
        ':user_id_update' => $userId
    ]);


    // 11. Ghi lịch sử điểm
    $description = 'Thuong ' . $rewardPoints . ' diem tu vong quay may man';

    $sql = "
        INSERT INTO points_history (
            user_id,
            order_id,
            type,
            points,
            description
        )
        VALUES (
            :user_id_history,
            NULL,
            'bonus',
            :points_history,
            :description_history
        )
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_history' => $userId,
        ':points_history' => $rewardPoints,
        ':description_history' => $description
    ]);

    $pointHistoryId = (int) $conn->lastInsertId();


    // 12. Lấy lại điểm mới
    $sql = "
        SELECT
            points_balance
        FROM customer_profiles
        WHERE user_id = :user_id_select
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id_select' => $userId
    ]);

    $updatedProfile = $stmt->fetch();

    $newPointsBalance = (int) $updatedProfile['points_balance'];


    // 13. Hoàn tất transaction
    $conn->commit();


    // 14. Trả kết quả
    sendSuccess('Quay diem may man thanh cong', [
        'spin_result' => [
            'reward_points' => $rewardPoints,
            'reward_label' => $reward['label'],
            'description' => $description
        ],

        'points' => [
            'old_points_balance' => (int) ($user['points_balance'] ?? 0),
            'reward_points' => $rewardPoints,
            'new_points_balance' => $newPointsBalance
        ],

        'point_history' => [
            'id' => $pointHistoryId,
            'type' => 'bonus',
            'points' => $rewardPoints,
            'description' => $description
        ],

        'reward_options' => $rewardOptions
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    sendError('Quay diem may man that bai', 500, [
        'error' => $e->getMessage()
    ]);
}