<?php

declare(strict_types=1);

/**
 * PharmaQuick - UsuarioRepository
 */

class UsuarioRepository {
    private $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function authenticate(string $email, string $password): array {
        $stmt = $this->pdo->prepare("SELECT id, farmacia_id, email, password_hash FROM usuarios WHERE email = :email AND activo = 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            throw new AuthenticationException('Credenciales invalidas');
        }

        if (!password_verify($password, $user['password_hash'])) {
            throw new AuthenticationException('Credenciales invalidas');
        }

        return [
            'id' => (int) $user['id'],
            'farmacia_id' => (int) $user['farmacia_id'],
            'email' => $user['email'],
        ];
    }
}