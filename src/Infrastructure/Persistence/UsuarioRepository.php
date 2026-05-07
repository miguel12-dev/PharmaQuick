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
        // Consulta optimizada - buscar solo campos necesarios
        $stmt = $this->pdo->prepare("SELECT id, farmacia_id, email, password_hash, rol FROM usuarios WHERE email = :email AND activo = 1 LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            throw new AuthenticationException('Credenciales invalidas');
        }

        // password_verify es costoso computacionalmente
        if (!password_verify($password, $user['password_hash'])) {
            throw new AuthenticationException('Credenciales invalidas');
        }

        return [
            'id' => (int) $user['id'],
            'farmacia_id' => (int) $user['farmacia_id'],
            'email' => $user['email'],
            'rol' => $user['rol'] ?? 'USUARIO',
        ];
    }

    /**
     * Busca un usuario por ID (para obtener rol en middleware)
     * Incluye activo para verificar estado
     */
    public function findById(int $userId): ?array {
        $stmt = $this->pdo->prepare("
            SELECT id, farmacia_id, email, rol, activo 
            FROM usuarios 
            WHERE id = :id
        ");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        return $user ?: null;
    }

    public function findProfileById(int $userId): ?array {
        $stmt = $this->pdo->prepare("
            SELECT id, farmacia_id, email, rol, activo
            FROM usuarios
            WHERE id = :id
        ");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        return $user ?: null;
    }

    public function updatePassword(int $userId, string $passwordHash): bool {
        $stmt = $this->pdo->prepare("
            UPDATE usuarios
            SET password_hash = :password_hash
            WHERE id = :id AND activo = 1
        ");

        return $stmt->execute([
            ':id' => $userId,
            ':password_hash' => $passwordHash,
        ]);
    }

    public function findFarmaciaNameById(int $farmaciaId): ?string {
        $queries = [
            "SELECT nombre FROM farmacias WHERE id = :id",
            "SELECT nombre_farmacia AS nombre FROM farmacias WHERE id = :id",
            "SELECT razon_social AS nombre FROM farmacias WHERE id = :id",
        ];

        foreach ($queries as $sql) {
            try {
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([':id' => $farmaciaId]);
                $value = $stmt->fetchColumn();
                if (is_string($value) && trim($value) !== '') {
                    return trim($value);
                }
            } catch (\Throwable $e) {
                continue;
            }
        }

        return null;
    }
}
