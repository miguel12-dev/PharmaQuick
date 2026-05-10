<?php

declare(strict_types=1);

namespace PharmaQuick\Infrastructure\Persistence;

use PDO;
use Exception;

class ReservaRepository {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare("
            INSERT INTO reservas (farmacia_id, cliente_id, lote_id, cantidad, estado, fecha_expiracion)
            VALUES (:farmacia_id, :cliente_id, :lote_id, :cantidad, :estado, :fecha_expiracion)
        ");

        $stmt->execute([
            ':farmacia_id' => $data['farmacia_id'],
            ':cliente_id' => $data['cliente_id'] ?? null,
            ':lote_id' => $data['lote_id'],
            ':cantidad' => $data['cantidad'],
            ':estado' => $data['estado'] ?? 'ACTIVA',
            ':fecha_expiracion' => $data['fecha_expiracion']
        ]);

        return (int)$this->pdo->lastInsertId();
    }

    public function updateEstado(int $id, int $farmaciaId, string $estado): bool {
        $stmt = $this->pdo->prepare("
            UPDATE reservas 
            SET estado = :estado 
            WHERE id = :id AND farmacia_id = :farmacia_id
        ");

        $stmt->execute([
            ':estado' => $estado,
            ':id' => $id,
            ':farmacia_id' => $farmaciaId
        ]);

        return $stmt->rowCount() > 0;
    }

    public function getActivasByFarmacia(int $farmaciaId): array {
        $stmt = $this->pdo->prepare("
            SELECT r.id, r.lote_id, r.cantidad, r.estado, r.fecha_expiracion, l.codigo_lote, p.nombre as producto
            FROM reservas r
            INNER JOIN lotes l ON l.id = r.lote_id
            INNER JOIN productos p ON p.id = l.producto_id
            WHERE r.farmacia_id = :farmacia_id AND r.estado = 'ACTIVA'
            ORDER BY r.fecha_expiracion ASC
        ");

        $stmt->execute([':farmacia_id' => $farmaciaId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function expireReservasPasadas(): int {
        $stmt = $this->pdo->prepare("
            SELECT id, lote_id, cantidad, farmacia_id
            FROM reservas 
            WHERE estado = 'ACTIVA' AND fecha_expiracion <= NOW()
        ");
        $stmt->execute();
        $expiradas = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $count = 0;
        foreach ($expiradas as $res) {
            // Update the state
            $upd = $this->pdo->prepare("UPDATE reservas SET estado = 'EXPIRADA' WHERE id = ?");
            if ($upd->execute([$res['id']])) {
                // Return stock from reserved to actual via LIBERACION in Kardex.
                // Wait, this should be done in the Service, not Repository, because the Service controls the Movimientos.
            }
            $count++;
        }
        return $count;
    }
    
    public function getReservasExpiradasParaCron(): array {
        $stmt = $this->pdo->prepare("
            SELECT id, lote_id, cantidad, farmacia_id
            FROM reservas 
            WHERE estado = 'ACTIVA' AND fecha_expiracion <= NOW()
        ");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }
}
