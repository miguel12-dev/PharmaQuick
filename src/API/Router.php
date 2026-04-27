<?php

declare(strict_types=1);

/**
 * PharmaQuick - Router
 *
 * Sistema de enrutamiento con middleware JWT
 * 
 * @version 1.0.0
 */

if (!defined('BASE_PATH')) define('BASE_PATH', dirname(__DIR__, 2));
if (!defined('SRC_PATH')) define('SRC_PATH', BASE_PATH . DIRECTORY_SEPARATOR . 'src');
if (!defined('PUBLIC_PATH')) define('PUBLIC_PATH', BASE_PATH . DIRECTORY_SEPARATOR . 'public');
if (!defined('ROUTES_PATH')) define('ROUTES_PATH', SRC_PATH . DIRECTORY_SEPARATOR . 'API' . DIRECTORY_SEPARATOR . 'routes');

require_once SRC_PATH . '/Core/App.php';
require_once SRC_PATH . '/Core/JsonResponse.php';
require_once SRC_PATH . '/Core/Exceptions.php';
// Precarga de firmas de rutas para análisis estático (y para evitar require condicional en editores).
require_once ROUTES_PATH . '/lotes.php';
require_once ROUTES_PATH . '/inventario.php';

class PharmaRouter {
    private string $method;
    private string $uri;
    private array $publicRoutes = ['/api/auth/login'];

    public function __construct() {
        App::bootstrap();
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $this->uri = parse_url($uri, PHP_URL_PATH);
    }

    public function run(): void {
        // Archivos estáticos (HTML, CSS, JS)
        if ($this->method === 'GET' && !$this->isApiRequest($this->uri)) {
            $this->serveStaticFile();
            return;
        }

        // Health check público
        if ($this->method === 'GET' && $this->uri === '/health') {
            header('Content-Type: application/json');
            echo json_encode(['service' => 'PharmaQuick API', 'status' => 'running']);
            return;
        }

        // Rutas API
        if ($this->isApiRequest($this->uri)) {
            $this->handleApi();
            return;
        }

        JsonResponse::error('Recurso no encontrado', 404);
    }

    private function isApiRequest(string $uri): bool {
        return strpos($uri, '/api/') === 0;
    }

    private function handleApi(): void {
        // Verificar si es ruta pública (login)
        if (in_array($this->uri, $this->publicRoutes) && $this->method === 'POST') {
            require_once ROUTES_PATH . '/auth.php';
            handleAuthLogin();
            return;
        }

        // Verificar si es login GET para testing
        if ($this->method === 'GET' && $this->uri === '/api/auth/login') {
            require_once ROUTES_PATH . '/auth.php';
            $email = $_GET['email'] ?? 'admin@pharmaquick.com';
            $password = $_GET['password'] ?? 'password';
            handleAuthLogin();
            return;
        }

        // Todas las demás rutas requieren JWT
        require_once SRC_PATH . '/Infrastructure/Services/JwtService.php';
        require_once SRC_PATH . '/API/Middleware/JwtMiddleware.php';

        $middleware = new JwtMiddleware();
        
        if (!$middleware->handle()) {
            return; // Ya respondió con error
        }

        // Enrutar según URI
        $this->dispatchRoutes();
    }

    private function dispatchRoutes(): void {
        // ===================
        // PRODUCTOS
        // ===================
        
        // GET /api/productos - Listar productos por farmacia
        if ($this->uri === '/api/productos' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/productos.php';
            handleGetProductos();
            return;
        }

        // POST /api/productos - Crear producto
        if ($this->uri === '/api/productos' && $this->method === 'POST') {
            require_once ROUTES_PATH . '/productos.php';
            handlePostProductos();
            return;
        }

        // GET /api/productos/{id} - Obtener producto por ID
        if ($this->method === 'GET' && preg_match('#^/api/productos/(\d+)$#', $this->uri, $matches)) {
            require_once ROUTES_PATH . '/productos.php';
            handleGetProductoById((int) $matches[1]);
            return;
        }

        // PUT/POST /api/productos/{id} - Actualizar producto (POST para soportar imágenes en FormData)
        if (($this->method === 'PUT' || $this->method === 'POST') && preg_match('#^/api/productos/(\d+)$#', $this->uri, $matches)) {
            require_once ROUTES_PATH . '/productos.php';
            handlePutProductos((int) $matches[1]);
            return;
        }

        // DELETE /api/productos/{id} - Eliminar producto
        if ($this->method === 'DELETE' && preg_match('#^/api/productos/(\d+)$#', $this->uri, $matches)) {
            require_once ROUTES_PATH . '/productos.php';
            handleDeleteProductos((int) $matches[1]);
            return;
        }

        // POST /api/productos/{id}/imagen - Subir imagen
        if ($this->method === 'POST' && preg_match('#^/api/productos/(\d+)/imagen$#', $this->uri, $matches)) {
            require_once ROUTES_PATH . '/upload.php';
            handleUploadProductImage((int) $matches[1]);
            return;
        }

        // Búsqueda: /api/productos/search?q=...
        if ($this->uri === '/api/productos/search' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/productos.php';
            handleSearchProductos();
            return;
        }

        // ===================
        // PRECIOS
        // ===================

        // GET /api/precios - Listar todos los precios de la farmacia
        if ($this->uri === '/api/precios' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/precios.php';
            handleGetPrecios();
            return;
        }

        // POST /api/precios - Crear precio
        if ($this->uri === '/api/precios' && $this->method === 'POST') {
            require_once ROUTES_PATH . '/precios.php';
            handlePostPrecios();
            return;
        }

        // GET /api/precios/{id} - Obtener precio por ID
        if ($this->method === 'GET' && preg_match('#^/api/precios/(\d+)$#', $this->uri, $matches)) {
            require_once ROUTES_PATH . '/precios.php';
            handleGetPreciosById((int) $matches[1]);
            return;
        }

        // PUT /api/precios/{id} - Actualizar precio o activar
        if ($this->method === 'PUT' && preg_match('#^/api/precios/(\d+)$#', $this->uri, $matches)) {
            require_once ROUTES_PATH . '/precios.php';
            handlePutPrecios((int) $matches[1]);
            return;
        }

        // DELETE /api/precios/{id} - Eliminar precio
        if ($this->method === 'DELETE' && preg_match('#^/api/precios/(\d+)$#', $this->uri, $matches)) {
            require_once ROUTES_PATH . '/precios.php';
            handleDeletePrecios((int) $matches[1]);
            return;
        }

        // GET /api/precios/producto/{productoId} - Obtener precios por producto
        if ($this->method === 'GET' && preg_match('#^/api/precios/producto/(\d+)$#', $this->uri, $matches)) {
            require_once ROUTES_PATH . '/precios.php';
            handleGetPreciosByProducto((int) $matches[1]);
            return;
        }

        // ===================
        // LOTES
        // ===================
        // GET /api/lotes?producto_id=123 - Listar lotes por producto (farmacia actual)
        if ($this->uri === '/api/lotes' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/lotes.php';
            handleGetLotes();
            return;
        }

        // POST /api/lotes - Crear lote (opcional: stock_inicial -> ENTRADA en Kardex)
        if ($this->uri === '/api/lotes' && $this->method === 'POST') {
            require_once ROUTES_PATH . '/lotes.php';
            handlePostLotes();
            return;
        }

        // GET /api/lotes/{id} - Obtener lote por ID
        if ($this->method === 'GET' && preg_match('#^/api/lotes/(\d+)$#', $this->uri, $matches)) {
            require_once ROUTES_PATH . '/lotes.php';
            handleGetLoteById((int) $matches[1]);
            return;
        }

        // PUT /api/lotes/{id} - Actualizar metadata del lote (NO stock)
        if ($this->method === 'PUT' && preg_match('#^/api/lotes/(\d+)$#', $this->uri, $matches)) {
            require_once ROUTES_PATH . '/lotes.php';
            handlePutLote((int) $matches[1]);
            return;
        }

        // ===================
        // INVENTARIO (KARDEX + FEFO)
        // ===================
        // GET /api/inventario/fefo?producto_id=123 - sugerencia FEFO (lotes disponibles)
        if ($this->uri === '/api/inventario/fefo' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/inventario.php';
            handleGetFefo();
            return;
        }

        // POST /api/inventario/movimiento - inserta movimiento en Kardex
        if ($this->uri === '/api/inventario/movimiento' && $this->method === 'POST') {
            require_once ROUTES_PATH . '/inventario.php';
            handlePostMovimientoInventario();
            return;
        }

        // GET /api/inventario/alertas - lotes por vencer (semáforo)
        if ($this->uri === '/api/inventario/alertas' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/inventario.php';
            handleGetAlertasInventario();
            return;
        }

        // POST /api/inventario/import-excel - carga masiva vía Excel
        if ($this->uri === '/api/inventario/import-excel' && $this->method === 'POST') {
            require_once ROUTES_PATH . '/inventario.php';
            handlePostImportExcel();
            return;
        }

        JsonResponse::error('Recurso no encontrado', 404);
    }

    private function serveStaticFile(): void {
        $requestUri = $this->uri === '/' ? '/index.html' : $this->uri;
        $filePath = PUBLIC_PATH . $requestUri;
        $filePath = realpath($filePath);

        if ($filePath && file_exists($filePath) && is_file($filePath)) {
            $extension = pathinfo($filePath, PATHINFO_EXTENSION);
            $mimeTypes = [
                'html' => 'text/html',
                'css' => 'text/css',
                'js' => 'application/javascript',
                'json' => 'application/json',
                'png' => 'image/png',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'gif' => 'image/gif',
                'svg' => 'image/svg+xml',
                'ico' => 'image/x-icon'
            ];

            $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';
            header('Content-Type: ' . $mimeType);
            header('Cache-Control: public, max-age=3600');
            readfile($filePath);
            return;
        }

        if ($this->uri === '/') {
            $indexPath = PUBLIC_PATH . '/index.html';
            if (file_exists($indexPath)) {
                header('Content-Type: text/html');
                readfile($indexPath);
                return;
            }
        }

        JsonResponse::error('Recurso no encontrado', 404);
    }
}

// Ejecutar router
$router = new PharmaRouter();
$router->run();