<?php

declare(strict_types=1);

/**
 * PharmaQuick - Rutas de Productos
 * 
 * Maneja /api/productos - Rutas protegidas con JWT
 */

/**
 * Construye URL pública para imagen almacenada en DB.
 * En DB se guarda una ruta relativa tipo "/uploads/...".
 */
function buildProductoImagenUrl(?string $imagenDbPath): ?string {
    if (!$imagenDbPath) return null;

    // El docroot ya es `public/`, por lo que una ruta DB "/uploads/..."
    // debe exponerse como "/uploads/..." (NO "/public/uploads/...").
    if (strpos($imagenDbPath, '/uploads/') === 0) return $imagenDbPath;

    // Fallback: devolver tal cual (por compatibilidad)
    return $imagenDbPath;
}

/**
 * Ajusta el stock total (sumatoria de lotes) creando movimientos de inventario.
 * Respeta el trigger `trg_kardex_stock` (no actualiza lotes.stock_actual directo).
 */
function setProductoStockTotal(
    PDO $pdo, 
    int $productoId, 
    int $farmaciaId, 
    int $usuarioId, 
    int $desiredStock, 
    ?string $codigoLote = null, 
    ?string $fechaVencimiento = null,
    ?int $loteId = null
): void {
    if ($desiredStock < 0) {
        throw new \InvalidArgumentException('stock_total no puede ser negativo');
    }

    // Stock actual total
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(stock_actual), 0) AS stock_total
        FROM lotes
        WHERE producto_id = :producto_id AND farmacia_id = :farmacia_id
    ");
    $stmt->execute([':producto_id' => $productoId, ':farmacia_id' => $farmaciaId]);
    $current = (int)($stmt->fetchColumn() ?: 0);

    $delta = $desiredStock - $current;
    if ($delta === 0 && empty($codigoLote)) {
        return; // Sin cambios relevantes
    }

    error_log("setProductoStockTotal: prod=$productoId, farm=$farmaciaId, stock=$desiredStock, lote=$codigoLote, venc=$fechaVencimiento");
    
    // Si se proporciona un lote específico (o ID), lo usamos (o creamos/actualizamos)
    $targetLoteId = $loteId;
    if (!empty($codigoLote) || !empty($loteId)) {
        require_once SRC_PATH . '/Infrastructure/Persistence/LoteRepository.php';
        $loteRepo = new \PharmaQuick\Infrastructure\Persistence\LoteRepository($pdo);
        $targetLoteId = $loteRepo->upsert([
            'id' => $loteId,
            'producto_id' => $productoId,
            'farmacia_id' => $farmaciaId,
            'codigo_lote' => $codigoLote,
            'fecha_vencimiento' => $fechaVencimiento,
            'costo_unitario' => 0
        ]);
    }

    // Lotes disponibles orden FEFO (NULL vencimiento al final) para repartir salidas si aplica
    $stmt = $pdo->prepare("
        SELECT id, stock_actual, fecha_vencimiento
        FROM lotes
        WHERE producto_id = :producto_id AND farmacia_id = :farmacia_id
        ORDER BY (fecha_vencimiento IS NULL) ASC, fecha_vencimiento ASC, id ASC
    ");
    $stmt->execute([':producto_id' => $productoId, ':farmacia_id' => $farmaciaId]);
    $lotes = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    // Si no hay lote y no se pasó uno, creamos uno "AJUSTE" (fallback)
    if (empty($lotes) && !$targetLoteId) {
        $stmt = $pdo->prepare("
            INSERT INTO lotes (producto_id, farmacia_id, codigo_lote, fecha_vencimiento, costo_unitario, stock_actual, stock_reservado)
            VALUES (:producto_id, :farmacia_id, :codigo_lote, NULL, 0, 0, 0)
        ");
        $stmt->execute([
            ':producto_id' => $productoId,
            ':farmacia_id' => $farmaciaId,
            ':codigo_lote' => 'AJUSTE',
        ]);

        $targetLoteId = (int)$pdo->lastInsertId();
        $lotes = [[
            'id' => $targetLoteId,
            'stock_actual' => 0,
            'fecha_vencimiento' => null,
        ]];
    }

    // Helpers: insertar movimiento
    $insertMov = function(int $loteId, string $tipo, int $cantidad) use ($pdo, $farmaciaId, $usuarioId): void {
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
    };

    if ($delta > 0) {
        // Entradas: agregar al lote especificado o al primero disponible
        $loteId = $targetLoteId ?: (int)$lotes[0]['id'];
        $insertMov($loteId, 'ENTRADA', $delta);
        return;
    }

    if ($delta < 0) {
        // Salidas: repartir descontando por FEFO según stock actual
        $toRemove = abs($delta);
        foreach ($lotes as $l) {
            $loteId = (int)$l['id'];
            $available = (int)($l['stock_actual'] ?? 0);
            if ($available <= 0) continue;
            if ($toRemove <= 0) break;

            $take = min($available, $toRemove);
            $insertMov($loteId, 'SALIDA', $take);
            $toRemove -= $take;
        }

        if ($toRemove > 0.0005) {
            throw new \RuntimeException('No hay stock suficiente en lotes para realizar el ajuste');
        }
    }
}

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
        foreach ($productos as &$p) {
            $p['imagen_url'] = buildProductoImagenUrl($p['imagen'] ?? null);
        }
        unset($p);

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
        
        // Primero buscar con filtro de farmacia (productos con lotes)
        $producto = $repo->findById($id, $farmaciaId);
        
        // Si no tiene lotes, buscar en catálogo global PERO solo si el producto está activo
        // Esto es necesario para crear precios de productos nuevos
        if (!$producto) {
            $producto = $repo->findByIdGlobal($id);
            if ($producto && isset($producto['activo']) && $producto['activo']) {
                $producto['stock_total'] = 0;
                $producto['codigo'] = $producto['codigo_barras'];
            }
        }

        if (!$producto) {
            JsonResponse::error('Producto no encontrado', 404);
            return;
        }

        $producto['imagen_url'] = buildProductoImagenUrl($producto['imagen'] ?? null);
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

    $query = isset($_GET['q']) ? trim($_GET['q']) : (isset($_GET['search']) ? trim($_GET['search']) : '');
    $categoria = isset($_GET['categoria']) ? trim($_GET['categoria']) : '';
    
    if (strlen($query) < 2 && $categoria === '') {
        JsonResponse::error('Buscar mínimo 2 caracteres o seleccionar una categoría. Debug: ' . json_encode($_GET), 400);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);
        
        // Usar searchGlobal para permitir encontrar productos que no tienen lotes aún
        $productos = $repo->searchGlobal($query, $categoria);

        foreach ($productos as &$p) {
            $p['imagen_url'] = buildProductoImagenUrl($p['imagen'] ?? null);
        }
        unset($p);

        JsonResponse::success([
            'productos' => $productos,
            'total' => count($productos),
            'query' => $query,
            'categoria' => $categoria
        ]);

    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handleGetCategorias(): void {
    if (!Auth::farmaciaId()) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);
        $categorias = $repo->getCategorias();

        JsonResponse::success([
            'categorias' => $categorias,
            'total' => count($categorias)
        ]);
    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handlePostProductos(): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    if (!Auth::isAdmin()) {
        JsonResponse::error('No tiene permisos para crear productos', 403);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }
    
    file_put_contents(BASE_PATH . '/debug_api.json', json_encode(['input' => $input, 'post' => $_POST, 'files' => $_FILES], JSON_PRETTY_PRINT));
    if (empty($input) && empty($_FILES)) {
        JsonResponse::error('No se recibieron datos válidos en la petición', 400);
        return;
    }

    $nombre = isset($input['nombre']) ? trim($input['nombre']) : '';
    if (empty($nombre)) {
        JsonResponse::error('El nombre del producto es requerido', 400);
        return;
    }
    $precio = isset($input['precio']) ? (float)$input['precio'] : 0.0;
    $stockDesired = null;
    if (isset($input['stock_total'])) {
        $stockDesired = (int)$input['stock_total'];
    } elseif (isset($input['stock'])) {
        $stockDesired = (int)$input['stock'];
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);

        $productoId = $repo->create([
            'nombre' => $nombre,
            'codigo_barras' => $input['codigo_barras'] ?? null,
            'descripcion' => $input['descripcion'] ?? null,
            'categoria' => $input['categoria'] ?? null,
            'presentacion' => $input['presentacion'] ?? null,
            'activo' => isset($input['activo']) ? (bool)$input['activo'] : true,
        ]);

        // Si viene precio, persistir como precio activo en tabla precios para esta farmacia
        if ($precio > 0) {
            require_once SRC_PATH . '/Infrastructure/Persistence/PrecioRepository.php';
            require_once SRC_PATH . '/Domain/Services/PrecioService.php';
            $precioRepo = new PrecioRepository($pdo);
            $precioService = new PrecioService($precioRepo, $repo);
            $precioService->crearYActivar($productoId, $farmaciaId, $precio);
        }
        // Extraer datos de inventario
        $stockDesired = isset($input['stock_total']) ? (int)$input['stock_total'] : null;
        $codigoLote = (isset($input['codigo_lote']) && trim($input['codigo_lote']) !== '') ? trim($input['codigo_lote']) : null;
        $fechaVencimiento = (isset($input['fecha_vencimiento']) && trim($input['fecha_vencimiento']) !== '') ? trim($input['fecha_vencimiento']) : null;
        $usuarioId = Auth::userId() ?? 0;

        // Persistir stock y lote si se proporciona alguno de los dos
        if ($stockDesired !== null || $codigoLote !== null) {
            setProductoStockTotal(
                $pdo, 
                $productoId, 
                $farmaciaId, 
                (int)$usuarioId, 
                (int)($stockDesired ?? 0),
                $codigoLote,
                $fechaVencimiento
            );
        }

        // Si hay una imagen en la misma petición, procesarla
        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            require_once ROUTES_PATH . '/upload.php';
            handleUploadProductImage($productoId);
            return;
        }

        JsonResponse::success([
            'message' => 'Producto creado',
            'producto_id' => $productoId,
        ], 201);

    } catch (\PDOException $e) {
        if ($e->getCode() == 23000) {
            JsonResponse::error('El código de barras ya existe', 400);
        } else {
            JsonResponse::error('Error de base de datos: ' . $e->getMessage(), 500);
        }
    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handlePutProductos(int $id): void {
    $farmaciaId = Auth::farmaciaId();
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    if (!Auth::isAdmin()) {
        JsonResponse::error('No tiene permisos para modificar productos', 403);
        return;
    }

    // PUT no soporta nativamente multipart/form-data en PHP ($_FILES está vacío)
    // Para simplificar, si el cliente envía FormData, usaremos POST con un campo _method=PUT o similar,
    // o simplemente manejaremos la imagen por separado como antes.
    // Pero si es multipart/form-data tradicional, leeremos de php://input y parsearemos.
    // Sin embargo, para SPA es mejor que el Edit también pueda enviar imagen.
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);

        $producto = $repo->findByIdGlobal($id);
        if (!$producto) {
            JsonResponse::error('Producto no encontrado', 404);
            return;
        }

        $precio = null;
        if (isset($input['precio'])) {
            $precio = (float)$input['precio'];
            unset($input['precio']);
        }

        // Ajuste de stock_total (si viene)
        // Puede llegar como stock_total o stock (por compatibilidad)
        $stockDesired = null;
        if (isset($input['stock_total'])) {
            $stockDesired = (int)$input['stock_total'];
            unset($input['stock_total']);
        } elseif (isset($input['stock'])) {
            $stockDesired = (int)$input['stock'];
            unset($input['stock']);
        }

        // Actualizar datos básicos del producto (catálogo global)
        if (!empty($input)) {
            $repo->update($id, $input);
        }

        // Si viene precio, persistir como precio activo (tabla precios)
        if ($precio !== null && $precio > 0) {
            require_once SRC_PATH . '/Infrastructure/Persistence/PrecioRepository.php';
            require_once SRC_PATH . '/Domain/Services/PrecioService.php';
            $precioRepo = new PrecioRepository($pdo);
            $precioService = new PrecioService($precioRepo, $repo);
            $precioService->crearYActivar($id, $farmaciaId, $precio);
        }

        // Aplicar ajuste de stock vía Kardex
        if ($stockDesired !== null) {
            $usuarioId = Auth::userId() ?? 0;
            if (!$usuarioId) {
                JsonResponse::error('Usuario no autenticado', 401);
                return;
            }
            
            $codigoLote = (isset($input['codigo_lote']) && trim($input['codigo_lote']) !== '') ? trim($input['codigo_lote']) : null;
            $fechaVencimiento = (isset($input['fecha_vencimiento']) && trim($input['fecha_vencimiento']) !== '') ? trim($input['fecha_vencimiento']) : null;
            $loteId = (isset($input['lote_id']) && (int)$input['lote_id'] > 0) ? (int)$input['lote_id'] : null;

            setProductoStockTotal(
                $pdo, 
                $id, 
                $farmaciaId, 
                (int)$usuarioId, 
                $stockDesired,
                $codigoLote,
                $fechaVencimiento,
                $loteId
            );
        }

        // Procesar imagen si viene (PHP solo llena $_FILES en POST)
        // Si el cliente envía FormData vía PUT, $_FILES suele estar vacío.
        // El frontend debe usar el endpoint de imagen dedicado o enviar vía POST con override.
        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            require_once ROUTES_PATH . '/upload.php';
            handleUploadProductImage($id);
            return;
        }

        JsonResponse::success(['message' => 'Producto actualizado']);

    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}

function handleDeleteProductos(int $id): void {
    $farmaciaId = Auth::farmaciaId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }

    // Verificar rol desde BD
    if (!Auth::isAdmin()) {
        JsonResponse::error('No tiene permisos para eliminar productos', 403);
        return;
    }

    try {
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';

        $pdo = PDOFactory::getCluster(1);
        $repo = new ProductoRepository($pdo);

        // Verificar que existe (usando método global)
        $producto = $repo->findByIdGlobal($id);
        if (!$producto) {
            JsonResponse::error('Producto no encontrado', 404);
            return;
        }

        // En lugar de eliminar, marcar como inactivo
        $success = $repo->update($id, ['activo' => false]);

        if ($success) {
            JsonResponse::success(['message' => 'Producto eliminado (inactivado)']);
        } else {
            JsonResponse::error('Error al eliminar', 500);
        }

    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}
