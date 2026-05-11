<?php

declare(strict_types=1);

require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
require_once SRC_PATH . '/Infrastructure/Persistence/DashboardRepository.php';

use PharmaQuick\Infrastructure\Persistence\PDOFactory;
use PharmaQuick\Infrastructure\Persistence\DashboardRepository;

/**
 * Handle GET /api/dashboard
 */
function handleGetDashboardData(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        $pdo = PDOFactory::getCluster(1); // Assuming cluster 1 for now
        $repo = new DashboardRepository($pdo);

        $stats = $repo->getSummaryStats($farmaciaId);
        $recentSales = $repo->getRecentSales($farmaciaId, 5);
        $topProducts = $repo->getTopProducts($farmaciaId, 5);
        $trend = $repo->getSalesTrend($farmaciaId, 7);

        JsonResponse::success([
            'stats' => $stats,
            'recent_sales' => $recentSales,
            'top_products' => $topProducts,
            'sales_trend' => $trend
        ]);
    } catch (Throwable $e) {
        JsonResponse::error('Error cargando dashboard: ' . $e->getMessage(), 500);
    }
}
