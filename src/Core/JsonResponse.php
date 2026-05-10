<?php

declare(strict_types=1);

/**
 * PharmaQuick - Respuestas JSON
 */

class JsonResponse {
    public static function success($data, $message = null, int $statusCode = 200): void {
        $response = ['success' => true, 'data' => $data];
        if ($message !== null) {
            $response['message'] = $message;
        }
        self::send($response, $statusCode);
    }

    public static function error(string $message, int $statusCode = 400): void {
        self::send(['success' => false, 'message' => $message], $statusCode);
    }

    public static function authSuccess(int $farmaciaId, array $userData, string $token, string $message): void {
        // Estructura compatible con el frontend existente
        self::send([
            'success' => true,
            'message' => $message,
            'data' => [
                'usuario' => $userData,
                'farmacia_id' => $farmaciaId,
                'token' => $token,
            ]
        ], 200);
    }

    private static function send(array $data, int $statusCode): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        $json = json_encode(
            $data,
            JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
        );

        if ($json === false) {
            $fallback = [
                'success' => false,
                'message' => 'Error interno serializando respuesta JSON',
            ];
            $json = json_encode($fallback, JSON_UNESCAPED_UNICODE) ?: '{"success":false,"message":"Error interno"}';
        }

        echo $json;
        exit;
    }
}
