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
     * Obtiene productos activos de una farmacia (incluye sin stock)
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
                p.imagen,
                COALESCE(SUM(l.stock_actual), 0) AS stock_total,
                pr.precio AS precio_activo,
                pr.id AS precio_id
            FROM productos p
            LEFT JOIN lotes l ON p.id = l.producto_id AND l.farmacia_id = :farmacia_id
            LEFT JOIN precios pr ON p.id = pr.producto_id AND pr.farmacia_id = :farmacia_id AND pr.activo = 1
            WHERE p.activo = 1
            GROUP BY p.id, p.nombre, p.codigo_barras, p.descripcion, p.categoria, p.presentacion, p.activo, p.imagen, pr.precio, pr.id
            ORDER BY p.nombre ASC
        ");
        $stmt->execute([':farmacia_id' => $farmaciaId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Busca un producto por ID (con filtro de farmacia via lote)
     */
    public function findById(int $productoId, int $farmaciaId): ?array {
        // Obtenemos primero los datos del producto y stock total
        $stmt = $this->pdo->prepare("
            SELECT DISTINCT
                p.id,
                p.nombre,
                p.codigo_barras AS codigo,
                p.descripcion,
                p.categoria,
                p.presentacion,
                p.activo,
                p.imagen,
                COALESCE(SUM(l.stock_actual), 0) AS stock_total,
                pr.precio AS precio_activo,
                pr.id AS precio_id
            FROM productos p
            LEFT JOIN lotes l ON p.id = l.producto_id AND l.farmacia_id = :farmacia_id
            LEFT JOIN precios pr ON p.id = pr.producto_id AND pr.farmacia_id = :farmacia_id AND pr.activo = 1
            WHERE p.id = :id AND p.activo = 1
            GROUP BY p.id, p.nombre, p.codigo_barras, p.descripcion, p.categoria, p.presentacion, p.activo, p.imagen, pr.precio, pr.id
        ");
        $stmt->execute([':id' => $productoId, ':farmacia_id' => $farmaciaId]);
        $producto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$producto) return null;

        // Intentamos obtener el lote más próximo a vencer para mostrarlo en el formulario
        $stmtLote = $this->pdo->prepare("
            SELECT codigo_lote, fecha_vencimiento
            FROM lotes
            WHERE producto_id = :id AND farmacia_id = :farmacia_id AND stock_actual > 0
            ORDER BY (fecha_vencimiento IS NULL) ASC, fecha_vencimiento ASC
            LIMIT 1
        ");
        $stmtLote->execute([':id' => $productoId, ':farmacia_id' => $farmaciaId]);
        $loteInfo = $stmtLote->fetch(PDO::FETCH_ASSOC);

        if ($loteInfo) {
            $producto['codigo_lote'] = $loteInfo['codigo_lote'];
            $producto['fecha_vencimiento'] = $loteInfo['fecha_vencimiento'];
        }

        return $producto;
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
                p.imagen,
                SUM(l.stock_actual) AS stock_total,
                pr.precio AS precio_activo,
                pr.id AS precio_id
            FROM productos p
            INNER JOIN lotes l ON p.id = l.producto_id
            LEFT JOIN precios pr ON p.id = pr.producto_id AND pr.farmacia_id = :farmacia_id AND pr.activo = 1
            WHERE l.farmacia_id = :farmacia_id 
                AND p.activo = 1
                AND l.stock_actual > 0
                AND (p.nombre LIKE :query OR p.codigo_barras LIKE :query)
            GROUP BY p.id, p.nombre, p.codigo_barras, p.descripcion, p.categoria, p.presentacion, p.activo, p.imagen, pr.precio, pr.id
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

    /**
     * Crea un nuevo producto en el catálogo global
     * NOTA: Solo admins deberían crear productos globales
     */
    public function create(array $data): int {
        $stmt = $this->pdo->prepare("
            INSERT INTO productos (nombre, codigo_barras, descripcion, categoria, presentacion, activo, imagen)
            VALUES (:nombre, :codigo_barras, :descripcion, :categoria, :presentacion, :activo, :imagen)
        ");
        
        $stmt->execute([
            ':nombre' => $data['nombre'],
            ':codigo_barras' => $data['codigo_barras'] ?? null,
            ':descripcion' => $data['descripcion'] ?? null,
            ':categoria' => $data['categoria'] ?? null,
            ':presentacion' => $data['presentacion'] ?? null,
            ':activo' => $data['activo'] ?? true,
            ':imagen' => $data['imagen'] ?? null,
        ]);
        
        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Actualiza un producto existente
     */
    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [':id' => $id];
        
        if (isset($data['nombre'])) {
            $fields[] = 'nombre = :nombre';
            $params[':nombre'] = $data['nombre'];
        }
        if (isset($data['codigo_barras'])) {
            $fields[] = 'codigo_barras = :codigo_barras';
            $params[':codigo_barras'] = $data['codigo_barras'];
        }
        if (isset($data['descripcion'])) {
            $fields[] = 'descripcion = :descripcion';
            $params[':descripcion'] = $data['descripcion'];
        }
        if (isset($data['categoria'])) {
            $fields[] = 'categoria = :categoria';
            $params[':categoria'] = $data['categoria'];
        }
        if (isset($data['presentacion'])) {
            $fields[] = 'presentacion = :presentacion';
            $params[':presentacion'] = $data['presentacion'];
        }
        if (isset($data['activo'])) {
            $fields[] = 'activo = :activo';
            $params[':activo'] = $data['activo'] ? 1 : 0;
        }
        if (isset($data['imagen'])) {
            $fields[] = 'imagen = :imagen';
            $params[':imagen'] = $data['imagen'];
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $sql = "UPDATE productos SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute($params);
        
        // Dado que usamos PDO::ERRMODE_EXCEPTION, si no hay excepción, la consulta fue válida.
        // Retornamos el resultado de la ejecución para mayor seguridad.
        return $result;
    }

    /**
     * Busca un producto por ID sin filtro de farmacia (para crear lotes)
     */
    public function findByIdGlobal(int $id): ?array {
        $stmt = $this->pdo->prepare("
            SELECT id, nombre, codigo_barras, descripcion, categoria, presentacion, activo, imagen
            FROM productos
            WHERE id = :id
        ");
        
        $stmt->execute([':id' => $id]);
        $producto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $producto ?: null;
    }

    /**
     * Lista todos los productos (catálogo global - solo para admins)
     */
    public function findAllGlobal(): array {
        $stmt = $this->pdo->query("
            SELECT id, nombre, codigo_barras, descripcion, categoria, presentacion, activo, imagen
            FROM productos
            ORDER BY nombre ASC
        ");
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Busca productos en el catálogo global (sin filtro de farmacia)
     * Útil para gestión de precios cuando el producto no tiene lotes
     */
    public function searchGlobal(string $query): array {
        $searchTerm = "%{$query}%";
        $stmt = $this->pdo->prepare("
            SELECT id, nombre, codigo_barras, descripcion, categoria, presentacion, activo, imagen
            FROM productos
            WHERE nombre LIKE :query OR codigo_barras LIKE :query
            ORDER BY nombre ASC
            LIMIT 50
        ");
        
        $stmt->execute([':query' => $searchTerm]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtiene un producto global con su precio activo en una farmacia
     */
    public function findByIdWithPrecio(int $productoId, int $farmaciaId): ?array {
        $stmt = $this->pdo->prepare("
            SELECT 
                p.id,
                p.nombre,
                p.codigo_barras AS codigo,
                p.descripcion,
                p.categoria,
                p.presentacion,
                p.activo,
                p.imagen,
                pr.precio AS precio_activo,
                pr.id AS precio_id
            FROM productos p
            LEFT JOIN precios pr ON p.id = pr.producto_id 
                AND pr.farmacia_id = :farmacia_id_tienda
                AND pr.activo = 1
            WHERE p.id = :id
        ");
        
        $stmt->execute([
            ':id' => $productoId,
            ':farmacia_id_tienda' => $farmaciaId,
        ]);
        
        $producto = $stmt->fetch(PDO::FETCH_ASSOC);
        return $producto ?: null;
    }

    /**
     * Busca un producto por su código de barras exacto
     */
    public function findByCodigoBarras(string $codigoBarras): ?array {
        $stmt = $this->pdo->prepare("
            SELECT id, nombre, codigo_barras, descripcion, categoria, presentacion, activo, imagen
            FROM productos
            WHERE codigo_barras = :codigo_barras
            LIMIT 1
        ");
        
        $stmt->execute([':codigo_barras' => $codigoBarras]);
        $producto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $producto ?: null;
    }
}