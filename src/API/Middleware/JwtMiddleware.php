<?php

declare(strict_types=1);

/**
 * PharmaQuick - JWT Middleware
 *
 * Valida tokens JWT y crea contexto de autenticación
 * 
 * @version 1.0.0
 */

class JwtMiddleware {
    private JwtService $jwtService;

    public function __construct(?JwtService $jwtService = null) {
        $this->jwtService = $jwtService ?? new JwtService();
    }

    /**
     * Procesa el request y valida el JWT
     * Retorna false si no es válido (ya envía respuesta de error)
     */
    public function handle(): bool {
        $token = $this->extractToken();
        
        if (!$token) {
            JsonResponse::error('Token requerido. Usa Authorization: Bearer <token>', 401);
            return false;
        }

        $payload = $this->jwtService->validate($token);
        
        if (!$payload) {
            JsonResponse::error('Token inválido o expirado', 401);
            return false;
        }

        // Inyectar contexto de autenticación en $_REQUEST
        $_REQUEST['auth'] = [
            'sub' => $payload['sub'],
            'email' => $payload['email'],
            'farmacia_id' => $payload['farmacia_id'],
        ];

        return true;
    }

    /**
     * Extrae el token del header Authorization
     */
    private function extractToken(): ?string {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['Authorization'] ?? '';

        if (empty($authHeader)) {
            return null;
        }

        // Formato: "Bearer <token>"
        if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }
}

/**
 * Helper estático para acceso rápido al contexto de autenticación
 */
class Auth {
    /**
     * Obtiene el usuario actual autenticado
     */
    public static function user(): ?array {
        return $_REQUEST['auth'] ?? null;
    }

    /**
     * Obtiene el ID del usuario
     */
    public static function userId(): ?int {
        $auth = self::user();
        return $auth ? (int) $auth['sub'] : null;
    }

    /**
     * Obtiene el ID de la farmacia (tenant)
     */
    public static function farmaciaId(): ?int {
        $auth = self::user();
        return $auth ? (int) $auth['farmacia_id'] : null;
    }

    /**
     * Obtiene el email del usuario
     */
    public static function email(): ?string {
        $auth = self::user();
        return $auth ? $auth['email'] : null;
    }

    /**
     * Verifica si hay un usuario autenticado
     */
    public static function check(): bool {
        return self::user() !== null;
    }
}