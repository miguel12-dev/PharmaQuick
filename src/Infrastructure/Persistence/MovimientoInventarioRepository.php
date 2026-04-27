<?php

declare(strict_types=1);

namespace PharmaQuick\Infrastructure\Persistence;

use PDO;

/**
 * PharmaQuick - MovimientoInventarioRepository
 */
class MovimientoInventarioRepository {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare("
            INSERT INTO movimientos_inventario (lote_id, farmacia_id, usuario_id, tipo, cantidad, descripcion)
            VALUES (:lote_id, :farmacia_id, :usuario_id, :tipo, :cantidad, :descripcion)
        ");
        $stmt->execute([
            ':lote_id' => $data['lote_id'],
            ':farmacia_id' => $data['farmacia_id'],
            ':usuario_id' => $data['usuario_id'],
            ':tipo' => $data['tipo'],
            ':cantidad' => $data['cantidad'],
            ':descripcion' => $data['descripcion'] ?? null,
        ]);

        return (int)$this->pdo->lastInsertId();
    }
}
