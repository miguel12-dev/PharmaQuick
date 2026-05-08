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

        // Verificar si ya existe
        try {
            $existing = $repo->authenticate($email, 'dummy');
            throw new AuthenticationException('El email ya esta registrado');
        } catch (AuthenticationException $e) {
            if ($e->getMessage() === 'El email ya esta registrado') {
                throw $e;
            }
            // OK, no existe o password dummy falló (que es lo esperado)
            // Pero authenticate lanza 'Credenciales invalidas' si no existe.
        }

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
}