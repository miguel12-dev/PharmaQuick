<?php

declare(strict_types=1);

namespace PharmaQuick\Infrastructure\Persistence;

use PDO;
use Exception;
use Throwable;

class VentaRepository {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare("
            INSERT INTO ventas (farmacia_id, usuario_id, cliente_nombre, cliente_documento, total, descuento, estado)
            VALUES (:farmacia_id, :usuario_id, :cliente_nombre, :cliente_documento, :total, :descuento, :estado)
        ");

        $stmt->execute([
            ':farmacia_id' => $data['farmacia_id'],
            ':usuario_id' => $data['usuario_id'],
            ':cliente_nombre' => $data['cliente_nombre'] ?? null,
            ':cliente_documento' => $data['cliente_documento'] ?? null,
            ':total' => $data['total'],
            ':descuento' => $data['descuento'] ?? 0,
            ':estado' => $data['estado'] ?? 'COMPLETADA'
        ]);

        return (int)$this->pdo->lastInsertId();
    }

    public function createDetalle(array $detalleData): int {
        $stmt = $this->pdo->prepare("
            INSERT INTO detalle_ventas (venta_id, lote_id, cantidad, precio, subtotal)
            VALUES (:venta_id, :lote_id, :cantidad, :precio, :subtotal)
        ");

        $stmt->execute([
            ':venta_id' => $detalleData['venta_id'],
            ':lote_id' => $detalleData['lote_id'],
            ':cantidad' => $detalleData['cantidad'],
            ':precio' => $detalleData['precio'],
            ':subtotal' => $detalleData['subtotal']
        ]);

        return (int)$this->pdo->lastInsertId();
    }

    public function getVentasByFarmacia(int $farmaciaId, int $limit = 50, int $offset = 0): array {
        $stmt = $this->pdo->prepare("
            SELECT v.id, v.cliente_nombre, v.cliente_documento, v.total, v.descuento, v.estado, v.creado_en, u.nombre as vendedor
            FROM ventas v
            LEFT JOIN usuarios u ON u.id = v.usuario_id
            WHERE v.farmacia_id = :farmacia_id
            ORDER BY v.creado_en DESC
            LIMIT :limit OFFSET :offset
        ");
        
        $stmt->bindValue(':farmacia_id', $farmaciaId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function getDetallesByVenta(int $ventaId): array {
        $stmt = $this->pdo->prepare("
            SELECT dv.id, dv.cantidad, dv.precio, dv.subtotal, l.codigo_lote, p.nombre as producto
            FROM detalle_ventas dv
            INNER JOIN lotes l ON l.id = dv.lote_id
            INNER JOIN productos p ON p.id = l.producto_id
            WHERE dv.venta_id = :venta_id
        ");
        
        $stmt->execute([':venta_id' => $ventaId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }
}
