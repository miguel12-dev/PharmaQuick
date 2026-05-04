<?php

declare(strict_types=1);

namespace PharmaQuick\Infrastructure\Persistence;

use PDO;

/**
 * PharmaQuick - LoteRepository
 */
class LoteRepository {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function findById(int $id, int $farmaciaId): ?array {
        $stmt = $this->pdo->prepare("
            SELECT id, producto_id, farmacia_id, codigo_lote, fecha_vencimiento, costo_unitario, stock_actual, stock_reservado
            FROM lotes
            WHERE id = :id AND farmacia_id = :farmacia_id
            LIMIT 1
        ");
        $stmt->execute([':id' => $id, ':farmacia_id' => $farmaciaId]);
        $lote = $stmt->fetch(PDO::FETCH_ASSOC);
        return $lote ?: null;
    }

    public function findByUniqueKey(int $productoId, int $farmaciaId, string $codigoLote): ?array {
        $stmt = $this->pdo->prepare("
            SELECT id, producto_id, farmacia_id, codigo_lote, fecha_vencimiento, costo_unitario, stock_actual, stock_reservado
            FROM lotes
            WHERE producto_id = :producto_id 
              AND farmacia_id = :farmacia_id 
              AND codigo_lote = :codigo_lote
            LIMIT 1
        ");
        $stmt->execute([
            ':producto_id' => $productoId,
            ':farmacia_id' => $farmaciaId,
            ':codigo_lote' => $codigoLote
        ]);
        $lote = $stmt->fetch(PDO::FETCH_ASSOC);
        return $lote ?: null;
    }

    public function upsert(array $data): int {
        $lote = $this->findByUniqueKey(
            (int)$data['producto_id'], 
            (int)$data['farmacia_id'], 
            (string)$data['codigo_lote']
        );

        if ($lote) {
            // Actualizar metadata si cambió (vencimiento o costo)
            $stmt = $this->pdo->prepare("
                UPDATE lotes 
                SET fecha_vencimiento = :fecha_vencimiento,
                    costo_unitario = :costo_unitario
                WHERE id = :id
            ");
            $stmt->execute([
                ':id' => $lote['id'],
                ':fecha_vencimiento' => (!empty($data['fecha_vencimiento'])) ? $data['fecha_vencimiento'] : $lote['fecha_vencimiento'],
                ':costo_unitario' => $data['costo_unitario'] ?? $lote['costo_unitario'],
            ]);
            return (int)$lote['id'];
        }

        $stmt = $this->pdo->prepare("
            INSERT INTO lotes (producto_id, farmacia_id, codigo_lote, fecha_vencimiento, costo_unitario, stock_actual, stock_reservado)
            VALUES (:producto_id, :farmacia_id, :codigo_lote, :fecha_vencimiento, :costo_unitario, 0, 0)
        ");
        $stmt->execute([
            ':producto_id' => $data['producto_id'],
            ':farmacia_id' => $data['farmacia_id'],
            ':codigo_lote' => $data['codigo_lote'],
            ':fecha_vencimiento' => (!empty($data['fecha_vencimiento'])) ? $data['fecha_vencimiento'] : null,
            ':costo_unitario' => $data['costo_unitario'] ?? 0,
        ]);

        return (int)$this->pdo->lastInsertId();
    }
}
