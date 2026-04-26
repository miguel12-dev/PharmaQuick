<?php

declare(strict_types=1);

/**
 * PharmaQuick - Rutas de Precios
 * 
 * Maneja /api/precios - Rutas protegidas con JWT
 */

function handleGetPrecios(): void {
    $farmaciaId = Auth::farmaciaId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/PrecioRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new PrecioRepository($pdo);
        $precios = $repo->findWithProductoByFarmacia($farmaciaId);

        JsonResponse::success([
            'precios' => $precios,
            'total' => count($precios),
            'farmacia_id' => $farmaciaId,
        ]);

    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handlePostPrecios(): void {
    $farmaciaId = Auth::farmaciaId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    // Leer JSON del body
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        JsonResponse::error('JSON inválido en el body', 400);
        return;
    }

    // Validar campos requeridos
    $productoId = isset($input['producto_id']) ? (int) $input['producto_id'] : 0;
    $precio = isset($input['precio']) ? (float) $input['precio'] : 0;
    $activar = isset($input['activar']) ? (bool) $input['activar'] : true;

    if (!$productoId) {
        JsonResponse::error('producto_id es requerido', 400);
        return;
    }

    if ($precio <= 0) {
        JsonResponse::error('precio debe ser mayor a 0', 400);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/PrecioRepository.php';
        require_once SRC_PATH . '/Domain/Services/PrecioService.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new PrecioRepository($pdo);
        $service = new PrecioService($repo);

        if ($activar) {
            // Crear y activar (lógica de único precio activo)
            $resultado = $service->crearYActivar($productoId, $farmaciaId, $precio);
            JsonResponse::success([
                'message' => 'Precio creado y activado',
                'precio' => $resultado,
            ], 201);
        } else {
            // Crear sin activar
            $precioId = $service->crear($productoId, $farmaciaId, $precio, false);
            JsonResponse::success([
                'message' => 'Precio creado (inactivo)',
                'precio_id' => $precioId,
            ], 201);
        }

    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handlePutPrecios(int $id): void {
    $farmaciaId = Auth::farmaciaId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        JsonResponse::error('JSON inválido en el body', 400);
        return;
    }

    $precio = isset($input['precio']) ? (float) $input['precio'] : 0;
    $activar = isset($input['activar']) ? (bool) $input['activar'] : false;

    if ($precio <= 0 && !$activar) {
        JsonResponse::error('Debe proporcionar precio o activar=true', 400);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/PrecioRepository.php';
        require_once SRC_PATH . '/Domain/Services/PrecioService.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new PrecioRepository($pdo);
        $service = new PrecioService($repo);

        // Necesitamos el producto_id para la operación
        $precios = $repo->findAllByProducto($id, $farmaciaId);
        
        if (empty($precios)) {
            JsonResponse::error('Precio no encontrado', 404);
            return;
        }

        $productoId = $precios[0]['producto_id'];

        if ($activar) {
            $resultado = $service->activar($id, $productoId, $farmaciaId);
            JsonResponse::success([
                'message' => 'Precio activado',
                'precio' => $resultado,
            ]);
        } elseif ($precio > 0) {
            $service->actualizar($id, $farmaciaId, $precio);
            JsonResponse::success([
                'message' => 'Precio actualizado',
            ]);
        }

    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handleDeletePrecios(int $id): void {
    $farmaciaId = Auth::farmaciaId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/PrecioRepository.php';
        require_once SRC_PATH . '/Domain/Services/PrecioService.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new PrecioRepository($pdo);
        $service = new PrecioService($repo);

        $success = $service->eliminar($id, $farmaciaId);

        if ($success) {
            JsonResponse::success(['message' => 'Precio eliminado']);
        } else {
            JsonResponse::error('Precio no encontrado', 404);
        }

    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handleGetPreciosByProducto(int $productoId): void {
    $farmaciaId = Auth::farmaciaId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/PrecioRepository.php';
        require_once SRC_PATH . '/Domain/Services/PrecioService.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new PrecioRepository($pdo);
        $service = new PrecioService($repo);

        $todos = $service->getTodos($productoId, $farmaciaId);
        $activo = $service->getPrecioActivo($productoId, $farmaciaId);

        JsonResponse::success([
            'producto_id' => $productoId,
            'precios' => $todos,
            'precio_activo' => $activo,
            'total' => count($todos),
        ]);

    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handleGetPreciosById(int $id): void {
    $farmaciaId = Auth::farmaciaId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/PrecioRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new PrecioRepository($pdo);

        // Buscar el precio
        $precios = $repo->findAllByProducto($id, $farmaciaId);
        
        if (empty($precios)) {
            JsonResponse::error('Precio no encontrado', 404);
            return;
        }

        JsonResponse::success($precios[0]);

    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}