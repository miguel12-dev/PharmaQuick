<?php

declare(strict_types=1);

/**
 * PharmaQuick - PrecioRepository
 *
 * Repositorio para operaciones de precios con aislamiento multi-tenant
 * 
 * @version 1.0.0
 */

class PrecioRepository {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Busca un precio por ID (verificando que pertenezca a la farmacia)
     */
    public function findById(int $precioId, int $farmaciaId): ?array {
        $stmt = $this->pdo->prepare("
            SELECT id, producto_id, farmacia_id, precio, activo
            FROM precios
            WHERE id = :id 
                AND farmacia_id = :farmacia_id
        ");
        
        $stmt->execute([
            ':id' => $precioId,
            ':farmacia_id' => $farmaciaId,
        ]);
        
        $precio = $stmt->fetch(PDO::FETCH_ASSOC);
        return $precio ?: null;
    }

    /**
     * Crea un nuevo precio para un producto/farmacia
     */
    public function create(int $productoId, int $farmaciaId, float $precio, bool $activo = false): int {
        $stmt = $this->pdo->prepare("
            INSERT INTO precios (producto_id, farmacia_id, precio, activo)
            VALUES (:producto_id, :farmacia_id, :precio, :activo)
        ");
        
        $stmt->execute([
            ':producto_id' => $productoId,
            ':farmacia_id' => $farmaciaId,
            ':precio' => $precio,
            ':activo' => $activo ? 1 : 0,
        ]);
        
        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Busca precio activo de un producto en una farmacia
     */
    public function findActiveByProducto(int $productoId, int $farmaciaId): ?array {
        $stmt = $this->pdo->prepare("
            SELECT id, producto_id, farmacia_id, precio, activo
            FROM precios
            WHERE producto_id = :producto_id 
                AND farmacia_id = :farmacia_id 
                AND activo = 1
        ");
        
        $stmt->execute([
            ':producto_id' => $productoId,
            ':farmacia_id' => $farmaciaId,
        ]);
        
        $precio = $stmt->fetch(PDO::FETCH_ASSOC);
        return $precio ?: null;
    }

    /**
     * Busca TODOS los precios de un producto en una farmacia
     */
    public function findAllByProducto(int $productoId, int $farmaciaId): array {
        $stmt = $this->pdo->prepare("
            SELECT id, producto_id, farmacia_id, precio, activo
            FROM precios
            WHERE producto_id = :producto_id 
                AND farmacia_id = :farmacia_id
            ORDER BY activo DESC, id DESC
        ");
        
        $stmt->execute([
            ':producto_id' => $productoId,
            ':farmacia_id' => $farmaciaId,
        ]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Desactiva todos los precios de un producto/farmacia
     */
    public function deactivateAll(int $productoId, int $farmaciaId): int {
        $stmt = $this->pdo->prepare("
            UPDATE precios 
            SET activo = 0
            WHERE producto_id = :producto_id 
                AND farmacia_id = :farmacia_id
        ");
        
        $stmt->execute([
            ':producto_id' => $productoId,
            ':farmacia_id' => $farmaciaId,
        ]);
        
        return $stmt->rowCount();
    }

    /**
     * Activa un precio específico (desactivando los demás)
     */
    public function activate(int $precioId, int $productoId, int $farmaciaId): bool {
        // Primero desactivar todos los demás
        $this->deactivateAll($productoId, $farmaciaId);
        
        // Luego activar el específico
        $stmt = $this->pdo->prepare("
            UPDATE precios 
            SET activo = 1
            WHERE id = :id 
                AND producto_id = :producto_id 
                AND farmacia_id = :farmacia_id
        ");
        
        $stmt->execute([
            ':id' => $precioId,
            ':producto_id' => $productoId,
            ':farmacia_id' => $farmaciaId,
        ]);
        
        return $stmt->rowCount() > 0;
    }

    /**
     * Actualiza un precio existente
     */
    public function update(int $precioId, int $farmaciaId, float $precio): bool {
        $stmt = $this->pdo->prepare("
            UPDATE precios 
            SET precio = :precio
            WHERE id = :id 
                AND farmacia_id = :farmacia_id
        ");
        
        $stmt->execute([
            ':id' => $precioId,
            ':farmacia_id' => $farmaciaId,
            ':precio' => $precio,
        ]);
        
        return $stmt->rowCount() > 0;
    }

    /**
     * Elimina un precio (solo si pertenece a la farmacia)
     */
    public function delete(int $precioId, int $farmaciaId): bool {
        $stmt = $this->pdo->prepare("
            DELETE FROM precios 
            WHERE id = :id 
                AND farmacia_id = :farmacia_id
        ");
        
        $stmt->execute([
            ':id' => $precioId,
            ':farmacia_id' => $farmaciaId,
        ]);
        
        return $stmt->rowCount() > 0;
    }

    /**
     * Obtiene precios con detalles de producto (para listados)
     */
    public function findWithProductoByFarmacia(int $farmaciaId): array {
        $stmt = $this->pdo->prepare("
            SELECT 
                pr.id,
                pr.producto_id,
                pr.farmacia_id,
                pr.precio,
                pr.activo,
                p.nombre AS producto_nombre,
                p.codigo_barras AS producto_codigo
            FROM precios pr
            INNER JOIN productos p ON pr.producto_id = p.id
            WHERE pr.farmacia_id = :farmacia_id
            ORDER BY p.nombre ASC, pr.activo DESC
        ");
        
        $stmt->execute([':farmacia_id' => $farmaciaId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}