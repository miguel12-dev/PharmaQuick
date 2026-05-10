<?php
/**
 * PharmaQuick - API Routes for User Cart
 * Endpoints para gestionar el carrito del usuario en base de datos
 */

require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
require_once SRC_PATH . '/Core/JsonResponse.php';

/**
 * GET /api/carrito - Obtener el carrito del usuario
 */
function handleGetCarrito() {
    try {
        // Usar helper con fallback
        $usuarioId = obtenerUsuarioIdConFallback();
        
        if (!$usuarioId) {
            JsonResponse::error('Usuario no identificado', 400);
            return;
        }
        
        $pdo = PDOFactory::getMaster();
        
        $stmt = $pdo->prepare("
            SELECT 
                id,
                producto_id,
                producto_nombre,
                producto_codigo_barras,
                cantidad,
                precio_unitario,
                farmacia_id,
                created_at
            FROM carritos
            WHERE usuario_id = ?
            ORDER BY created_at DESC
        ");
        
        $stmt->execute([$usuarioId]);
        $items = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Calcular total
        $total = 0;
        foreach ($items as $item) {
            $total += $item['cantidad'] * $item['precio_unitario'];
        }
        
        JsonResponse::success([
            'items' => $items,
            'total' => $total,
            'cantidad_items' => count($items)
        ]);
        
    } catch (\Throwable $e) {
        JsonResponse::error('Error al obtener el carrito: ' . $e->getMessage(), 500);
    }
}

/**
 * POST /api/carrito - Agregar producto al carrito
 */
function handlePostCarrito() {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            JsonResponse::error('Datos inválidos', 400);
            return;
        }
        
        // Usar helper con fallback
        $usuarioId = obtenerUsuarioIdConFallback();
        
        if (!$usuarioId) {
            JsonResponse::error('Usuario no identificado', 400);
            return;
        }
        
        // Validar campos requeridos
        if (!isset($input['producto_id']) || !isset($input['producto_nombre']) || 
            !isset($input['cantidad']) || !isset($input['precio_unitario'])) {
            JsonResponse::error('Campos requeridos: producto_id, producto_nombre, cantidad, precio_unitario', 400);
            return;
        }
        
        $productoId = $input['producto_id'];
        $productoNombre = $input['producto_nombre'];
        $cantidad = (int) $input['cantidad'];
        $precioUnitario = (float) $input['precio_unitario'];
        $farmaciaId = $input['farmacia_id'] ?? null;
        $codigoBarras = $input['producto_codigo_barras'] ?? null;
        
        if ($cantidad < 1) {
            JsonResponse::error('La cantidad debe ser mayor a 0', 400);
            return;
        }
        
        $pdo = PDOFactory::getMaster();
        
        // Verificar si el producto ya está en el carrito
        $stmtCheck = $pdo->prepare("
            SELECT id, cantidad FROM carritos 
            WHERE usuario_id = ? AND producto_id = ?
        ");
        $stmtCheck->execute([$usuarioId, $productoId]);
        $existingItem = $stmtCheck->fetch(\PDO::FETCH_ASSOC);
        
        if ($existingItem) {
            // Actualizar cantidad
            $newQuantity = $existingItem['cantidad'] + $cantidad;
            $stmtUpdate = $pdo->prepare("
                UPDATE carritos 
                SET cantidad = ?, updated_at = NOW() 
                WHERE id = ?
            ");
            $stmtUpdate->execute([$newQuantity, $existingItem['id']]);
            
            JsonResponse::success([
                'id' => $existingItem['id'],
                'action' => 'updated',
                'cantidad' => $newQuantity
            ], 'Cantidad actualizada en el carrito');
        } else {
            // Insertar nuevo item
            $stmtInsert = $pdo->prepare("
                INSERT INTO carritos (
                    usuario_id,
                    farmacia_id,
                    producto_id,
                    producto_nombre,
                    producto_codigo_barras,
                    cantidad,
                    precio_unitario
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmtInsert->execute([
                $usuarioId,
                $farmaciaId,
                $productoId,
                $productoNombre,
                $codigoBarras,
                $cantidad,
                $precioUnitario
            ]);
            
            JsonResponse::success([
                'id' => $pdo->lastInsertId(),
                'action' => 'created',
                'cantidad' => $cantidad
            ], 'Producto agregado al carrito', 201);
        }
        
    } catch (\Throwable $e) {
        JsonResponse::error('Error al agregar al carrito: ' . $e->getMessage(), 500);
    }
}

/**
 * PUT /api/carrito/{id} - Actualizar cantidad de un item
 */
function handlePutCarritoItem($itemId) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['cantidad'])) {
            JsonResponse::error('Cantidad requerida', 400);
            return;
        }
        
        $usuarioId = obtenerUsuarioIdDesdeJWT();
        
        if (!$usuarioId) {
            JsonResponse::error('Usuario no autenticado', 401);
            return;
        }
        
        $cantidad = (int) $input['cantidad'];
        
        if ($cantidad < 1) {
            // Eliminar el item si la cantidad es 0 o menor
            $pdo = PDOFactory::getMaster();
            $stmtDelete = $pdo->prepare("DELETE FROM carritos WHERE id = ? AND usuario_id = ?");
            $stmtDelete->execute([$itemId, $usuarioId]);
            
            JsonResponse::success(['action' => 'deleted'], 'Item eliminado del carrito');
            return;
        }
        
        $pdo = PDOFactory::getMaster();
        
        $stmtUpdate = $pdo->prepare("
            UPDATE carritos 
            SET cantidad = ?, updated_at = NOW() 
            WHERE id = ? AND usuario_id = ?
        ");
        
        $stmtUpdate->execute([$cantidad, $itemId, $usuarioId]);
        
        if ($stmtUpdate->rowCount() === 0) {
            JsonResponse::error('Item no encontrado', 404);
            return;
        }
        
        JsonResponse::success([
            'id' => $itemId,
            'cantidad' => $cantidad
        ], 'Cantidad actualizada');
        
    } catch (\Throwable $e) {
        JsonResponse::error('Error al actualizar el carrito: ' . $e->getMessage(), 500);
    }
}

/**
 * DELETE /api/carrito/{id} - Eliminar un item del carrito
 */
function handleDeleteCarritoItem($itemId) {
    try {
        $usuarioId = obtenerUsuarioIdConFallback();
        
        if (!$usuarioId) {
            JsonResponse::error('Usuario no identificado', 400);
            return;
        }
        
        $pdo = PDOFactory::getMaster();
        
        $stmtDelete = $pdo->prepare("DELETE FROM carritos WHERE id = ? AND usuario_id = ?");
        $stmtDelete->execute([$itemId, $usuarioId]);
        
        if ($stmtDelete->rowCount() === 0) {
            JsonResponse::error('Item no encontrado', 404);
            return;
        }
        
        JsonResponse::success(['action' => 'deleted'], 'Item eliminado del carrito');
        
    } catch (\Throwable $e) {
        JsonResponse::error('Error al eliminar del carrito: ' . $e->getMessage(), 500);
    }
}

/**
 * DELETE /api/carrito - Vaciar todo el carrito
 */
function handleDeleteCarrito() {
    try {
        $usuarioId = obtenerUsuarioIdConFallback();
        
        if (!$usuarioId) {
            JsonResponse::error('Usuario no identificado', 400);
            return;
        }
        
        $pdo = PDOFactory::getMaster();
        
        $stmtDelete = $pdo->prepare("DELETE FROM carritos WHERE usuario_id = ?");
        $stmtDelete->execute([$usuarioId]);
        
        JsonResponse::success(['action' => 'cleared', 'eliminados' => $stmtDelete->rowCount()], 'Carrito vaciado');
        
    } catch (\Throwable $e) {
        JsonResponse::error('Error al vaciar el carrito: ' . $e->getMessage(), 500);
    }
}

/**
 * Función helper para obtener el usuario desde el JWT
 */
function obtenerUsuarioIdDesdeJWT() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (!preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
        return null;
    }
    
    $token = $matches[1];
    $tokenParts = explode('.', $token);
    
    if (count($tokenParts) !== 3) {
        return null;
    }
    
    $payload = json_decode(base64_decode($tokenParts[1]), true);
    
    if (!$payload) {
        return null;
    }
    
    // Retornar el ID del usuario desde el JWT
    return $payload['sub'] ?? $payload['user_id'] ?? $payload['id'] ?? null;
}

/**
 * Función helper para obtener el usuario con fallback a query param
 */
function obtenerUsuarioIdConFallback() {
    // Primero intentar desde JWT
    $usuarioId = obtenerUsuarioIdDesdeJWT();
    
    // Si no hay JWT, intentar desde query param
    if (!$usuarioId && isset($_GET['usuario_id'])) {
        $usuarioId = (int) $_GET['usuario_id'];
    }
    
    return $usuarioId;
}