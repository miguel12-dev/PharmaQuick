<?php

declare(strict_types=1);

/**
 * PharmaQuick - Rutas de Inventario (Kardex + FEFO)
 *
 * Contrato: la tabla `lotes` NO se modifica directo para stock.
 * Todo cambio de stock debe entrar por `movimientos_inventario` y el trigger `trg_kardex_stock`.
 */

/**
 * Política FEFO - bloqueo preventivo:
 * Por documentación, se debe impedir SALIDA/RESERVA cuando el lote vence en < 15 días (parametrizable).
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
        throw new \RuntimeException('Lote no encontrado para esta farmacia');
    }
    return $lote;
}

function loteEstaBloqueadoPorVencimiento(?string $fechaVencimiento, int $minDias): bool {
    if (!$fechaVencimiento) return false; // NULL: permitido solo para casos tipo AJUSTE (no vender idealmente)
    $v = new \DateTimeImmutable($fechaVencimiento);
    $hoy = new \DateTimeImmutable('today');
    $diff = (int)$hoy->diff($v)->format('%r%a');
    // diff negativo => ya venció
    return $diff < $minDias;
}

/**
 * GET /api/inventario/fefo?producto_id=123
 * Responde lotes disponibles (stock_actual>0) ordenados por fecha_vencimiento asc (NULL al final).
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

        // Agregar bandera de bloqueo + semáforo
        $data = array_map(function(array $r) use ($minDias): array {
            $fecha = $r['fecha_venc'] ?? null;
            $dias = isset($r['dias_restantes']) ? (int)$r['dias_restantes'] : null;
            $bloqueado = loteEstaBloqueadoPorVencimiento($fecha, $minDias);

            $semaforo = 'VERDE';
            if ($dias !== null) {
                if ($dias < 0) $semaforo = 'VENCIDO';
                elseif ($dias < 90) $semaforo = 'ROJO';
                elseif ($dias < 180) $semaforo = 'AMARILLO';
            }

            $r['bloqueado'] = $bloqueado;
            $r['semaforo'] = $semaforo;
            return $r;
        }, $rows);

        JsonResponse::success([
            'producto_id' => $productoId,
            'farmacia_id' => $farmaciaId,
            'min_dias_bloqueo' => $minDias,
            'lotes' => $data,
        ]);
    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

/**
 * POST /api/inventario/movimiento
 * Body JSON: {lote_id, tipo, cantidad}
 * tip: ENTRADA|SALIDA|RESERVA|LIBERACION
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
    $loteId = isset($input['lote_id']) ? (int)$input['lote_id'] : 0;
    $tipo = isset($input['tipo']) ? strtoupper(trim((string)$input['tipo'])) : '';
    $cantidad = isset($input['cantidad']) ? (float)$input['cantidad'] : 0.0;

    $allowed = ['ENTRADA', 'SALIDA', 'RESERVA', 'LIBERACION'];
    if ($loteId <= 0) {
        JsonResponse::error('lote_id es requerido', 400);
        return;
    }
    if (!in_array($tipo, $allowed, true)) {
        JsonResponse::error('tipo inválido', 400);
        return;
    }
    if ($cantidad <= 0) {
        JsonResponse::error('cantidad debe ser > 0', 400);
        return;
    }

    $minDias = inventarioMinDiasBloqueo();

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        $pdo = PDOFactory::getCluster(1);

        // Validar pertenencia + política de vencimiento para SALIDA/RESERVA
        $lote = fetchLoteOrFail($pdo, $loteId, $farmaciaId);

        if (in_array($tipo, ['SALIDA', 'RESERVA'], true)) {
            $fechaVenc = $lote['fecha_vencimiento'] ?? null;
            if (loteEstaBloqueadoPorVencimiento($fechaVenc ? (string)$fechaVenc : null, $minDias)) {
                JsonResponse::error("Movimiento bloqueado: lote vence en menos de {$minDias} días", 409);
                return;
            }
        }

        // Reglas de disponibilidad (aplicación) para evitar negativos antes del trigger
        $stockActual = (float)($lote['stock_actual'] ?? 0);
        $stockReservado = (float)($lote['stock_reservado'] ?? 0);

        if ($tipo === 'SALIDA') {
            if ($cantidad - $stockActual > 0.0005) {
                JsonResponse::error('Stock insuficiente en el lote', 409);
                return;
            }
        }
        if ($tipo === 'RESERVA') {
            if ($cantidad - $stockActual > 0.0005) {
                JsonResponse::error('Stock insuficiente para reservar', 409);
                return;
            }
        }
        if ($tipo === 'LIBERACION') {
            if ($cantidad - $stockReservado > 0.0005) {
                JsonResponse::error('No hay suficiente stock reservado para liberar', 409);
                return;
            }
        }

        $stmt = $pdo->prepare("
            INSERT INTO movimientos_inventario (lote_id, farmacia_id, usuario_id, tipo, cantidad)
            VALUES (:lote_id, :farmacia_id, :usuario_id, :tipo, :cantidad)
        ");
        $stmt->execute([
            ':lote_id' => $loteId,
            ':farmacia_id' => $farmaciaId,
            ':usuario_id' => $usuarioId,
            ':tipo' => $tipo,
            ':cantidad' => $cantidad,
        ]);

        // Leer nuevo estado de lote (ya actualizado por trigger)
        $lote2 = fetchLoteOrFail($pdo, $loteId, $farmaciaId);

        JsonResponse::success([
            'message' => 'Movimiento registrado',
            'movimiento_id' => (int)$pdo->lastInsertId(),
            'lote' => [
                'id' => (int)$lote2['id'],
                'stock_actual' => (float)$lote2['stock_actual'],
                'stock_reservado' => (float)$lote2['stock_reservado'],
            ],
        ], 201);
    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

/**
 * GET /api/inventario/alertas
 * Lotes con stock>0 y vencimiento cercano, para semáforo en dashboard.
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

        // Ventana default: 6 meses (180 días). Se puede ajustar por query.
        $dias = isset($_GET['dias']) ? max(1, (int)$_GET['dias']) : 180;

        $stmt = $pdo->prepare("
            SELECT
                l.id AS lote_id,
                l.producto_id,
                p.nombre AS producto_nombre,
                l.codigo_lote,
                l.fecha_vencimiento,
                l.stock_actual,
                DATEDIFF(l.fecha_vencimiento, CURDATE()) AS dias_restantes
            FROM lotes l
            INNER JOIN productos p ON p.id = l.producto_id
            WHERE l.farmacia_id = :farmacia_id
              AND l.stock_actual > 0
              AND l.fecha_vencimiento IS NOT NULL
              AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL :dias DAY)
            ORDER BY l.fecha_vencimiento ASC, l.id ASC
            LIMIT 500
        ");
        $stmt->execute([':farmacia_id' => $farmaciaId, ':dias' => $dias]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $data = array_map(function(array $r): array {
            $d = isset($r['dias_restantes']) ? (int)$r['dias_restantes'] : null;
            $semaforo = 'VERDE';
            if ($d !== null) {
                if ($d < 0) $semaforo = 'VENCIDO';
                elseif ($d < 90) $semaforo = 'ROJO';
                elseif ($d < 180) $semaforo = 'AMARILLO';
            }
            $r['semaforo'] = $semaforo;
            return $r;
        }, $rows);

        JsonResponse::success([
            'farmacia_id' => $farmaciaId,
            'dias_ventana' => $dias,
            'alertas' => $data,
            'total' => count($data),
        ]);
    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

