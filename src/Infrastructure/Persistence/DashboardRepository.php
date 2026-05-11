<?php

declare(strict_types=1);

namespace PharmaQuick\Infrastructure\Persistence;

use PDO;
use Exception;
use Throwable;

/**
 * PharmaQuick - DashboardRepository
 * Aggregates data for the administrator dashboard.
 */
class DashboardRepository {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Get summary stats for today
     */
    public function getSummaryStats(int $farmaciaId): array {
        // 1. Sales today (Total and count) from both POS and E-commerce
        $stmtSales = $this->pdo->prepare("
            SELECT 
                SUM(total_v) as total_ventas,
                SUM(count_v) as count_ventas
            FROM (
                SELECT COALESCE(SUM(total), 0) as total_v, COUNT(*) as count_v
                FROM ventas
                WHERE farmacia_id = :farmacia_id 
                  AND estado = 'COMPLETADA'
                  AND DATE(creado_en) = CURDATE()
                
                UNION ALL
                
                SELECT COALESCE(SUM(total), 0) as total_v, COUNT(*) as count_v
                FROM pharma_master.compras_cliente
                WHERE farmacia_id = :farmacia_id_2 
                  AND estado != 'CANCELADA'
                  AND DATE(created_at) = CURDATE()
            ) as combined
        ");
        $stmtSales->execute([
            ':farmacia_id' => $farmaciaId,
            ':farmacia_id_2' => $farmaciaId
        ]);
        $salesToday = $stmtSales->fetch();

        // 2. Unique products in stock (Remain in cluster DB)
        $stmtProducts = $this->pdo->prepare("
            SELECT COUNT(DISTINCT producto_id) as total_productos
            FROM lotes
            WHERE farmacia_id = :farmacia_id 
              AND stock_actual > 0
        ");
        $stmtProducts->execute([':farmacia_id' => $farmaciaId]);
        $productCount = $stmtProducts->fetch();

        // 3. Alerts (Low stock < 10 OR Near expiry < 90 days)
        $stmtAlerts = $this->pdo->prepare("
            SELECT COUNT(*) as alert_count
            FROM (
                SELECT producto_id
                FROM lotes
                WHERE farmacia_id = :farmacia_id
                GROUP BY producto_id
                HAVING SUM(stock_actual) < 10
                
                UNION
                
                SELECT DISTINCT producto_id
                FROM lotes
                WHERE farmacia_id = :farmacia_id_2
                  AND stock_actual > 0
                  AND fecha_vencimiento IS NOT NULL
                  AND DATEDIFF(fecha_vencimiento, CURDATE()) < 90
            ) as alerts
        ");
        $stmtAlerts->execute([
            ':farmacia_id' => $farmaciaId,
            ':farmacia_id_2' => $farmaciaId
        ]);
        $alertCount = $stmtAlerts->fetch();

        return [
            'ventas_hoy' => (float)$salesToday['total_ventas'],
            'transacciones_hoy' => (int)$salesToday['count_ventas'],
            'productos_stock' => (int)$productCount['total_productos'],
            'alertas_stock' => (int)$alertCount['alert_count']
        ];
    }

    /**
     * Get sales trend for the last X days
     */
    public function getSalesTrend(int $farmaciaId, int $days = 7): array {
        $stmt = $this->pdo->prepare("
            SELECT fecha, SUM(total) as total
            FROM (
                SELECT DATE(creado_en) as fecha, total
                FROM ventas
                WHERE farmacia_id = :farmacia_id
                  AND estado = 'COMPLETADA'
                  AND creado_en >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
                
                UNION ALL
                
                SELECT DATE(created_at) as fecha, total
                FROM pharma_master.compras_cliente
                WHERE farmacia_id = :farmacia_id_2
                  AND estado != 'CANCELADA'
                  AND created_at >= DATE_SUB(CURDATE(), INTERVAL :days_2 DAY)
            ) as combined
            GROUP BY fecha
            ORDER BY fecha ASC
        ");
        
        $stmt->bindValue(':farmacia_id', $farmaciaId, PDO::PARAM_INT);
        $stmt->bindValue(':farmacia_id_2', $farmaciaId, PDO::PARAM_INT);
        $stmt->bindValue(':days', $days - 1, PDO::PARAM_INT);
        $stmt->bindValue(':days_2', $days - 1, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    /**
     * Get top selling products
     */
    public function getTopProducts(int $farmaciaId, int $limit = 5): array {
        $stmt = $this->pdo->prepare("
            SELECT 
                nombre,
                categoria,
                SUM(cantidad) as total_vendido,
                SUM(subtotal) as revenue
            FROM (
                SELECT p.nombre, p.categoria, dv.cantidad, dv.subtotal
                FROM detalle_ventas dv
                INNER JOIN ventas v ON v.id = dv.venta_id
                INNER JOIN lotes l ON l.id = dv.lote_id
                INNER JOIN productos p ON p.id = l.producto_id
                WHERE v.farmacia_id = :farmacia_id AND v.estado = 'COMPLETADA'
                
                UNION ALL
                
                SELECT cd.producto_nombre as nombre, p.categoria, cd.cantidad, cd.subtotal
                FROM pharma_master.compras_detalle cd
                INNER JOIN pharma_master.compras_cliente c ON c.id = cd.compra_id
                LEFT JOIN productos p ON p.id = cd.producto_id
                WHERE c.farmacia_id = :farmacia_id_2 AND c.estado != 'CANCELADA'
            ) as combined_details
            GROUP BY nombre, categoria
            ORDER BY total_vendido DESC
            LIMIT :limit
        ");
        
        $stmt->bindValue(':farmacia_id', $farmaciaId, PDO::PARAM_INT);
        $stmt->bindValue(':farmacia_id_2', $farmaciaId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    /**
     * Get recent transactions
     */
    public function getRecentSales(int $farmaciaId, int $limit = 5): array {
        $stmt = $this->pdo->prepare("
            SELECT * FROM (
                SELECT 
                    v.id,
                    v.cliente_nombre,
                    v.total,
                    v.estado,
                    v.creado_en
                FROM ventas v
                WHERE v.farmacia_id = :farmacia_id
                
                UNION ALL
                
                SELECT 
                    c.id,
                    u.nombre as cliente_nombre,
                    c.total,
                    c.estado,
                    c.created_at as creado_en
                FROM pharma_master.compras_cliente c
                INNER JOIN pharma_master.usuarios u ON u.id = c.usuario_id
                WHERE c.farmacia_id = :farmacia_id_2
            ) as combined
            ORDER BY creado_en DESC
            LIMIT :limit
        ");
        
        $stmt->bindValue(':farmacia_id', $farmaciaId, PDO::PARAM_INT);
        $stmt->bindValue(':farmacia_id_2', $farmaciaId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
}
