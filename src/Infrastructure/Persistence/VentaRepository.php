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

    public function topProductosByFarmacia(int $farmaciaId, int $limit = 10, ?int $days = null): array {
        $dateFilter = "";
        $params = [
            ':farmacia_id' => $farmaciaId,
            ':farmacia_id_2' => $farmaciaId,
            ':farmacia_id_3' => $farmaciaId,
        ];
        
        if ($days !== null) {
            $dateFilter = "AND v.creado_en >= DATE_SUB(NOW(), INTERVAL :days DAY)";
            $params[':days'] = $days;
        }

        // Sanitize limit (cast to int to avoid PDO issues with LIMIT parameter)
        $limit = (int) $limit;
        if ($limit < 1) $limit = 10;
        if ($limit > 100) $limit = 100;

        $sql = "
            SELECT 
                p.id, p.nombre, p.presentacion, p.categoria, p.imagen,
                COALESCE(
                    (SELECT pr.precio FROM precios pr WHERE pr.producto_id = p.id AND pr.farmacia_id = :farmacia_id_2 AND pr.activo = 1 ORDER BY pr.id DESC LIMIT 1),
                    0
                ) as precio_activo,
                COALESCE(
                    (SELECT SUM(l_sub.stock_actual) FROM lotes l_sub WHERE l_sub.producto_id = p.id AND l_sub.farmacia_id = :farmacia_id_3),
                    0
                ) as stock_total,
                SUM(dv.cantidad) as unidades_vendidas
            FROM detalle_ventas dv
            INNER JOIN ventas v ON v.id = dv.venta_id
            INNER JOIN lotes l ON l.id = dv.lote_id
            INNER JOIN productos p ON p.id = l.producto_id
            WHERE v.farmacia_id = :farmacia_id AND v.estado = 'COMPLETADA'
            $dateFilter
            GROUP BY p.id, p.nombre, p.presentacion, p.categoria, p.imagen
            ORDER BY unidades_vendidas DESC
            LIMIT $limit
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }
}
