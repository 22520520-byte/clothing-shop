<?php
// =========================================================
// File: helpers/response.php
// Mục đích: Trả JSON thống nhất cho toàn bộ API
// =========================================================


// 1. Trả JSON thành công
function sendSuccess($message = 'Thanh cong', $data = null, $statusCode = 200)
{
    http_response_code($statusCode);

    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


// 2. Trả JSON lỗi
function sendError($message = 'Co loi xay ra', $statusCode = 400, $errors = null)
{
    http_response_code($statusCode);

    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'success' => false,
        'message' => $message,
        'errors' => $errors
    ], JSON_UNESCAPED_UNICODE);

    exit;
}