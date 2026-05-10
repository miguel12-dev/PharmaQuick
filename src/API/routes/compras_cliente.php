<?php
/**
 * PharmaQuick - API Routes for Client Purchases (Simulated)
 * Endpoints para compras simuladas de clientes
 */

require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
require_once SRC_PATH . '/Core/JsonResponse.php';

/**
 * Obtiene el prefijo del cluster para una farmacia
 */
function getClusterPrefix($pdoMaster, $farmaciaId) {
    $stmt = $pdoMaster->prepare("SELECT cluster_prefix FROM cluster_farmacias WHERE farmacia_id = ?");
    $stmt->execute([$farmaciaId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result['cluster_prefix'] ?? null;
}

/**
 * Obtiene la imagen de un producto desde su cluster
 */
function getProductImageFromCluster($pdoMaster, $productId, $farmaciaId, $productoNombre = null) {
    try {
        if (!$productId && !$productoNombre) {
            return null;
        }
        
        $clusterPrefix = getClusterPrefix($pdoMaster, $farmaciaId);
        
        if (!$clusterPrefix) {
            return null;
        }
        
        // Extraer el número del cluster del prefijo (ej: "db_cluster_1" -> 1)
        preg_match('/(?:db_)?cluster_(\d+)/', $clusterPrefix, $matches);
        $clusterNum = isset($matches[1]) ? (int)$matches[1] : null;
        
        if (!$clusterNum) {
            return null;
        }
        
        $pdoCluster = PDOFactory::getCluster($clusterNum);
        
        // Verificar si la columna imagen existe en el cluster
        try {
            $stmtCheckCol = $pdoCluster->query("SHOW COLUMNS FROM productos LIKE 'imagen'");
            $hasImagen = $stmtCheckCol->rowCount() > 0;
        } catch (\Exception $e) {
            $hasImagen = false;
        }
        
        if (!$hasImagen) {
            return null;
        }
        
        // Intentar primero por ID
        $imagen = null;
        if ($productId) {
            $stmt = $pdoCluster->prepare("SELECT imagen FROM productos WHERE id = ?");
            $stmt->execute([$productId]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            $imagen = $product['imagen'] ?? null;
        }
        
        // Si no found, buscar por nombre
        if (!$imagen && $productoNombre) {
            $stmt = $pdoCluster->prepare("SELECT imagen FROM productos WHERE LOWER(nombre) = LOWER(?) LIMIT 1");
            $stmt->execute([$productoNombre]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            $imagen = $product['imagen'] ?? null;
        }
        
        return $imagen;
    } catch (\Exception $e) {
        return null;
    }
}

/**
 * POST /api/compras - Crear una nueva compra simulada
 */
function handlePostCompra()
{
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
        
        // Validar campos principales
        $required = ['items', 'total', 'metodo_pago'];
        foreach ($required as $field) {
            if (!isset($input[$field]) || (is_string($input[$field]) && trim($input[$field]) === '')) {
                JsonResponse::error("Campo requerido: $field", 400);
                return;
            }
        }
        
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
        
        if (!is_array($input['items']) || count($input['items']) === 0) {
            JsonResponse::error('El carrito está vacío', 400);
            return;
        }
        
        // Validar método de pago
        $metodoPago = strtoupper($input['metodo_pago']);
        if (!in_array($metodoPago, ['TARJETA', 'NEQUI'])) {
            JsonResponse::error('Método de pago inválido', 400);
            return;
        }
        
        // Obtener usuario desde JWT del header Authorization
        $pdo = PDOFactory::getMaster();
        $usuarioId = null;
        
        // Intentar obtener el user ID desde el JWT
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            // Decodificar JWT manualmente para obtener el email o id
            $tokenParts = explode('.', $token);
            if (count($tokenParts) === 3) {
                $payload = json_decode(base64_decode($tokenParts[1]), true);
                if ($payload) {
                    // El JWT puede tener 'sub' (user id) o 'email'
                    $usuarioId = $payload['sub'] ?? $payload['user_id'] ?? $payload['id'] ?? null;
                    $userEmail = $payload['email'] ?? null;
                    
                    // Si tenemos email pero no ID, buscar por email
                    if (!$usuarioId && $userEmail) {
                        $stmtEmail = $pdo->prepare("SELECT id FROM usuarios WHERE email = ? AND activo = 1");
                        $stmtEmail->execute([$userEmail]);
                        $userFromEmail = $stmtEmail->fetch(\PDO::FETCH_ASSOC);
                        if ($userFromEmail) {
                            $usuarioId = $userFromEmail['id'];
                        }
                    }
                }
            }
        }
        
        // Si no se pudo obtener del JWT, usar el que envía el frontend
        if (!$usuarioId && isset($input['usuario_id'])) {
            $usuarioId = (int) $input['usuario_id'];
        }
        
        // Si aún no tenemos usuario, buscar uno válido automáticamente
        if (!$usuarioId) {
            // Buscar cualquier usuario activo con rol CLIENTE (case insensitive)
            $stmtCheck = $pdo->query("SELECT id FROM usuarios WHERE activo = 1 AND LOWER(rol) = 'cliente' LIMIT 1");
            $cliente = $stmtCheck->fetch(\PDO::FETCH_ASSOC);
            if ($cliente) {
                $usuarioId = $cliente['id'];
            } else {
                // Usar cualquier usuario activo
                $stmtCheck = $pdo->query("SELECT id FROM usuarios WHERE activo = 1 LIMIT 1");
                $anyUser = $stmtCheck->fetch(\PDO::FETCH_ASSOC);
                $usuarioId = $anyUser ? $anyUser['id'] : null;
            }
        }
        
        // Verificar que el usuario existe
        if ($usuarioId) {
            $stmtCheck = $pdo->prepare("SELECT id FROM usuarios WHERE id = ? AND activo = 1");
            $stmtCheck->execute([$usuarioId]);
            if (!$stmtCheck->fetch()) {
                $usuarioId = null;
            }
        }
        
        if (!$usuarioId) {
            JsonResponse::error('No se pudo identificar al usuario', 400);
            return;
        }
        
        // Generar código de pedido único
        $codigoPedido = 'PED-' . strtoupper(bin2hex(random_bytes(4)));
        
        // Farmacia por defecto
        $farmaciaId = $input['farmacia_id'] ?? 1;
        
        // Iniciar transacción
        $pdo->beginTransaction();
        
        try {
            // Insertar compra principal
            $stmt = $pdo->prepare("
                INSERT INTO compras_cliente (
                    usuario_id, 
                    farmacia_id, 
                    codigo_pedido, 
                    total, 
                    metodo_pago, 
                    estado,
                    direccion_envio, 
                    nombre_recibe, 
                    telefono_contacto,
                    observaciones
                ) VALUES (?, ?, ?, ?, ?, 'CONFIRMADA', ?, ?, ?, ?)
            ");
            
            // Usar los valores ya normalizados
            $stmt->execute([
                $usuarioId,
                $farmaciaId,
                $codigoPedido,
                $input['total'],
                $metodoPago,
                $deliveryAddress,
                $deliveryName,
                $deliveryPhone,
                $deliveryNotes
            ]);
            
            $compraId = $pdo->lastInsertId();
            
            // Insertar detalles de la compra
            // Los productos pueden estar en clusters (por farmacia) o en master
            // Verificar si el producto existe en master, si no usar NULL
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
            
            foreach ($input['items'] as $item) {
                $productoId = $item['producto_id'] ?? null;
                
                // Verificar si el producto existe en master o en el cluster de la farmacia
                if ($productoId) {
                    // Primero verificar en master
                    $stmtCheckProd = $pdo->prepare("SELECT id FROM productos WHERE id = ?");
                    $stmtCheckProd->execute([$productoId]);
                    $existsInMaster = $stmtCheckProd->fetch();
                    
                    if (!$existsInMaster) {
                        // Verificar en el cluster de la farmacia
                        try {
                            $clusterPrefix = getClusterPrefix($pdo, $farmaciaId);
                            if ($clusterPrefix) {
                                preg_match('/(?:db_)?cluster_(\d+)/', $clusterPrefix, $matches);
                                $clusterNum = isset($matches[1]) ? (int)$matches[1] : null;
                                if ($clusterNum) {
                                    $pdoCluster = PDOFactory::getCluster($clusterNum);
                                    $stmtCheckCluster = $pdoCluster->prepare("SELECT id FROM productos WHERE id = ?");
                                    $stmtCheckCluster->execute([$productoId]);
                                    if (!$stmtCheckCluster->fetch()) {
                                        $productoId = null;
                                    }
                                } else {
                                    $productoId = null;
                                }
                            } else {
                                $productoId = null;
                            }
                        } catch (\Exception $e) {
                            $productoId = null;
                        }
                    }
                }
                
                $stmtDetalle->execute([
                    $compraId,
                    $productoId,
                    $item['nombre'],
                    $item['cantidad'],
                    $item['precio'],
                    $item['precio'] * $item['cantidad']
                ]);
            }
            
            // Confirmar transacción
            $pdo->commit();
            
            JsonResponse::success([
                'id' => $compraId,
                'codigo_pedido' => $codigoPedido,
                'total' => $input['total'],
                'metodo_pago' => $metodoPago,
                'estado' => 'CONFIRMADA',
                'direccion' => $deliveryAddress,
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

/**
 * GET /api/compras - Obtener compras del cliente
 */
function handleGetCompras()
{
    try {
        // Obtener usuario_id (para testing usa 1)
        $usuarioId = $_GET['usuario_id'] ?? 1;
        $farmaciaId = $_GET['farmacia_id'] ?? 1;
        
        $pdo = PDOFactory::getMaster();
        
        // Obtener compras del usuario con nombre de farmacia
        $stmt = $pdo->prepare("
            SELECT 
                cc.id,
                cc.codigo_pedido,
                cc.total,
                cc.metodo_pago,
                cc.estado,
                cc.direccion_envio,
                cc.nombre_recibe,
                cc.telefono_contacto,
                cc.observaciones,
                cc.created_at,
                cc.farmacia_id,
                f.nombre AS nombre_farmacia,
                f.direccion AS direccion_farmacia,
                f.telefono AS telefono_farmacia
            FROM compras_cliente cc
            LEFT JOIN farmacias f ON cc.farmacia_id = f.id
            WHERE cc.usuario_id = ?
            ORDER BY cc.created_at DESC
            LIMIT 50
        ");
        
        $stmt->execute([$usuarioId]);
        $compras = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Obtener detalles de cada compra (incluyendo imagen del producto desde cluster)
        foreach ($compras as &$compra) {
            $stmtDetalle = $pdo->prepare("
                SELECT 
                    cd.producto_id,
                    cd.producto_nombre,
                    cd.cantidad,
                    cd.precio_unitario,
                    cd.subtotal
                FROM compras_detalle cd
                WHERE cd.compra_id = ?
            ");
            
            $stmtDetalle->execute([$compra['id']]);
            $items = $stmtDetalle->fetchAll(\PDO::FETCH_ASSOC);
            
            // Obtener imágenes desde el cluster de la farmacia
            $farmaciaId = $compra['farmacia_id'] ?? 1;
            foreach ($items as &$item) {
                $productoId = $item['producto_id'] ?? null;
                $productoNombre = $item['producto_nombre'] ?? null;
                $item['producto_imagen'] = getProductImageFromCluster($pdo, $productoId, $farmaciaId, $productoNombre);
            }
            
            $compra['items'] = $items;
            $compra['fecha'] = $compra['created_at'];
            unset($compra['created_at']);
        }
        
        JsonResponse::success($compras);
        
    } catch (\Throwable $e) {
        JsonResponse::error('Error al obtener compras: ' . $e->getMessage(), 500);
    }
}

/**
 * GET /api/compras/{codigo} - Obtener una compra específica
 */
function handleGetCompraByCodigo($codigo)
{
    try {
        $usuarioId = $_GET['usuario_id'] ?? 1;
        $farmaciaId = $_GET['farmacia_id'] ?? 1;
        
        $pdo = PDOFactory::getMaster();
        
        $stmt = $pdo->prepare("
            SELECT 
                cc.id,
                cc.codigo_pedido,
                cc.total,
                cc.metodo_pago,
                cc.estado,
                cc.direccion_envio,
                cc.nombre_recibe,
                cc.telefono_contacto,
                cc.observaciones,
                cc.created_at,
                cc.farmacia_id,
                f.nombre AS nombre_farmacia,
                f.direccion AS direccion_farmacia,
                f.telefono AS telefono_farmacia
            FROM compras_cliente cc
            LEFT JOIN farmacias f ON cc.farmacia_id = f.id
            WHERE cc.codigo_pedido = ? AND cc.usuario_id = ?
        ");
        
        $stmt->execute([$codigo, $usuarioId]);
        $compra = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$compra) {
            JsonResponse::error('Compra no encontrada', 404);
            return;
        }
        
        // Obtener detalles y buscar imágenes en el cluster de la farmacia
        $stmtDetalle = $pdo->prepare("
            SELECT 
                cd.producto_id,
                cd.producto_nombre,
                cd.cantidad,
                cd.precio_unitario,
                cd.subtotal
            FROM compras_detalle cd
            WHERE cd.compra_id = ?
        ");
        
        $stmtDetalle->execute([$compra['id']]);
        $items = $stmtDetalle->fetchAll(\PDO::FETCH_ASSOC);
        
        // Obtener imágenes desde el cluster de la farmacia
        $farmaciaId = $compra['farmacia_id'] ?? 1;
        foreach ($items as &$item) {
            $productoId = $item['producto_id'] ?? null;
            $productoNombre = $item['producto_nombre'] ?? null;
            $item['producto_imagen'] = getProductImageFromCluster($pdo, $productoId, $farmaciaId, $productoNombre);
        }
        
        $compra['items'] = $items;
        $compra['fecha'] = $compra['created_at'];
        unset($compra['created_at']);
        
        JsonResponse::success($compra);
        
    } catch (\Throwable $e) {
        JsonResponse::error('Error al obtener la compra: ' . $e->getMessage(), 500);
    }
}

/**
 * POST /api/compras/metodo-pago - Guardar método de pago (opcional)
 */
function handlePostMetodoPago()
{
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            JsonResponse::error('Datos inválidos', 400);
            return;
        }
        
        $usuarioId = $input['usuario_id'] ?? 1;
        $tipo = strtoupper($input['tipo']);
        
        if (!in_array($tipo, ['TARJETA', 'NEQUI'])) {
            JsonResponse::error('Tipo de método de pago inválido', 400);
            return;
        }
        
        $pdo = PDOFactory::getMaster();
        
        $stmt = $pdo->prepare("
            INSERT INTO metodos_pago_cliente (
                usuario_id,
                tipo,
                ultimo_digito,
                tipo_tarjeta,
                telefono
            ) VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $usuarioId,
            $tipo,
            $input['ultimo_digito'] ?? null,
            $input['tipo_tarjeta'] ?? null,
            $input['telefono'] ?? null
        ]);
        
        JsonResponse::success([
            'id' => $pdo->lastInsertId()
        ], 'Método de pago guardado');
        
    } catch (\Throwable $e) {
        JsonResponse::error('Error al guardar método de pago: ' . $e->getMessage(), 500);
    }
}

/**
 * GET /api/compras/metodos-pago - Listar métodos de pago del cliente
 */
function handleGetMetodosPago()
{
    try {
        $usuarioId = $_GET['usuario_id'] ?? 1;
        
        $pdo = PDOFactory::getMaster();
        
        $stmt = $pdo->prepare("
            SELECT id, tipo, ultimo_digito, tipo_tarjeta, telefono, activo, created_at
            FROM metodos_pago_cliente
            WHERE usuario_id = ? AND activo = TRUE
            ORDER BY created_at DESC
        ");
        
        $stmt->execute([$usuarioId]);
        $metodos = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        JsonResponse::success(['data' => $metodos]);
        
    } catch (\Throwable $e) {
        JsonResponse::error('Error al obtener métodos de pago: ' . $e->getMessage(), 500);
    }
}