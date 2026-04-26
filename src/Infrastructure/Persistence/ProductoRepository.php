<?php

declare(strict_types=1);

/**
 * PharmaQuick - ProductoRepository
 *
 * Repositorio para operaciones de productos con aislamiento multi-tenant
 * 
 * @version 1.0.0
 */

class ProductoRepository {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Obtiene todos los productos de una farmacia
     */
    public function findAllByFarmacia(int $farmaciaId): array {
        $stmt = $this->pdo->prepare("
            SELECT id, codigo, nombre, descripcion, precio, stock_minimo, activo, categoria
            FROM productos 
            WHERE farmacia_id = :farmacia_id AND activo = 1
            ORDER BY nombre ASC
        ");
        $stmt->execute([':farmacia_id' => $farmaciaId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Busca un producto por ID (con filtro de farmacia)
     */
    public function findById(int $productoId, int $farmaciaId): ?array {
        $stmt = $this->pdo->prepare("
            SELECT id, codigo, nombre, descripcion, precio, stock_minimo, activo, categoria
            FROM productos 
            WHERE id = :id AND farmacia_id = :farmacia_id AND activo = 1
        ");
        $stmt->execute([':id' => $productoId, ':farmacia_id' => $farmaciaId]);
        $producto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $producto ?: null;
    }

    /**
     * Busca productos por nombre o código
     */
    public function search(string $query, int $farmaciaId): array {
        $stmt = $this->pdo->prepare("
            SELECT id, codigo, nombre, descripcion, precio, stock_minimo, activo, categoria
            FROM productos 
            WHERE farmacia_id = :farmacia_id 
                AND activo = 1 
                AND (nombre LIKE :query OR codigo LIKE :query)
            ORDER BY nombre ASC
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