<?php

declare(strict_types=1);

use PharmaQuick\Domain\Services\InventarioImportService;
use PharmaQuick\Domain\Services\InventarioMovimientoService;
use PharmaQuick\Infrastructure\Persistence\LoteRepository;
use PharmaQuick\Infrastructure\Persistence\MovimientoInventarioRepository;
use PharmaQuick\Infrastructure\Services\ExcelXlsxReader;

/**
 * PharmaQuick - Rutas de Inventario (Kardex + FEFO)
 *
 * Contrato: la tabla `lotes` NO se modifica directamente para stock.
 * Todo cambio de stock se realiza por `movimientos_inventario` y trigger de Kardex.
 */

function inventarioMinDiasBloqueo(): int {
    $val = $_ENV['PQ_FEFO_BLOQUEO_DIAS'] ?? $_SERVER['PQ_FEFO_BLOQUEO_DIAS'] ?? null;
    $n = is_numeric($val) ? (int)$val : 15;
    return max(0, $n);
}

function fetchLoteOrFail(PDO $pdo, int $loteId, int $farmaciaId): array {
    $stmt = $pdo->prepare("
        SELECT id, producto_id, farmacia_id, codigo_lote, fecha_vencimiento, costo_unitario, stock_actual, stock_reservado
        FROM lotes
        WHERE id = :id AND farmacia_id = :farmacia_id
        LIMIT 1
    ");
    $stmt->execute([':id' => $loteId, ':farmacia_id' => $farmaciaId]);
    $lote = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$lote) {
        throw new RuntimeException('Lote no encontrado para esta farmacia');
    }

    return $lote;
}

function loteEstaBloqueadoPorVencimiento(?string $fechaVencimiento, int $minDias): bool {
    if (!$fechaVencimiento) {
        return false;
    }

    $vencimiento = new DateTimeImmutable($fechaVencimiento);
    $hoy = new DateTimeImmutable('today');
    $diff = (int)$hoy->diff($vencimiento)->format('%r%a');

    return $diff < $minDias;
}

function semaforoDesdeDias(?int $diasRestantes): string {
    if ($diasRestantes === null) {
        return 'VERDE';
    }

    if ($diasRestantes < 0) {
        return 'VENCIDO';
    }

    if ($diasRestantes < 90) {
        return 'ROJO';
    }

    if ($diasRestantes < 180) {
        return 'AMARILLO';
    }

    return 'VERDE';
}

function inventarioSemaforoSqlCondicion(string $semaforo): ?string {
    $map = [
        'VENCIDO' => 'DATEDIFF(l.fecha_vencimiento, CURDATE()) < 0',
        'ROJO' => 'DATEDIFF(l.fecha_vencimiento, CURDATE()) BETWEEN 0 AND 89',
        'AMARILLO' => 'DATEDIFF(l.fecha_vencimiento, CURDATE()) BETWEEN 90 AND 179',
        'VERDE' => 'DATEDIFF(l.fecha_vencimiento, CURDATE()) >= 180',
    ];

    return $map[$semaforo] ?? null;
}

function inventarioQuerySemaforo(?string $raw): ?string {
    if ($raw === null) {
        return null;
    }

    $value = strtoupper(trim($raw));
    return in_array($value, ['VENCIDO', 'ROJO', 'AMARILLO', 'VERDE'], true) ? $value : null;
}

/**
 * GET /api/inventario/fefo?producto_id=123
 */
function handleGetFefo(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    $productoId = isset($_GET['producto_id']) ? (int)$_GET['producto_id'] : 0;
    if ($productoId <= 0) {
        JsonResponse::error('producto_id es requerido', 400);
        return;
    }

    $minDias = inventarioMinDiasBloqueo();

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        $pdo = PDOFactory::getCluster(1);

        $stmt = $pdo->prepare("
            SELECT
                l.id AS lote_id,
                l.codigo_lote,
                l.fecha_vencimiento AS fecha_venc,
                l.stock_actual AS stock,
                l.stock_reservado,
                l.costo_unitario,
                DATEDIFF(l.fecha_vencimiento, CURDATE()) AS dias_restantes
            FROM lotes l
            WHERE l.farmacia_id = :farmacia_id
              AND l.producto_id = :producto_id
              AND l.stock_actual > 0
            ORDER BY (l.fecha_vencimiento IS NULL) ASC, l.fecha_vencimiento ASC, l.id ASC
        ");
        $stmt->execute([':farmacia_id' => $farmaciaId, ':producto_id' => $productoId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $data = array_map(static function(array $r) use ($minDias): array {
            $fecha = $r['fecha_venc'] ?? null;
            $dias = isset($r['dias_restantes']) ? (int)$r['dias_restantes'] : null;

            $r['bloqueado'] = loteEstaBloqueadoPorVencimiento($fecha, $minDias);
            $r['semaforo'] = semaforoDesdeDias($dias);

            return $r;
        }, $rows);

        JsonResponse::success([
            'producto_id' => $productoId,
            'farmacia_id' => $farmaciaId,
            'min_dias_bloqueo' => $minDias,
            'lotes' => $data,
        ]);
    } catch (Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

/**
 * GET /api/inventario/alertas
 * Filtros: dias, semaforo, q, page, per_page
 */
function handleGetAlertasInventario(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        $pdo = PDOFactory::getCluster(1);

        $dias = isset($_GET['dias']) ? max(1, (int)$_GET['dias']) : 180;
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $perPage = isset($_GET['per_page']) ? max(1, min(100, (int)$_GET['per_page'])) : 25;
        $offset = ($page - 1) * $perPage;

        $search = trim((string)($_GET['q'] ?? ''));
        $semaforoFilter = inventarioQuerySemaforo($_GET['semaforo'] ?? null);

        $where = [
            'l.farmacia_id = :farmacia_id',
            'l.stock_actual > 0',
            'l.fecha_vencimiento IS NOT NULL',
            'l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL :dias DAY)',
        ];

        $params = [
            ':farmacia_id' => $farmaciaId,
            ':dias' => $dias,
        ];

        if ($search !== '') {
            $where[] = '(p.nombre LIKE :q OR p.codigo_barras LIKE :q OR l.codigo_lote LIKE :q)';
            $params[':q'] = '%' . $search . '%';
        }

        if ($semaforoFilter) {
            $semaforoCond = inventarioSemaforoSqlCondicion($semaforoFilter);
            if ($semaforoCond) {
                $where[] = $semaforoCond;
            }
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $pdo->prepare("
            SELECT COUNT(*)
            FROM lotes l
            INNER JOIN productos p ON p.id = l.producto_id
            WHERE {$whereSql}
        ");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $pdo->prepare("
            SELECT
                l.id AS lote_id,
                l.producto_id,
                p.nombre AS producto_nombre,
                p.codigo_barras,
                l.codigo_lote,
                l.fecha_vencimiento,
                l.stock_actual,
                DATEDIFF(l.fecha_vencimiento, CURDATE()) AS dias_restantes
            FROM lotes l
            INNER JOIN productos p ON p.id = l.producto_id
            WHERE {$whereSql}
            ORDER BY l.fecha_vencimiento ASC, l.id ASC
            LIMIT {$perPage} OFFSET {$offset}
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $alertas = array_map(static function(array $row): array {
            $diasRestantes = isset($row['dias_restantes']) ? (int)$row['dias_restantes'] : null;
            $row['semaforo'] = semaforoDesdeDias($diasRestantes);
            return $row;
        }, $rows);

        JsonResponse::success([
            'farmacia_id' => $farmaciaId,
            'filtros' => [
                'dias' => $dias,
                'semaforo' => $semaforoFilter,
                'q' => $search,
            ],
            'alertas' => $alertas,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => $perPage > 0 ? (int)ceil($total / $perPage) : 1,
            ],
        ]);
    } catch (Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

/**
 * GET /api/inventario/resumen
 * KPI para panel de inventario.
 */
function handleGetResumenInventario(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        $pdo = PDOFactory::getCluster(1);

        $dias = isset($_GET['dias']) ? max(1, (int)$_GET['dias']) : 180;

        $stmt = $pdo->prepare("
            SELECT
                COUNT(*) AS total_alertas,
                COALESCE(SUM(l.stock_actual), 0) AS stock_en_riesgo,
                SUM(CASE WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) < 0 THEN 1 ELSE 0 END) AS vencidos,
                SUM(CASE WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) BETWEEN 0 AND 89 THEN 1 ELSE 0 END) AS rojos,
                SUM(CASE WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) BETWEEN 90 AND 179 THEN 1 ELSE 0 END) AS amarillos,
                SUM(CASE WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) >= 180 THEN 1 ELSE 0 END) AS verdes
            FROM lotes l
            WHERE l.farmacia_id = :farmacia_id
              AND l.stock_actual > 0
              AND l.fecha_vencimiento IS NOT NULL
              AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL :dias DAY)
        ");

        $stmt->execute([
            ':farmacia_id' => $farmaciaId,
            ':dias' => $dias,
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        JsonResponse::success([
            'farmacia_id' => $farmaciaId,
            'dias' => $dias,
            'resumen' => [
                'total_alertas' => (int)($row['total_alertas'] ?? 0),
                'stock_en_riesgo' => (int)($row['stock_en_riesgo'] ?? 0),
                'vencidos' => (int)($row['vencidos'] ?? 0),
                'rojos' => (int)($row['rojos'] ?? 0),
                'amarillos' => (int)($row['amarillos'] ?? 0),
                'verdes' => (int)($row['verdes'] ?? 0),
            ],
        ]);
    } catch (Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

/**
 * GET /api/inventario/movimientos
 * Filtros: tipo, q, page, per_page
 */
function handleGetMovimientosInventario(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        $pdo = PDOFactory::getCluster(1);

        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $perPage = isset($_GET['per_page']) ? max(1, min(100, (int)$_GET['per_page'])) : 15;
        $offset = ($page - 1) * $perPage;

        $tipo = strtoupper(trim((string)($_GET['tipo'] ?? '')));
        $q = trim((string)($_GET['q'] ?? ''));

        $where = ['m.farmacia_id = :farmacia_id'];
        $params = [':farmacia_id' => $farmaciaId];

        if ($tipo !== '' && in_array($tipo, ['ENTRADA', 'SALIDA', 'RESERVA', 'LIBERACION'], true)) {
            $where[] = 'm.tipo = :tipo';
            $params[':tipo'] = $tipo;
        }

        if ($q !== '') {
            $where[] = '(p.nombre LIKE :q OR p.codigo_barras LIKE :q OR l.codigo_lote LIKE :q)';
            $params[':q'] = '%' . $q . '%';
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $pdo->prepare("
            SELECT COUNT(*)
            FROM movimientos_inventario m
            INNER JOIN lotes l ON l.id = m.lote_id
            INNER JOIN productos p ON p.id = l.producto_id
            WHERE {$whereSql}
        ");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $pdo->prepare("
            SELECT
                m.id,
                m.tipo,
                m.cantidad,
                m.descripcion,
                m.created_at,
                l.codigo_lote,
                p.id AS producto_id,
                p.nombre AS producto_nombre,
                p.codigo_barras
            FROM movimientos_inventario m
            INNER JOIN lotes l ON l.id = m.lote_id
            INNER JOIN productos p ON p.id = l.producto_id
            WHERE {$whereSql}
            ORDER BY m.created_at DESC, m.id DESC
            LIMIT {$perPage} OFFSET {$offset}
        ");
        $stmt->execute($params);

        JsonResponse::success([
            'movimientos' => $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [],
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => $perPage > 0 ? (int)ceil($total / $perPage) : 1,
            ],
        ]);
    } catch (Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

/**
 * GET /api/inventario/import-modelo
 * Contrato del archivo .xlsx esperado por el importador.
 */
function handleGetImportModeloInventario(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    JsonResponse::success([
        'nombre_hoja_sugerido' => 'inventario_import',
        'headers_requeridos' => [
            'codigo_barras',
            'codigo_lote',
            'cantidad',
        ],
        'headers_opcionales' => [
            'costo_unitario',
            'fecha_vencimiento',
        ],
        'formato_fecha' => 'YYYY-MM-DD',
        'ejemplo_fila' => [
            'codigo_barras' => '7701234567890',
            'codigo_lote' => 'L-2026-001',
            'cantidad' => '120',
            'costo_unitario' => '4500.50',
            'fecha_vencimiento' => '2027-12-31',
        ],
    ]);
}

/**
 * POST /api/inventario/movimiento
 * Body JSON: {lote_id, tipo, cantidad, descripcion?}
 */
function handlePostMovimientoInventario(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    $usuarioId = (int)(Auth::userId() ?? 0);
    if ($usuarioId <= 0) {
        JsonResponse::error('Usuario no autenticado', 401);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        $pdo = PDOFactory::getCluster(1);

        $loteRepo = new LoteRepository($pdo);
        $movRepo = new MovimientoInventarioRepository($pdo);
        $service = new InventarioMovimientoService($loteRepo, $movRepo);

        $movId = $service->registrarMovimiento([
            'lote_id' => $input['lote_id'] ?? 0,
            'farmacia_id' => $farmaciaId,
            'usuario_id' => $usuarioId,
            'tipo' => $input['tipo'] ?? '',
            'cantidad' => $input['cantidad'] ?? 0,
            'descripcion' => $input['descripcion'] ?? null,
        ]);

        $lote = fetchLoteOrFail($pdo, (int)$input['lote_id'], $farmaciaId);

        JsonResponse::success([
            'message' => 'Movimiento registrado',
            'movimiento_id' => $movId,
            'lote' => [
                'id' => (int)$lote['id'],
                'stock_actual' => (int)$lote['stock_actual'],
                'stock_reservado' => (int)$lote['stock_reservado'],

            ],
        ], 201);
    } catch (Throwable $e) {
        $code = ($e instanceof RuntimeException) ? 400 : 500;
        JsonResponse::error($e->getMessage(), $code);
    }
}

/**
 * POST /api/inventario/import-excel
 * Multipart form: file
 */
function handlePostImportExcel(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    $usuarioId = (int)(Auth::userId() ?? 0);
    if ($usuarioId <= 0) {
        JsonResponse::error('Usuario no autenticado', 401);
        return;
    }

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        JsonResponse::error('Archivo no recibido o con errores', 400);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        $pdo = PDOFactory::getCluster(1);

        $excelReader = new ExcelXlsxReader();
        $productoRepo = new ProductoRepository($pdo);
        $loteRepo = new LoteRepository($pdo);
        $movRepo = new MovimientoInventarioRepository($pdo);
        $movService = new InventarioMovimientoService($loteRepo, $movRepo);

        $importService = new InventarioImportService(
            $excelReader,
            $productoRepo,
            $loteRepo,
            $movService,
            $pdo
        );

        $summary = $importService->import($_FILES['file']['tmp_name'], $farmaciaId, $usuarioId);

        JsonResponse::success([
            'message' => 'Proceso de importaciÃ³n finalizado',
            'summary' => $summary,
        ]);
    } catch (Throwable $e) {
        JsonResponse::error('Error en la importaciÃ³n: ' . $e->getMessage(), 500);
    }
}
