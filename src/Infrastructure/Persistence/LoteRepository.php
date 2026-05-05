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
        $lote = null;
        $farmaciaId = (int)$data['farmacia_id'];
        $productoId = (int)$data['producto_id'];

        // 1. Intentar por ID si se proporciona
        if (!empty($data['id'])) {
            $lote = $this->findById((int)$data['id'], $farmaciaId);
        }

        // 2. Intentar por llave única (producto, farmacia, lote) si no se encontró por ID
        if (!$lote && !empty($data['codigo_lote'])) {
            $lote = $this->findByUniqueKey($productoId, $farmaciaId, (string)$data['codigo_lote']);
        }

        if ($lote) {
            // Actualizar metadata
            $fields = [];
            $params = [':id' => $lote['id']];

            if (isset($data['codigo_lote'])) {
                $fields[] = "codigo_lote = :codigo_lote";
                $params[':codigo_lote'] = $data['codigo_lote'];
            }
            if (isset($data['fecha_vencimiento'])) {
                $fields[] = "fecha_vencimiento = :fecha_vencimiento";
                $params[':fecha_vencimiento'] = !empty($data['fecha_vencimiento']) ? $data['fecha_vencimiento'] : null;
            }
            if (isset($data['costo_unitario'])) {
                $fields[] = "costo_unitario = :costo_unitario";
                $params[':costo_unitario'] = $data['costo_unitario'];
            }

            if (!empty($fields)) {
                $sql = "UPDATE lotes SET " . implode(', ', $fields) . " WHERE id = :id";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute($params);
            }

            return (int)$lote['id'];
        }

        // 3. Crear nuevo si no existe
        $stmt = $this->pdo->prepare("
            INSERT INTO lotes (producto_id, farmacia_id, codigo_lote, fecha_vencimiento, costo_unitario, stock_actual, stock_reservado)
            VALUES (:producto_id, :farmacia_id, :codigo_lote, :fecha_vencimiento, :costo_unitario, 0, 0)
        ");
        $stmt->execute([
            ':producto_id' => $productoId,
            ':farmacia_id' => $farmaciaId,
            ':codigo_lote' => $data['codigo_lote'] ?? 'AJUSTE',
            ':fecha_vencimiento' => (!empty($data['fecha_vencimiento'])) ? $data['fecha_vencimiento'] : null,
            ':costo_unitario' => $data['costo_unitario'] ?? 0,
        ]);

        return (int)$this->pdo->lastInsertId();
    }
}
