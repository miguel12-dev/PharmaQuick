<?php

declare(strict_types=1);

/**
 * PharmaQuick - ProductoRepository
 *
 * Repositorio para operaciones de productos con aislamiento multi-tenant
 * 
 * @version 1.0.1
 * 
 * Schema real:
 * - productos: id, nombre, codigo_barras, descripcion, categoria, presentacion, activo
 * - lotes: id, producto_id, farmacia_id, ..., stock_actual (FEFO)
 * 
 * NOTA: productos es catálogo GLOBAL, se filtra por farmacia_id desde lotes
 */

class ProductoRepository {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Obtiene productos activos de una farmacia (JOIN con lotes)
     */
    public function findAllByFarmacia(int $farmaciaId): array {
        $stmt = $this->pdo->prepare("
            SELECT DISTINCT 
                p.id,
                p.nombre,
                p.codigo_barras AS codigo,
                p.descripcion,
                p.categoria,
                p.presentacion,
                p.activo,
                SUM(l.stock_actual) AS stock_total
            FROM productos p
            INNER JOIN lotes l ON p.id = l.producto_id
            WHERE l.farmacia_id = :farmacia_id 
                AND p.activo = 1
                AND l.stock_actual > 0
            GROUP BY p.id, p.nombre, p.codigo_barras, p.descripcion, p.categoria, p.presentacion, p.activo
            ORDER BY p.nombre ASC
        ");
        $stmt->execute([':farmacia_id' => $farmaciaId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Busca un producto por ID (con filtro de farmacia via lote)
     */
    public function findById(int $productoId, int $farmaciaId): ?array {
        $stmt = $this->pdo->prepare("
            SELECT DISTINCT
                p.id,
                p.nombre,
                p.codigo_barras AS codigo,
                p.descripcion,
                p.categoria,
                p.presentacion,
                p.activo,
                SUM(l.stock_actual) AS stock_total
            FROM productos p
            INNER JOIN lotes l ON p.id = l.producto_id
            WHERE p.id = :id 
                AND l.farmacia_id = :farmacia_id 
                AND p.activo = 1
            GROUP BY p.id, p.nombre, p.codigo_barras, p.descripcion, p.categoria, p.presentacion, p.activo
        ");
        $stmt->execute([':id' => $productoId, ':farmacia_id' => $farmaciaId]);
        $producto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $producto ?: null;
    }

    /**
     * Busca productos por nombre o código de barras
     */
    public function search(string $query, int $farmaciaId): array {
        $stmt = $this->pdo->prepare("
            SELECT DISTINCT
                p.id,
                p.nombre,
                p.codigo_barras AS codigo,
                p.descripcion,
                p.categoria,
                p.presentacion,
                p.activo,
                SUM(l.stock_actual) AS stock_total
            FROM productos p
            INNER JOIN lotes l ON p.id = l.producto_id
            WHERE l.farmacia_id = :farmacia_id 
                AND p.activo = 1
                AND l.stock_actual > 0
                AND (p.nombre LIKE :query OR p.codigo_barras LIKE :query)
            GROUP BY p.id, p.nombre, p.codigo_barras, p.descripcion, p.categoria, p.presentacion, p.activo
            ORDER BY p.nombre ASC
            LIMIT 50
        ");
        
        $searchTerm = "%{$query}%";
        $stmt->execute([
            ':farmacia_id' => $farmaciaId,
            ':query' => $searchTerm
        ]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}