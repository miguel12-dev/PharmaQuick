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

    public function __construct(int $farmaciaId) {
        // Obtener conexion al cluster correcto
        $cluster = (int) ceil($farmaciaId / 5);
        if ($cluster < 1) $cluster = 1;
        
        $this->pdo = \PharmaQuick\Infrastructure\Persistence\PDOFactory::getCluster($cluster);
    }

    public function login(string $email, string $password): array {
        if (empty($email) || empty($password)) {
            throw new \PharmaQuick\Core\Exceptions\AuthenticationException('Email y contrasena son requeridos');
        }

        $email = trim($email);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \PharmaQuick\Core\Exceptions\AuthenticationException('Formato de email invalido');
        }

        $repo = new \PharmaQuick\Infrastructure\Persistence\UsuarioRepository($this->pdo);
        return $repo->authenticate($email, $password);
    }
}