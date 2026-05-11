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

    /**
     * Crea un nuevo usuario
     */
    public function create(array $data): int {
        $stmt = $this->pdo->prepare("
            INSERT INTO usuarios (farmacia_id, email, password_hash, nombre, rol, activo)
            VALUES (:farmacia_id, :email, :password_hash, :nombre, :rol, :activo)
        ");

        try {
            $stmt->execute([
                ':farmacia_id' => $data['farmacia_id'] ?? null,
                ':email' => $data['email'],
                ':password_hash' => $data['password_hash'],
                ':nombre' => $data['nombre'] ?? null,
                ':rol' => $data['rol'] ?? 'CLIENTE',
                ':activo' => $data['activo'] ?? 1
            ]);
        } catch (\PDOException $e) {
            // Si es error de email duplicado, lanzar excepción amigable
            if ($e->getCode() === '23000' && strpos($e->getMessage(), 'Duplicate entry') !== false) {
                throw new AuthenticationException('El email ya esta registrado');
            }
            throw $e;
        }

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Verifica si un email ya existe en la base de datos
     */
    public function existsByEmail(string $email): bool {
        $stmt = $this->pdo->prepare("SELECT 1 FROM usuarios WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        return $stmt->fetchColumn() !== false;
    }

    /**
     * Busca un usuario por email
     */
    public function findByEmail(string $email): ?array {
        $stmt = $this->pdo->prepare("
            SELECT id, farmacia_id, email, password_hash, rol, recover_token, recover_expires_at
            FROM usuarios 
            WHERE email = :email AND activo = 1
            LIMIT 1
        ");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        return $user ?: null;
    }

    /**
     * Busca un usuario por token de recuperación
     */
    public function findByRecoverToken(string $token): ?array {
        $tokenHash = hash('sha256', $token);
        $stmt = $this->pdo->prepare("
            SELECT id, farmacia_id, email, password_hash, rol, recover_token, recover_expires_at
            FROM usuarios 
            WHERE recover_token = :token AND activo = 1
            LIMIT 1
        ");
        $stmt->execute([':token' => $tokenHash]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        return $user ?: null;
    }

    /**
     * Actualiza un usuario
     */
    public function update(int $userId, array $data): bool {
        $fields = [];
        $params = [':id' => $userId];

        foreach ($data as $key => $value) {
            $fields[] = "{$key} = :{$key}";
            $params[":{$key}"] = $value;
        }

        if (empty($fields)) {
            return false;
        }

        $sql = "UPDATE usuarios SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute($params);
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
            'farmacia_id' => $user['farmacia_id'] !== null ? (int) $user['farmacia_id'] : null,
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
