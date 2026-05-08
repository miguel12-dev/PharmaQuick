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

        // Obtener el ROL desde la base de datos (no desde JWT)
        // y verificar que el usuario esté activo
        // pharmacy_id puede ser null para clientes globales
        $farmaciaId = isset($payload['farmacia_id']) ? (int)$payload['farmacia_id'] : null;
        $userData = $this->obtenerRol($payload['sub'], $farmaciaId);
        
        // Si usuario no está activo o no existe, denegar acceso
        if (!$userData) {
            JsonResponse::error('Usuario inactivo o no encontrado. Contacte al administrador.', 401);
            return false;
        }
        
        // Inyectar contexto de autenticación en $_REQUEST
        // pharmacy_id puede ser null para clientes (rol CLIENTE)
        $_REQUEST['auth'] = [
            'sub' => $payload['sub'],
            'email' => $payload['email'],
            'farmacia_id' => $farmaciaId,
            'rol' => $userData['rol'], // Rol basado en BD y verificado activo
        ];

        return true;
    }

    /**
     * Obtiene el rol del usuario desde la base de datos
     * Verifica que el usuario esté activo
     * 
     * @param int|null $farmaciaId Puede ser null para clientes globales
     */
    private function obtenerRol(int $userId, ?int $farmaciaId = null): ?array {
        try {
            // Siempre consultar Master para roles (source of truth)
            require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
            require_once SRC_PATH . '/Infrastructure/Persistence/UsuarioRepository.php';
            
            $pdo = PDOFactory::getMaster();
            $repo = new UsuarioRepository($pdo);
            $user = $repo->findById($userId);
            
            // Si no está en Master, probar en el cluster solo si tiene farmacia (no clientes)
            if (!$user && $farmaciaId !== null && $farmaciaId > 0) {
                $cluster = (int) ceil($farmaciaId / 5);
                if ($cluster < 1) $cluster = 1;
                $pdoCluster = PDOFactory::getCluster($cluster);
                $repoCluster = new UsuarioRepository($pdoCluster);
                $user = $repoCluster->findById($userId);
            }
            
            // Si usuario no existe o está inactivo, retornar null
            if (!$user || !isset($user['activo']) || !$user['activo']) {
                return null;
            }
            
            return [
                'rol' => $user['rol'] ?? 'USUARIO',
                'activo' => (bool) $user['activo'],
            ];
        } catch (\Throwable $e) {
            return null;
        }
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
     * Retorna null para clientes globales sin farmacia
     */
    public static function farmaciaId(): ?int {
        $auth = self::user();
        if (!$auth || !isset($auth['farmacia_id']) || $auth['farmacia_id'] === null) {
            return null;
        }
        return (int) $auth['farmacia_id'];
    }

    /**
     * Obtiene el email del usuario
     */
    public static function email(): ?string {
        $auth = self::user();
        return $auth ? $auth['email'] : null;
    }

    /**
     * Obtiene el rol del usuario (desde BD)
     */
    public static function rol(): ?string {
        $auth = self::user();
        return $auth ? ($auth['rol'] ?? 'USUARIO') : null;
    }

    /**
     * Verifica si el usuario es ADMINISTRADOR
     */
    public static function isAdmin(): bool {
        return self::rol() === 'ADMINISTRADOR';
    }

    /**
     * Verifica si hay un usuario autenticado
     */
    public static function check(): bool {
        return self::user() !== null;
    }
}