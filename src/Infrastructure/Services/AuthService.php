<?php

declare(strict_types=1);

/**
 * PharmaQuick - Servicio de Autenticacion
 *
 * @version 1.0.0
 */

/**
 * Servicio de autenticacion.
 */
class AuthService
{
    private $pdo;
    private JwtService $jwtService;

    public function __construct(int $farmaciaId) {
        // Obtener conexion al cluster correcto
        $cluster = (int) ceil($farmaciaId / 5);
        if ($cluster < 1) $cluster = 1;
        
        $this->pdo = PDOFactory::getCluster($cluster);
        $this->jwtService = new JwtService();
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

        // Generar JWT con datos del usuario
        $jwtPayload = [
            'sub' => $userData['id'],
            'email' => $userData['email'],
            'farmacia_id' => $userData['farmacia_id'],
        ];

        $token = $this->jwtService->generate($jwtPayload);

        return [
            'user' => $userData,
            'token' => $token,
        ];
    }
}