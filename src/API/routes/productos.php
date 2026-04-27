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
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    if (!Auth::isAdmin()) {
        JsonResponse::error('No tiene permisos para crear productos', 403);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }
    
    if (empty($input) && empty($_FILES)) {
        JsonResponse::error('No se recibieron datos válidos en la petición', 400);
        return;
    }

    $nombre = isset($input['nombre']) ? trim($input['nombre']) : '';
    if (empty($nombre)) {
        JsonResponse::error('El nombre del producto es requerido', 400);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);

        $productoId = $repo->create([
            'nombre' => $nombre,
            'codigo_barras' => $input['codigo_barras'] ?? null,
            'descripcion' => $input['descripcion'] ?? null,
            'categoria' => $input['categoria'] ?? null,
            'presentacion' => $input['presentacion'] ?? null,
            'activo' => isset($input['activo']) ? (bool)$input['activo'] : true,
        ]);

        // Si hay una imagen en la misma petición, procesarla
        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            require_once ROUTES_PATH . '/upload.php';
            // Esta función ya responde al cliente o lanza excepción
            handleUploadProductImage($productoId);
            return;
        }

        JsonResponse::success([
            'message' => 'Producto creado',
            'producto_id' => $productoId,
        ], 201);

    } catch (\PDOException $e) {
        if ($e->getCode() == 23000) {
            JsonResponse::error('El código de barras ya existe', 400);
        } else {
            JsonResponse::error('Error de base de datos: ' . $e->getMessage(), 500);
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

    if (!Auth::isAdmin()) {
        JsonResponse::error('No tiene permisos para modificar productos', 403);
        return;
    }

    // PUT no soporta nativamente multipart/form-data en PHP ($_FILES está vacío)
    // Para simplificar, si el cliente envía FormData, usaremos POST con un campo _method=PUT o similar,
    // o simplemente manejaremos la imagen por separado como antes.
    // Pero si es multipart/form-data tradicional, leeremos de php://input y parsearemos.
    // Sin embargo, para SPA es mejor que el Edit también pueda enviar imagen.
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);

        $producto = $repo->findByIdGlobal($id);
        if (!$producto) {
            JsonResponse::error('Producto no encontrado', 404);
            return;
        }

        // Actualizar datos básicos
        if (!empty($input)) {
            $repo->update($id, $input);
        }

        // Procesar imagen si viene (PHP solo llena $_FILES en POST)
        // Si el cliente envía FormData vía PUT, $_FILES suele estar vacío.
        // El frontend debe usar el endpoint de imagen dedicado o enviar vía POST con override.
        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            require_once ROUTES_PATH . '/upload.php';
            handleUploadProductImage($id);
            return;
        }

        JsonResponse::success(['message' => 'Producto actualizado']);

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