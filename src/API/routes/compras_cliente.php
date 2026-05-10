<?php
/**
 * PharmaQuick - API Routes for Client Purchases (Simulated)
 * Endpoints para compras simuladas de clientes
 */

require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
require_once SRC_PATH . '/Core/JsonResponse.php';

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
        
        // Validar campos requeridos
        $required = ['items', 'total', 'metodo_pago', 'direccion', 'nombre', 'telefono'];
        foreach ($required as $field) {
            // Los nombres en el frontend pueden ser diferentes
            $fieldMap = [
                'direccion' => 'deliveryAddress',
                'nombre' => 'deliveryName', 
                'telefono' => 'deliveryPhone'
            ];
            $mappedField = $fieldMap[$field] ?? $field;
            
            if (!isset($input[$mappedField]) || empty($input[$mappedField])) {
                JsonResponse::error("Campo requerido: $field", 400);
                return;
            }
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
        
        // Obtener usuario_id desde la sesión/JWT
        $usuarioId = $input['usuario_id'] ?? 1;
        
        // Generar código de pedido único
        $codigoPedido = 'PED-' . strtoupper(bin2hex(random_bytes(4)));
        
        // Farmacia por defecto
        $farmaciaId = $input['farmacia_id'] ?? 1;
        
        // Conectar a la base de datos usando Master para tablas centrales
        $pdo = PDOFactory::getMaster();
        
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
            
            $stmt->execute([
                $usuarioId,
                $farmaciaId,
                $codigoPedido,
                $input['total'],
                $metodoPago,
                $input['deliveryAddress'],
                $input['deliveryName'],
                $input['deliveryPhone'],
                $input['deliveryNotes'] ?? null
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
            
            foreach ($input['items'] as $item) {
                $stmtDetalle->execute([
                    $compraId,
                    $item['producto_id'] ?? null,
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
                'direccion' => $input['direccion'],
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
        
        // Obtener compras del usuario
        $stmt = $pdo->prepare("
            SELECT 
                id,
                codigo_pedido,
                total,
                metodo_pago,
                estado,
                direccion_envio,
                nombre_recibe,
                telefono_contacto,
                observaciones,
                created_at
            FROM compras_cliente
            WHERE usuario_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        ");
        
        $stmt->execute([$usuarioId]);
        $compras = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Obtener detalles de cada compra
        foreach ($compras as &$compra) {
            $stmtDetalle = $pdo->prepare("
                SELECT 
                    producto_nombre,
                    cantidad,
                    precio_unitario,
                    subtotal
                FROM compras_detalle
                WHERE compra_id = ?
            ");
            
            $stmtDetalle->execute([$compra['id']]);
            $compra['items'] = $stmtDetalle->fetchAll(\PDO::FETCH_ASSOC);
            $compra['fecha'] = $compra['created_at'];
            unset($compra['created_at']);
        }
        
        JsonResponse::success(['data' => $compras]);
        
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
                id,
                codigo_pedido,
                total,
                metodo_pago,
                estado,
                direccion_envio,
                nombre_recibe,
                telefono_contacto,
                observaciones,
                created_at
            FROM compras_cliente
            WHERE codigo_pedido = ? AND usuario_id = ?
        ");
        
        $stmt->execute([$codigo, $usuarioId]);
        $compra = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$compra) {
            JsonResponse::error('Compra no encontrada', 404);
            return;
        }
        
        // Obtener detalles
        $stmtDetalle = $pdo->prepare("
            SELECT 
                producto_id,
                producto_nombre,
                cantidad,
                precio_unitario,
                subtotal
            FROM compras_detalle
            WHERE compra_id = ?
        ");
        
        $stmtDetalle->execute([$compra['id']]);
        $compra['items'] = $stmtDetalle->fetchAll(\PDO::FETCH_ASSOC);
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