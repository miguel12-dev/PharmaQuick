<?php

declare(strict_types=1);

/**
 * PharmaQuick - Rutas de Lotes
 *
 * CRUD de metadata de lotes. El stock se maneja EXCLUSIVAMENTE por Kardex:
 * `movimientos_inventario` + trigger `trg_kardex_stock`.
 */

function handleGetLotes(): void {
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

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        $pdo = PDOFactory::getCluster(1);

        $stmt = $pdo->prepare("
            SELECT
                id,
                producto_id,
                farmacia_id,
                codigo_lote,
                fecha_vencimiento,
                costo_unitario,
                stock_actual,
                stock_reservado
            FROM lotes
            WHERE farmacia_id = :farmacia_id
              AND producto_id = :producto_id
            ORDER BY (fecha_vencimiento IS NULL) ASC, fecha_vencimiento ASC, id ASC
        ");
        $stmt->execute([':farmacia_id' => $farmaciaId, ':producto_id' => $productoId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        JsonResponse::success([
            'farmacia_id' => $farmaciaId,
            'producto_id' => $productoId,
            'lotes' => $rows,
            'total' => count($rows),
        ]);
    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handleGetLoteById(int $id): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        $pdo = PDOFactory::getCluster(1);

        $stmt = $pdo->prepare("
            SELECT
                id,
                producto_id,
                farmacia_id,
                codigo_lote,
                fecha_vencimiento,
                costo_unitario,
                stock_actual,
                stock_reservado
            FROM lotes
            WHERE id = :id AND farmacia_id = :farmacia_id
            LIMIT 1
        ");
        $stmt->execute([':id' => $id, ':farmacia_id' => $farmaciaId]);
        $lote = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$lote) {
            JsonResponse::error('Lote no encontrado', 404);
            return;
        }

        JsonResponse::success($lote);
    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

/**
 * POST /api/lotes
 * Crea lote para farmacia actual.
 * Body JSON: {producto_id, codigo_lote, fecha_vencimiento, costo_unitario, stock_inicial?}
 *
 * stock_inicial si viene, se inserta movimiento ENTRADA al lote (para respetar trigger).
 */
function handlePostLotes(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    if (!Auth::isAdmin()) {
        JsonResponse::error('No tiene permisos para crear lotes', 403);
        return;
    }

    $usuarioId = (int)(Auth::userId() ?? 0);
    if ($usuarioId <= 0) {
        JsonResponse::error('Usuario no autenticado', 401);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $productoId = isset($input['producto_id']) ? (int)$input['producto_id'] : 0;
    $codigoLote = isset($input['codigo_lote']) ? trim((string)$input['codigo_lote']) : '';
    $fechaVenc = $input['fecha_vencimiento'] ?? null;
    $costo = isset($input['costo_unitario']) ? (float)$input['costo_unitario'] : null;
    $stockInicial = isset($input['stock_inicial']) ? (float)$input['stock_inicial'] : 0.0;

    if ($productoId <= 0) {
        JsonResponse::error('producto_id es requerido', 400);
        return;
    }
    if ($codigoLote === '') {
        JsonResponse::error('codigo_lote es requerido', 400);
        return;
    }
    if ($fechaVenc !== null && $fechaVenc !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$fechaVenc)) {
        JsonResponse::error('fecha_vencimiento debe ser YYYY-MM-DD', 400);
        return;
    }
    if ($costo !== null && $costo < 0) {
        JsonResponse::error('costo_unitario no puede ser negativo', 400);
        return;
    }
    if ($stockInicial < 0) {
        JsonResponse::error('stock_inicial no puede ser negativo', 400);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';
        $pdo = PDOFactory::getCluster(1);

        // Validar producto existe (catálogo global)
        $productoRepo = new ProductoRepository($pdo);
        $p = $productoRepo->findByIdGlobal($productoId);
        if (!$p) {
            JsonResponse::error('Producto no encontrado', 404);
            return;
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO lotes (producto_id, farmacia_id, codigo_lote, fecha_vencimiento, costo_unitario, stock_actual, stock_reservado)
                VALUES (:producto_id, :farmacia_id, :codigo_lote, :fecha_vencimiento, :costo_unitario, 0, 0)
            ");
            $stmt->execute([
                ':producto_id' => $productoId,
                ':farmacia_id' => $farmaciaId,
                ':codigo_lote' => $codigoLote,
                ':fecha_vencimiento' => ($fechaVenc === '' ? null : $fechaVenc),
                ':costo_unitario' => ($costo === null ? 0 : $costo),
            ]);

            $loteId = (int)$pdo->lastInsertId();

            if ($stockInicial > 0.0005) {
                $stmt = $pdo->prepare("
                    INSERT INTO movimientos_inventario (lote_id, farmacia_id, usuario_id, tipo, cantidad)
                    VALUES (:lote_id, :farmacia_id, :usuario_id, 'ENTRADA', :cantidad)
                ");
                $stmt->execute([
                    ':lote_id' => $loteId,
                    ':farmacia_id' => $farmaciaId,
                    ':usuario_id' => $usuarioId,
                    ':cantidad' => $stockInicial,
                ]);
            }

            $pdo->commit();

            JsonResponse::success([
                'message' => 'Lote creado',
                'lote_id' => $loteId,
            ], 201);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    } catch (\PDOException $e) {
        if ($e->getCode() == 23000) {
            JsonResponse::error('Ya existe un lote con ese código para este producto', 409);
        } else {
            JsonResponse::error('Error de base de datos: ' . $e->getMessage(), 500);
        }
    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

/**
 * PUT /api/lotes/{id}
 * Actualiza metadata (codigo_lote, fecha_vencimiento, costo_unitario).
 * NO permite cambiar producto_id ni farmacia_id, y NO permite tocar stock_*.
 */
function handlePutLote(int $id): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    if (!Auth::isAdmin()) {
        JsonResponse::error('No tiene permisos para modificar lotes', 403);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $fields = [];
    $params = [':id' => $id, ':farmacia_id' => $farmaciaId];

    if (array_key_exists('codigo_lote', $input)) {
        $codigo = trim((string)$input['codigo_lote']);
        if ($codigo === '') {
            JsonResponse::error('codigo_lote no puede ser vacío', 400);
            return;
        }
        $fields[] = 'codigo_lote = :codigo_lote';
        $params[':codigo_lote'] = $codigo;
    }

    if (array_key_exists('fecha_vencimiento', $input)) {
        $fv = $input['fecha_vencimiento'];
        if ($fv !== null && $fv !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$fv)) {
            JsonResponse::error('fecha_vencimiento debe ser YYYY-MM-DD o null', 400);
            return;
        }
        $fields[] = 'fecha_vencimiento = :fecha_vencimiento';
        $params[':fecha_vencimiento'] = ($fv === '' ? null : $fv);
    }

    if (array_key_exists('costo_unitario', $input)) {
        $c = (float)$input['costo_unitario'];
        if ($c < 0) {
            JsonResponse::error('costo_unitario no puede ser negativo', 400);
            return;
        }
        $fields[] = 'costo_unitario = :costo_unitario';
        $params[':costo_unitario'] = $c;
    }

    if (empty($fields)) {
        JsonResponse::error('No hay campos válidos para actualizar', 400);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        $pdo = PDOFactory::getCluster(1);

        // Asegurar que existe y pertenece
        $stmt = $pdo->prepare("SELECT id FROM lotes WHERE id = :id AND farmacia_id = :farmacia_id");
        $stmt->execute([':id' => $id, ':farmacia_id' => $farmaciaId]);
        if (!$stmt->fetchColumn()) {
            JsonResponse::error('Lote no encontrado', 404);
            return;
        }

        $sql = "UPDATE lotes SET " . implode(', ', $fields) . " WHERE id = :id AND farmacia_id = :farmacia_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        JsonResponse::success(['message' => 'Lote actualizado']);
    } catch (\PDOException $e) {
        if ($e->getCode() == 23000) {
            JsonResponse::error('Conflicto: código de lote duplicado para este producto', 409);
        } else {
            JsonResponse::error('Error de base de datos: ' . $e->getMessage(), 500);
        }
    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

