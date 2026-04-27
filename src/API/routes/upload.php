<?php
/**
 * PharmaQuick - Upload de Imagenes
 * Maneja /api/productos/{id}/imagen - SUBIR imagen de producto
 */

function handleUploadProductImage(int $productoId): void {
    $farmaciaId = Auth::farmaciaId();
    $userId = Auth::userId();
    
    if (!$farmaciaId) {
        JsonResponse::error('No autenticado', 401);
        return;
    }
    
    // Verificar rol
    if (!Auth::isAdmin()) {
        JsonResponse::error('No tiene permisos para subir imágenes', 403);
        return;
    }
    
    // Verificar que el producto existe
    require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
    require_once SRC_PATH . '/Infrastructure/Persistence/ProductoRepository.php';
    
    $pdo = PDOFactory::getCluster(1);
    $repo = new ProductoRepository($pdo);
    
    $producto = $repo->findByIdGlobal($productoId);
    if (!$producto) {
        JsonResponse::error('Producto no encontrado', 404);
        return;
    }
    
    // Verificar archivo
    if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
        JsonResponse::error('No se recibió ninguna imagen', 400);
        return;
    }
    
    $file = $_FILES['imagen'];
    
    // Validar tipo
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        JsonResponse::error('Tipo de archivo no permitido. Use JPG, PNG, GIF o WebP', 400);
        return;
    }
    
    // Validar tamaño (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        JsonResponse::error('La imagen no puede superar 5MB', 400);
        return;
    }
    
    try {
        // Segmentación por farmacia (Requisito: /public/uploads/productos/{id_farmacia}/imagenes)
        $relativeDir = "/uploads/productos/" . $farmaciaId . "/imagenes";
        $uploadDir = BASE_PATH . "/public" . $relativeDir;
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generar nombre único
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $nombreArchivo = $productoId . '_' . time() . '.' . $extension;
        $rutaArchivo = $uploadDir . '/' . $nombreArchivo;
        
        // Mover archivo
        if (!move_uploaded_file($file['tmp_name'], $rutaArchivo)) {
            JsonResponse::error('Error al guardar la imagen', 500);
            return;
        }
        
        // Guardar la ruta relativa completa en la DB para fácil acceso
        $dbRuta = $relativeDir . '/' . $nombreArchivo;
        
        // Eliminar imagen anterior si existe
        if (!empty($producto['imagen'])) {
            $imagenAnterior = BASE_PATH . "/public" . $producto['imagen'];
            if (file_exists($imagenAnterior)) {
                unlink($imagenAnterior);
            }
        }
        
        // Actualizar registro
        $success = $repo->update($productoId, ['imagen' => $dbRuta]);
        
        if ($success) {
            JsonResponse::success([
                'imagen' => $nombreArchivo,
                'url' => $dbRuta,
                'message' => 'Imagen subida correctamente'
            ]);
        } else {
            // Eliminar archivo si falla el update
            unlink($rutaArchivo);
            JsonResponse::error('Error al actualizar el producto', 500);
        }
        
    } catch (\Throwable $e) {
        JsonResponse::error('Error de servidor: ' . $e->getMessage(), 500);
    }
}