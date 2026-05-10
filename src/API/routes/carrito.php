<?php
/**
 * PharmaQuick - API Routes for User Cart
 * Endpoints para gestionar el carrito del usuario en base de datos
 */

require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
require_once SRC_PATH . '/Core/JsonResponse.php';
require_once SRC_PATH . '/Infrastructure/Services/EmailService.php';

// Costo de envío por defecto
define('SHIPPING_COST_DEFAULT', 3000);

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

/**
 * Obtener email del usuario desde la base de datos
 */
function obtenerEmailUsuario(int $usuarioId, $pdo): ?string {
    try {
        $stmt = $pdo->prepare("SELECT email FROM usuarios WHERE id = ? LIMIT 1");
        $stmt->execute([$usuarioId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $user['email'] ?? null;
    } catch (\Throwable $e) {
        error_log("Error al obtener email del usuario: " . $e->getMessage());
        return null;
    }
}

/**
 * POST /api/carrito/comprar - Procesar compra desde el carrito
 * Este endpoint obtiene los items del carrito, procesa el pago y crea la compra
 */
function handlePostCarritoCompra() {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            JsonResponse::error('Datos inválidos', 400);
            return;
        }
        
        // Normalizar nombres de campos - aceptar ambos formatos (frontend y backend)
        $fieldAliases = [
            'direccion' => ['deliveryAddress', 'direccion'],
            'nombre' => ['deliveryName', 'nombre'],
            'telefono' => ['deliveryPhone', 'telefono'],
            'observaciones' => ['deliveryNotes', 'observaciones']
        ];
        
        // Función helper para obtener valor con alias
        $getFieldValue = function($fieldName) use ($input, $fieldAliases) {
            if (isset($fieldAliases[$fieldName])) {
                foreach ($fieldAliases[$fieldName] as $alias) {
                    if (isset($input[$alias]) && is_string($input[$alias])) {
                        $val = trim($input[$alias]);
                        if ($val !== '') return $val;
                    }
                }
            }
            return null;
        };
        
        // Extraer valores de campos de entrega
        $deliveryAddress = $getFieldValue('direccion');
        $deliveryName = $getFieldValue('nombre');
        $deliveryPhone = $getFieldValue('telefono');
        $deliveryNotes = $getFieldValue('observaciones');
        
        // Validar campos de entrega
        if (!$deliveryAddress) {
            JsonResponse::error("Campo requerido: direccion", 400);
            return;
        }
        if (!$deliveryName) {
            JsonResponse::error("Campo requerido: nombre", 400);
            return;
        }
        if (!$deliveryPhone) {
            JsonResponse::error("Campo requerido: telefono", 400);
            return;
        }
        
        // Validar método de pago
        $metodoPago = strtoupper($input['metodo_pago'] ?? 'TARJETA');
        if (!in_array($metodoPago, ['TARJETA', 'NEQUI'])) {
            JsonResponse::error('Método de pago inválido', 400);
            return;
        }
        
        // Validar método de entrega (ENVIO o RECOGER)
        $metodoEntrega = strtoupper($input['metodo_entrega'] ?? 'ENVIO');
        if (!in_array($metodoEntrega, ['ENVIO', 'RECOGER'])) {
            JsonResponse::error('Método de entrega inválido', 400);
            return;
        }
        
        // Calcular costo de envío (solo si es ENVIO)
        $costoEnvio = ($metodoEntrega === 'ENVIO') ? SHIPPING_COST_DEFAULT : 0;
        
        // Para método RECOGER, usar N/A
        if ($metodoEntrega === 'RECOGER') {
            $deliveryAddress = 'N/A - Recoger en tienda';
        }
        
        // Obtener usuario
        $usuarioId = obtenerUsuarioIdConFallback();
        
        if (!$usuarioId) {
            JsonResponse::error('Usuario no identificado', 400);
            return;
        }
        
        $pdo = PDOFactory::getMaster();
        
        // Obtener items del carrito
        $stmtCarrito = $pdo->prepare("
            SELECT 
                id,
                producto_id,
                producto_nombre,
                cantidad,
                precio_unitario,
                farmacia_id
            FROM carritos
            WHERE usuario_id = ?
            ORDER BY created_at DESC
        ");
        
        $stmtCarrito->execute([$usuarioId]);
        $items = $stmtCarrito->fetchAll(\PDO::FETCH_ASSOC);
        
        if (count($items) === 0) {
            JsonResponse::error('El carrito está vacío', 400);
            return;
        }
        
        // Calcular total (incluyendo costo de envío si aplica)
        $subtotal = 0;
        foreach ($items as $item) {
            $subtotal += $item['cantidad'] * $item['precio_unitario'];
        }
        $total = $subtotal + $costoEnvio;
        
        // Generar código de pedido único
        $codigoPedido = 'PED-' . strtoupper(bin2hex(random_bytes(4)));
        
        // Farmacia por defecto (primera del carrito o 1)
        $farmaciaId = $items[0]['farmacia_id'] ?? 1;
        
        // Iniciar transacción
        $pdo->beginTransaction();
        
        try {
            // Insertar compra principal
            $stmtCompra = $pdo->prepare("
                INSERT INTO compras_cliente (
                    usuario_id, 
                    farmacia_id, 
                    codigo_pedido, 
                    subtotal,
                    costo_envio,
                    total, 
                    metodo_pago, 
                    metodo_entrega,
                    estado,
                    direccion_envio, 
                    nombre_recibe, 
                    telefono_contacto,
                    observaciones
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMADA', ?, ?, ?, ?)
            ");
            
            $stmtCompra->execute([
                $usuarioId,
                $farmaciaId,
                $codigoPedido,
                $subtotal,
                $costoEnvio,
                $total,
                $metodoPago,
                $metodoEntrega,
                $deliveryAddress,
                $deliveryName,
                $deliveryPhone,
                $deliveryNotes
            ]);
            
            $compraId = $pdo->lastInsertId();
            
            // Insertar detalles de la compra
            $stmtDetalle = $pdo->prepare("
                INSERT INTO compras_detalle (
                    compra_id,
                    producto_id,
                    producto_nombre,
                    cantidad,
                    precio_unitario,
                    subtotal
                ) VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            // Verificar productos existentes
            $stmtCheckProduct = $pdo->prepare("SELECT id FROM productos WHERE id = ?");
            
            foreach ($items as $item) {
                // Verificar si el producto existe
                $productoId = $item['producto_id'];
                $stmtCheckProduct->execute([$productoId]);
                $productoExists = $stmtCheckProduct->fetch();
                
                // Si no existe, usar NULL
                $insertProductoId = $productoExists ? $productoId : null;
                
                $stmtDetalle->execute([
                    $compraId,
                    $insertProductoId,
                    $item['producto_nombre'],
                    $item['cantidad'],
                    $item['precio_unitario'],
                    $item['cantidad'] * $item['precio_unitario']
                ]);
            }
            
            // Vaciar el carrito después de la compra
            $stmtVaciar = $pdo->prepare("DELETE FROM carritos WHERE usuario_id = ?");
            $stmtVaciar->execute([$usuarioId]);
            
            // Confirmar transacción
            $pdo->commit();
            
            // Enviar correo de confirmación si el método de pago es NEQUI
            if ($metodoPago === 'NEQUI') {
                $userEmail = obtenerEmailUsuario($usuarioId, $pdo);
                if ($userEmail) {
                    $emailService = new EmailService();
                    $emailService->sendPurchaseConfirmation(
                        $userEmail,
                        $deliveryName,
                        $codigoPedido,
                        $total,
                        $metodoPago,
                        $metodoEntrega,
                        ($metodoEntrega === 'ENVIO') ? $deliveryAddress : null,
                        $items
                    );
                }
            }
            
            JsonResponse::success([
                'id' => $compraId,
                'codigo_pedido' => $codigoPedido,
                'subtotal' => $subtotal,
                'costo_envio' => $costoEnvio,
                'total' => $total,
                'metodo_pago' => $metodoPago,
                'metodo_entrega' => $metodoEntrega,
                'estado' => 'CONFIRMADA',
                'direccion' => $deliveryAddress,
                'nombre' => $deliveryName,
                'telefono' => $deliveryPhone,
                'items_count' => count($items),
                'fecha' => date('Y-m-d H:i:s')
            ], 'Compra procesada exitosamente');
            
        } catch (\Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } catch (\Throwable $e) {
        JsonResponse::error('Error al procesar la compra: ' . $e->getMessage(), 500);
    }
}