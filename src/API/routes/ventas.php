<?php

declare(strict_types=1);

require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
require_once SRC_PATH . '/Infrastructure/Persistence/VentaRepository.php';
require_once SRC_PATH . '/Infrastructure/Persistence/LoteRepository.php';
require_once SRC_PATH . '/Infrastructure/Persistence/MovimientoInventarioRepository.php';
require_once SRC_PATH . '/Domain/Services/VentaService.php';
require_once SRC_PATH . '/Domain/Services/InventarioMovimientoService.php';

use PharmaQuick\Infrastructure\Persistence\PDOFactory;
use PharmaQuick\Infrastructure\Persistence\VentaRepository;
use PharmaQuick\Infrastructure\Persistence\LoteRepository;
use PharmaQuick\Infrastructure\Persistence\MovimientoInventarioRepository;
use PharmaQuick\Domain\Services\VentaService;
use PharmaQuick\Domain\Services\InventarioMovimientoService;

function handleGetVentas(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        $pdo = PDOFactory::getCluster(1);
        $ventaRepo = new VentaRepository($pdo);
        $ventas = $ventaRepo->getVentasByFarmacia($farmaciaId);

        JsonResponse::success(['ventas' => $ventas]);
    } catch (Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handleGetVentaDetalles(int $ventaId): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        $pdo = PDOFactory::getCluster(1);
        $ventaRepo = new VentaRepository($pdo);
        
        $tipo = $_GET['tipo'] ?? 'VENTA';
        
        if ($tipo === 'COMPRA') {
            $detalles = $ventaRepo->getDetallesByCompra($ventaId);
        } else {
            $detalles = $ventaRepo->getDetallesByVenta($ventaId);
        }

        JsonResponse::success(['detalles' => $detalles]);
    } catch (Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handlePostVentasCrear(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    $usuarioId = (int)(Auth::userId() ?? 0);
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    try {
        $pdo = PDOFactory::getCluster(1);
        $ventaRepo = new VentaRepository($pdo);
        $loteRepo = new LoteRepository($pdo);
        $movRepo = new MovimientoInventarioRepository($pdo);
        $movService = new InventarioMovimientoService($loteRepo, $movRepo);
        
        $ventaService = new VentaService($ventaRepo, $loteRepo, $movService, $pdo);
        
        $ventaId = $ventaService->procesarVenta($input, $farmaciaId, $usuarioId);

        JsonResponse::success([
            'message' => 'Venta registrada con éxito',
            'venta_id' => $ventaId
        ], 201);
    } catch (Throwable $e) {
        $code = ($e instanceof Exception) ? 400 : 500;
        JsonResponse::error($e->getMessage(), $code);
    }
}

/**
 * Obtiene productos recomendados/top para el POS
 */
function handleGetPOSProductos(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        $pdo = PDOFactory::getCluster(1);
        $ventaRepo = new VentaRepository($pdo);
        
        // Obtener top 12 productos de los últimos 30 días
        $productos = $ventaRepo->topProductosByFarmacia($farmaciaId, 12, 30);
        
        // Si no hay suficientes, rellenar con productos con stock
        if (count($productos) < 6) {
            require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';
            $prodRepo = new \PharmaQuick\Infrastructure\Persistence\ProductoRepository($pdo);
            $stockProds = $prodRepo->findAllByFarmacia($farmaciaId);
            
            // Combinar y evitar duplicados
            $existingIds = array_column($productos, 'id');
            foreach ($stockProds as $p) {
                if (!in_array($p['id'], $existingIds)) {
                    $productos[] = [
                        'id' => $p['id'],
                        'nombre' => $p['nombre'],
                        'presentacion' => $p['presentacion'],
                        'categoria' => $p['categoria'],
                        'imagen' => $p['imagen'],
                        'precio_activo' => $p['precio_activo'],
                        'stock_total' => $p['stock_total'],
                        'unidades_vendidas' => 0
                    ];
                    if (count($productos) >= 12) break;
                }
            }
        }

        // Formatear imágenes
        require_once SRC_PATH . '/API/routes/productos.php';
        foreach ($productos as &$p) {
            $p['imagen_url'] = buildProductoImagenUrl($p['imagen'] ?? null);
            $p['precio_venta'] = $p['precio_activo'] ?? 0;
        }
        unset($p);

        JsonResponse::success(['productos' => $productos]);
    } catch (Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}
