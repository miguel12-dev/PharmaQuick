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
        $columns = $this->resolveColumns();
        $descripcionCol = $columns['descripcion'];

        $stmt = $this->pdo->prepare("
            INSERT INTO movimientos_inventario (lote_id, farmacia_id, usuario_id, tipo, cantidad, {$descripcionCol})
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

    private function resolveColumns(): array {
        static $cache = null;
        if (is_array($cache)) {
            return $cache;
        }

        $stmt = $this->pdo->query("SHOW COLUMNS FROM movimientos_inventario");
        $cols = array_map(static fn(array $r): string => (string)$r['Field'], $stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
        $cache = [
            'descripcion' => in_array('observaciones', $cols, true) ? 'observaciones' : 'descripcion',
        ];

        return $cache;
    }
}
