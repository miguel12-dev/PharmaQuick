<?php
/**
 * PharmaQuick - API Routes for User Cart
 * Endpoints para gestionar el carrito del usuario en base de datos
 */

require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
require_once SRC_PATH . '/Core/JsonResponse.php';

// Debug: Registrar entrada a las funciones
error_log("=== Carrito API chamada ===");
error_log("Method: " . ($_SERVER['REQUEST_METHOD'] ?? 'unknown'));
error_log("URI: " . ($_SERVER['REQUEST_URI'] ?? 'unknown'));
error_log("Authorization: " . ($_SERVER['HTTP_AUTHORIZATION'] ?? 'NO HEADER'));

/**
 * GET /api/carrito - Obtener el carrito del usuario
 */
function handleGetCarrito() {
    try {
        // Intentar obtener desde JWT primero, luego desde query param
        $usuarioId = obtenerUsuarioIdDesdeJWT();
        
        // Si no hay JWT, usar el usuario_id del query param (para testing)
        if (!$usuarioId && isset($_GET['usuario_id'])) {
            $usuarioId = (int) $_GET['usuario_id'];
        }
        
        // Si aún no hay usuario, usar el primero disponible (fallback para testing)
        if (!$usuarioId) {
            $pdo = PDOFactory::getMaster();
            $stmtUser = $pdo->query("SELECT id FROM usuarios WHERE activo = 1 LIMIT 1");
            $user = $stmtUser->fetch(\PDO::FETCH_ASSOC);
            if ($user) {
                $usuarioId = $user['id'];
            }
        }
        
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
        
        // Intentar obtener desde JWT primero, luego desde input
        $usuarioId = obtenerUsuarioIdDesdeJWT();
        
        // Si no hay JWT, usar el usuario_id del input directamente (para testing)
        if (!$usuarioId && isset($input['usuario_id'])) {
            $usuarioId = (int) $input['usuario_id'];
        }
        
        // Si aún no hay usuario, intentar con el primero disponible (fallback para testing)
        if (!$usuarioId) {
            $pdo = PDOFactory::getMaster();
            $stmtUser = $pdo->query("SELECT id FROM usuarios WHERE activo = 1 LIMIT 1");
            $user = $stmtUser->fetch(\PDO::FETCH_ASSOC);
            if ($user) {
                $usuarioId = $user['id'];
            }
        }
        
        if (!$usuarioId) {
            JsonResponse::error('Usuario no identificado', 400);
            return;
        }
        
        error_log("handlePostCarrito: usuarioId = " . $usuarioId);
        
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
        $usuarioId = obtenerUsuarioIdDesdeJWT();
        
        if (!$usuarioId) {
            JsonResponse::error('Usuario no autenticado', 401);
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
        $usuarioId = obtenerUsuarioIdDesdeJWT();
        
        if (!$usuarioId) {
            JsonResponse::error('Usuario no autenticado', 401);
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
    error_log("obtenerUsuarioIdDesdeJWT: Auth header: " . substr($authHeader, 0, 50));
    
    if (!preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
        error_log("obtenerUsuarioIdDesdeJWT: No hay Bearer token, buscando en input");
        // Si no hay JWT, intentar desde el input
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['usuario_id'] ?? null;
        error_log("obtenerUsuarioIdDesdeJWT: usuario_id desde input: " . var_export($userId, true));
        return $userId;
    }
    
    $token = $matches[1];
    error_log("obtenerUsuarioIdDesdeJWT: Token: " . substr($token, 0, 30) . "...");
    
    $tokenParts = explode('.', $token);
    
    if (count($tokenParts) !== 3) {
        error_log("obtenerUsuarioIdDesdeJWT: Token no tiene 3 partes");
        return null;
    }
    
    $payload = json_decode(base64_decode($tokenParts[1]), true);
    error_log("obtenerUsuarioIdDesdeJWT: Payload: " . json_encode($payload));
    
    if (!$payload) {
        return null;
    }
    
    // Retornar el ID del usuario desde el JWT
    $userId = $payload['sub'] ?? $payload['user_id'] ?? $payload['id'] ?? null;
    error_log("obtenerUsuarioIdDesdeJWT: Usuario ID encontrado: " . var_export($userId, true));
    return $userId;
}