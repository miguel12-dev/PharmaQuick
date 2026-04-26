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
        $producto = $repo->findById($id, $farmaciaId);

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