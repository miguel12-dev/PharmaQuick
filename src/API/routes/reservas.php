<?php

declare(strict_types=1);

require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
require_once SRC_PATH . '/Infrastructure/Persistence/ReservaRepository.php';
require_once SRC_PATH . '/Infrastructure/Persistence/LoteRepository.php';
require_once SRC_PATH . '/Infrastructure/Persistence/MovimientoInventarioRepository.php';
require_once SRC_PATH . '/Domain/Services/ReservaService.php';
require_once SRC_PATH . '/Domain/Services/InventarioMovimientoService.php';

use PharmaQuick\Infrastructure\Persistence\PDOFactory;
use PharmaQuick\Infrastructure\Persistence\ReservaRepository;
use PharmaQuick\Infrastructure\Persistence\LoteRepository;
use PharmaQuick\Infrastructure\Persistence\MovimientoInventarioRepository;
use PharmaQuick\Domain\Services\ReservaService;
use PharmaQuick\Domain\Services\InventarioMovimientoService;

function handleGetReservas(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        $pdo = PDOFactory::getCluster(1);
        $reservaRepo = new ReservaRepository($pdo);
        $activas = $reservaRepo->getActivasByFarmacia($farmaciaId);

        JsonResponse::success(['reservas' => $activas]);
    } catch (Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handlePostReservas(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    $usuarioId = (int)(Auth::userId() ?? 0);
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    try {
        $pdo = PDOFactory::getCluster(1);
        $reservaRepo = new ReservaRepository($pdo);
        $loteRepo = new LoteRepository($pdo);
        $movRepo = new MovimientoInventarioRepository($pdo);
        $movService = new InventarioMovimientoService($loteRepo, $movRepo);
        
        $reservaService = new ReservaService($reservaRepo, $loteRepo, $movService, $pdo);
        
        $reservaId = $reservaService->crearReserva($input, $farmaciaId, $usuarioId);

        JsonResponse::success([
            'message' => 'Reserva creada con éxito',
            'reserva_id' => $reservaId
        ], 201);
    } catch (Throwable $e) {
        $code = ($e instanceof Exception) ? 400 : 500;
        JsonResponse::error($e->getMessage(), $code);
    }
}

function handlePostReservasCron(): void {
    // Endpoint para el cronjob. 
    // Podría estar protegido con un token secreto o solo permitir localhost
    try {
        $pdo = PDOFactory::getCluster(1);
        $reservaRepo = new ReservaRepository($pdo);
        $loteRepo = new LoteRepository($pdo);
        $movRepo = new MovimientoInventarioRepository($pdo);
        $movService = new InventarioMovimientoService($loteRepo, $movRepo);
        
        $reservaService = new ReservaService($reservaRepo, $loteRepo, $movService, $pdo);
        
        // Asignamos al admin principal (usuario_id = 1) como responsable de la acción del cron
        $expiradas = $reservaService->expirarReservas(1);

        JsonResponse::success([
            'message' => 'Cron ejecutado',
            'reservas_expiradas' => $expiradas
        ]);
    } catch (Throwable $e) {
        JsonResponse::error('Error en cron: ' . $e->getMessage(), 500);
    }
}
