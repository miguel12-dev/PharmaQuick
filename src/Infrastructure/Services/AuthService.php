<?php

declare(strict_types=1);

/**
 * PharmaQuick - Servicio de Autenticacion
 *
 * OPTIMIZADO: Usa singleton de JwtService yPDO
 * @version 1.1.0
 */

class AuthService
{
    private $pdo;
    private JwtService $jwtService;

    public function __construct(?int $farmaciaId = null) {
        // Usar singleton de JWT para evitar crear nuevas instancias
        $this->jwtService = JwtService::getInstance();
        
        if ($farmaciaId === null) {
            // Conexión por defecto al Master para login global
            $this->pdo = PDOFactory::getMaster();
        } else {
            // Obtener conexion al cluster correcto
            $cluster = (int) ceil($farmaciaId / 5);
            if ($cluster < 1) $cluster = 1;
            $this->pdo = PDOFactory::getCluster($cluster);
        }
    }

    public function login(string $email, string $password): array {
        if (empty($email) || empty($password)) {
            throw new AuthenticationException('Email y contrasena son requeridos');
        }

        $email = trim($email);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new AuthenticationException('Formato de email invalido');
        }

        // 1. Intentar en Master primero (ahora todos los usuarios deberían estar aquí)
        $masterPdo = PDOFactory::getMaster();
        $repo = new UsuarioRepository($masterPdo);
        
        try {
            $userData = $repo->authenticate($email, $password);
        } catch (AuthenticationException $e) {
            // 2. Si no está en Master, intentar en el cluster si se proporcionó farmaciaId
            if ($this->pdo !== $masterPdo) {
                $repo = new UsuarioRepository($this->pdo);
                $userData = $repo->authenticate($email, $password);
            } else {
                throw $e;
            }
        }

        // Generar JWT optimizado directamente
        $token = $this->jwtService->generateUserToken(
            $userData['id'],
            $userData['email'],
            $userData['farmacia_id']
        );

        return [
            'user' => $userData,
            'token' => $token,
        ];
    }

    public function register(string $email, string $password, ?string $nombre = null): array {
        if (empty($email) || empty($password)) {
            throw new AuthenticationException('Email y contrasena son requeridos');
        }

        $email = trim($email);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new AuthenticationException('Formato de email invalido');
        }

        $masterPdo = PDOFactory::getMaster();
        $repo = new UsuarioRepository($masterPdo);

        // Verificar si ya existe el email
        if ($repo->existsByEmail($email)) {
            throw new AuthenticationException('El email ya esta registrado');
        }

        // Crear hash de contraseña
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $userId = $repo->create([
            'email' => $email,
            'password_hash' => $passwordHash,
            'nombre' => $nombre,
            'rol' => 'CLIENTE',
            'farmacia_id' => null
        ]);

        return [
            'id' => $userId,
            'email' => $email,
            'rol' => 'CLIENTE'
        ];
    }

    /**
     * Solicitar recuperación de contraseña
     */
    public function requestPasswordRecovery(string $email): string|true {
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return 'Email invalido';
        }

        $email = trim($email);
        $masterPdo = PDOFactory::getMaster();
        $repo = new UsuarioRepository($masterPdo);

        // Verificar si existe el usuario
        $user = $repo->findByEmail($email);
        
        if (!$user) {
            // Por seguridad, siempre devolver éxito
            return true;
        }

        // Generar token único
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour')); // Válido por 1 hora

        // Guardar token en la base de datos
        $repo->update($user['id'], [
            'recover_token' => hash('sha256', $token),
            'recover_expires_at' => $expiresAt
        ]);

        // Enviar correo de recuperación
        $emailService = new EmailService();
        $emailService->sendPasswordRecoveryEmail($email, $token);

        return true;
    }

    /**
     * Restablecer contraseña con token
     */
    public function resetPassword(string $token, string $newPassword): string|true {
        if (empty($token)) {
            return 'Token requerido';
        }

        if (strlen($newPassword) < 6) {
            return 'La contrasena debe tener al menos 6 caracteres';
        }

        $masterPdo = PDOFactory::getMaster();
        $repo = new UsuarioRepository($masterPdo);

        // Buscar usuario por token
        $user = $repo->findByRecoverToken($token);

        if (!$user) {
            return 'Token invalido o expirado';
        }

        // Verificar si el token ha expirado
        if (strtotime($user['recover_expires_at']) < time()) {
            // Limpiar token expirado
            $repo->update($user['id'], [
                'recover_token' => null,
                'recover_expires_at' => null
            ]);
            return 'Token expirado';
        }

        // Actualizar contraseña
        $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);
        
        $repo->update($user['id'], [
            'password_hash' => $passwordHash,
            'recover_token' => null,
            'recover_expires_at' => null
        ]);

        return true;
    }
}