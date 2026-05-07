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

    public function __construct(int $farmaciaId) {
        // Usar singleton de JWT para evitar crear nuevas instancias
        $this->jwtService = JwtService::getInstance();
        
        // Obtener conexion al cluster correcto
        $cluster = (int) ceil($farmaciaId / 5);
        if ($cluster < 1) $cluster = 1;
        
        $this->pdo = PDOFactory::getCluster($cluster);
    }

    public function login(string $email, string $password): array {
        if (empty($email) || empty($password)) {
            throw new AuthenticationException('Email y contrasena son requeridos');
        }

        $email = trim($email);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new AuthenticationException('Formato de email invalido');
        }

        $repo = new UsuarioRepository($this->pdo);
        $userData = $repo->authenticate($email, $password);

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
}