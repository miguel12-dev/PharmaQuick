<?php

declare(strict_types=1);

/**
 * PharmaQuick - Respuestas JSON
 */

class JsonResponse {
    public static function success($data, int $statusCode = 200): void {
        self::send(['success' => true, 'data' => $data], $statusCode);
    }

    public static function error(string $message, int $statusCode = 400): void {
        self::send(['success' => false, 'message' => $message], $statusCode);
    }

    public static function authSuccess(int $farmaciaId, array $userData, string $message): void {
        self::send([
            'success' => true,
            'message' => $message,
            'farmacia_id' => $farmaciaId,
            'user' => $userData,
        ], 200);
    }

    private static function send(array $data, int $statusCode): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}