<?php

declare(strict_types=1);

/**
 * PharmaQuick - Rutas de Productos
 * 
 * Maneja /api/productos - Rutas protegidas con JWT
 */

function handleGetProductos(): void {
    // Obtener contexto de autenticación
    $farmaciaId = Auth::farmaciaId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);
        $productos = $repo->findAllByFarmacia($farmaciaId);

        JsonResponse::success([
            'productos' => $productos,
            'total' => count($productos),
            'farmacia_id' => $farmaciaId,
        ]);

    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handleGetProductoById(int $id): void {
    $farmaciaId = Auth::farmaciaId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);
        
        // Primero buscar con filtro de farmacia (productos con lotes)
        $producto = $repo->findById($id, $farmaciaId);
        
        // Si no tiene lotes, buscar en catálogo global PERO solo si el producto está activo
        // Esto es necesario para crear precios de productos nuevos
        if (!$producto) {
            $producto = $repo->findByIdGlobal($id);
            if ($producto && isset($producto['activo']) && $producto['activo']) {
                $producto['stock_total'] = 0;
                $producto['codigo'] = $producto['codigo_barras'];
            }
        }

        if (!$producto) {
            JsonResponse::error('Producto no encontrado', 404);
            return;
        }

        JsonResponse::success($producto);

    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handleSearchProductos(): void {
    $farmaciaId = Auth::farmaciaId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    $query = $_GET['q'] ?? $_GET['search'] ?? '';
    
    if (strlen($query) < 2) {
        JsonResponse::error('Buscar mínimo 2 caracteres', 400);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);
        $productos = $repo->search($query, $farmaciaId);

        JsonResponse::success([
            'productos' => $productos,
            'total' => count($productos),
            'query' => $query,
        ]);

    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handlePostProductos(): void {
    $farmaciaId = Auth::farmaciaId();
    $userId = Auth::userId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    // Verificar rol desde BD (no desde email)
    if (!Auth::isAdmin()) {
        JsonResponse::error('No tiene permisos para crear productos', 403);
        return;
    }

    // Leer JSON del body
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        JsonResponse::error('JSON inválido en el body', 400);
        return;
    }

    // Validar campos requeridos
    $nombre = isset($input['nombre']) ? trim($input['nombre']) : '';
    
    if (empty($nombre)) {
        JsonResponse::error('nombre es requerido', 400);
        return;
    }

    // Validar código de barras único (si se proporciona)
    $codigoBarras = isset($input['codigo_barras']) ? trim($input['codigo_barras']) : null;

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);

        $productoId = $repo->create([
            'nombre' => $nombre,
            'codigo_barras' => $codigoBarras,
            'descripcion' => $input['descripcion'] ?? null,
            'categoria' => $input['categoria'] ?? null,
            'presentacion' => $input['presentacion'] ?? null,
            'activo' => $input['activo'] ?? true,
        ]);

        JsonResponse::success([
            'message' => 'Producto creado',
            'producto_id' => $productoId,
        ], 201);

    } catch (\PDOException $e) {
        if ($e->getCode() == 23000) {
            JsonResponse::error('El código de barras ya existe', 400);
        } else {
            JsonResponse::error('Error: ' . $e->getMessage(), 500);
        }
    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handlePutProductos(int $id): void {
    $farmaciaId = Auth::farmaciaId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    // Verificar rol desde BD
    if (!Auth::isAdmin()) {
        JsonResponse::error('No tiene permisos para modificar productos', 403);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        JsonResponse::error('JSON inválido en el body', 400);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);

        // Verificar que existe el producto
        $producto = $repo->findByIdGlobal($id);
        if (!$producto) {
            JsonResponse::error('Producto no encontrado', 404);
            return;
        }

        $success = $repo->update($id, $input);

        if ($success) {
            JsonResponse::success(['message' => 'Producto actualizado']);
        } else {
            JsonResponse::error('Error al actualizar', 500);
        }

    } catch (\PDOException $e) {
        if ($e->getCode() == 23000) {
            JsonResponse::error('El código de barras ya existe', 400);
        } else {
            JsonResponse::error('Error: ' . $e->getMessage(), 500);
        }
    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handleDeleteProductos(int $id): void {
    $farmaciaId = Auth::farmaciaId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    // Verificar rol desde BD
    if (!Auth::isAdmin()) {
        JsonResponse::error('No tiene permisos para eliminar productos', 403);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);

        // Verificar que existe (usando método global)
        $producto = $repo->findByIdGlobal($id);
        if (!$producto) {
            JsonResponse::error('Producto no encontrado', 404);
            return;
        }

        // En lugar de eliminar, marcar como inactivo
        $success = $repo->update($id, ['activo' => false]);

        if ($success) {
            JsonResponse::success(['message' => 'Producto eliminado (inactivado)']);
        } else {
            JsonResponse::error('Error al eliminar', 500);
        }

    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}