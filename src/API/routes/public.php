<?php
// Public API routes (no JWT required)

function handleGetPublicCatalogo()
{
    try {
        // Expected query params: farmacia_id (required), q (optional), limit, offset
        $farmaciaId = $_GET['farmacia_id'] ?? null;
        if (!$farmaciaId) {
            JsonResponse::error('farmacia_id is required', 400);
            return;
        }
        $q = $_GET['q'] ?? '';
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
        $offset = isset($_GET['offset']) ? (int) $_GET['offset'] : 0;

        // Get PDO connection and instantiate repository (following pattern from productos.php)
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);

        $products = $repo->findAllByFarmacia((int) $farmaciaId);
        $products = array_slice($products, $offset, $limit);
        // Optionally filter by search term
        if ($q !== '') {
            $products = array_filter($products, function ($p) use ($q) {
                return stripos($p['nombre'], $q) !== false || stripos($p['presentacion'], $q) !== false;
            });
        }
        // Return minimal fields for storefront
        $data = array_map(function ($p) {
            return [
                'id' => $p['id'],
                'nombre' => $p['nombre'],
                'presentacion' => $p['presentacion'],
                'categoria' => $p['categoria'] ?? null,
                'precio_activo' => $p['precio_activo'] ?? null,
                'stock_total' => $p['stock_total'] ?? 0,
                'imagen' => $p['imagen'] ?? null,
            ];
        }, $products);
        JsonResponse::success(['data' => $data]);
    } catch (\Throwable $e) {
        JsonResponse::error('Error interno: ' . $e->getMessage(), 500);
    }
}




function handleGetPublicProductosTop()
{
    // Expected query params: farmacia_id (required), limit (optional)
    $farmaciaId = $_GET['farmacia_id'] ?? null;
    if (!$farmaciaId) {
        JsonResponse::error('farmacia_id is required', 400);
        return;
    }
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;

    // Get PDO connection and instantiate repository (following pattern from productos.php)
    require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
    require_once SRC_PATH . '/Infrastructure/Persistence/VentaRepository.php';

    $pdo = PDOFactory::getCluster(1);
    $ventaRepo = new \PharmaQuick\Infrastructure\Persistence\VentaRepository($pdo);

    $top = $ventaRepo->topProductosByFarmacia((int) $farmaciaId, $limit);
    JsonResponse::success(['data' => $top]);
}

