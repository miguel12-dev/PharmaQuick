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
