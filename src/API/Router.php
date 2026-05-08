<?php

declare(strict_types=1);

/**
 * PharmaQuick - Router
 *
 * Sistema de enrutamiento con middleware JWT
 * 
 * @version 1.0.0
 */

if (!defined('BASE_PATH'))
    define('BASE_PATH', dirname(__DIR__, 2));
if (!defined('SRC_PATH'))
    define('SRC_PATH', BASE_PATH . DIRECTORY_SEPARATOR . 'src');
if (!defined('PUBLIC_PATH'))
    define('PUBLIC_PATH', BASE_PATH . DIRECTORY_SEPARATOR . 'public');
if (!defined('ROUTES_PATH'))
    define('ROUTES_PATH', SRC_PATH . DIRECTORY_SEPARATOR . 'API' . DIRECTORY_SEPARATOR . 'routes');

require_once SRC_PATH . '/Core/App.php';
require_once SRC_PATH . '/Core/JsonResponse.php';
require_once SRC_PATH . '/Core/Exceptions.php';
require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
require_once SRC_PATH . '/Infrastructure/Persistence/UsuarioRepository.php';
require_once SRC_PATH . '/Infrastructure/Services/JwtService.php';
require_once SRC_PATH . '/Infrastructure/Services/AuthService.php';
// Precarga de rutas públicas (auth sin middleware JWT)
require_once ROUTES_PATH . '/auth.php';
// Precarga de firmas de rutas para anÃ¡lisis estÃ¡tico (y para evitar require condicional en editores).
require_once ROUTES_PATH . '/lotes.php';
require_once ROUTES_PATH . '/inventario.php';
require_once ROUTES_PATH . '/ventas.php';
require_once ROUTES_PATH . '/reservas.php';

class PharmaRouter
{
    private string $method;
    private string $uri;
    private array $publicRoutes = ['/api/auth/login', '/api/auth/register'];

    public function __construct()
    {
        App::bootstrap();
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($requestUri, PHP_URL_PATH) ?: '/';
        $normalizedPath = $path !== '/' ? rtrim($path, '/') : '/';
        $this->uri = $normalizedPath !== '' ? $normalizedPath : '/';
    }

    public function run(): void
    {
        // Archivos estÃ¡ticos (HTML, CSS, JS)
        if ($this->method === 'GET' && !$this->isApiRequest($this->uri)) {
            $this->serveStaticFile();
            return;
        }

        // Health check pÃºblico
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

    private function isApiRequest(string $uri): bool
    {
        return strpos($uri, '/api/') === 0;
    }

    private function handleApi(): void
    {
        // Verificar si es ruta pÃºblica (login/register)
        if (in_array($this->uri, $this->publicRoutes) && $this->method === 'POST') {
            if ($this->uri === '/api/auth/login') {
                handleAuthLogin();
            } else if ($this->uri === '/api/auth/register') {
                handleAuthRegister();
            }
            return;
        }

        // Verificar si es login GET para testing
        if ($this->method === 'GET' && $this->uri === '/api/auth/login') {
            $email = $_GET['email'] ?? 'admin@pharmaquick.com';
            $password = $_GET['password'] ?? 'password';
            handleAuthLogin();
            return;
        }

        // Rutas pÃºblicas sin JWT (vitrina e-commerce)
        if (strpos($this->uri, '/api/public/') === 0) {
            $this->handlePublicApi();
            return;
        }

        // Todas las demÃ¡s rutas requieren JWT
        require_once SRC_PATH . '/Infrastructure/Services/JwtService.php';
        require_once SRC_PATH . '/API/Middleware/JwtMiddleware.php';

        $middleware = new JwtMiddleware();

        if (!$middleware->handle()) {
            return; // Ya respondiÃ³ con error
        }

        // Enrutar segÃºn URI
        $this->dispatchRoutes();
    }

    private function handlePublicApi(): void
    {
        require_once ROUTES_PATH . '/public.php';

        if ($this->uri === '/api/public/catalogo' && $this->method === 'GET') {
            handleGetPublicCatalogo();
            return;
        }

        if ($this->uri === '/api/public/productos-top' && $this->method === 'GET') {
            handleGetPublicProductosTop();
            return;
        }

        JsonResponse::error('Recurso publico no encontrado', 404);
    }

    private function dispatchRoutes(): void
    {
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

        // PUT/POST /api/productos/{id} - Actualizar producto (POST para soportar imÃ¡genes en FormData)
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

        // Categorías: /api/productos/categorias
        if ($this->uri === '/api/productos/categorias' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/productos.php';
            handleGetCategorias();
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
        // PERFIL
        // ===================
        if ($this->uri === '/api/perfil' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/perfil.php';
            handleGetPerfil();
            return;
        }

        if ($this->uri === '/api/perfil/password' && $this->method === 'PUT') {
            require_once ROUTES_PATH . '/perfil.php';
            handlePutPerfilPassword();
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

        // GET /api/inventario/alertas - lotes por vencer (semÃ¡foro)
        if (
            $this->method === 'GET' &&
            in_array($this->uri, ['/api/inventario/alertas', '/api/inventario/alerta'], true)
        ) {
            require_once ROUTES_PATH . '/inventario.php';
            handleGetAlertasInventario();
            return;
        }

        // GET /api/inventario/resumen - KPIs inventario
        if ($this->uri === '/api/inventario/resumen' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/inventario.php';
            handleGetResumenInventario();
            return;
        }

        // GET /api/inventario/movimientos - historial de movimientos
        if ($this->uri === '/api/inventario/movimientos' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/inventario.php';
            handleGetMovimientosInventario();
            return;
        }

        // GET /api/inventario/import-modelo - formato esperado para xlsx
        if ($this->uri === '/api/inventario/import-modelo' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/inventario.php';
            handleGetImportModeloInventario();
            return;
        }

        // POST /api/inventario/import-excel - carga masiva vÃ­a Excel
        if ($this->uri === '/api/inventario/import-excel' && $this->method === 'POST') {
            require_once ROUTES_PATH . '/inventario.php';
            handlePostImportExcel();
            return;
        }

        // ===================
        // VENTAS Y RESERVAS
        // ===================
        if ($this->uri === '/api/ventas/top-productos' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/public.php';
            handleGetTopProductosAuth();
            return;
        }

        if ($this->uri === '/api/ventas' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/ventas.php';
            handleGetVentas();
            return;
        }

        if ($this->uri === '/api/ventas/crear' && $this->method === 'POST') {
            require_once ROUTES_PATH . '/ventas.php';
            handlePostVentasCrear();
            return;
        }

        if ($this->uri === '/api/reservas' && $this->method === 'GET') {
            require_once ROUTES_PATH . '/reservas.php';
            handleGetReservas();
            return;
        }

        if ($this->uri === '/api/reservas' && $this->method === 'POST') {
            require_once ROUTES_PATH . '/reservas.php';
            handlePostReservas();
            return;
        }

        // Endpoint Cronjob (Idealmente protegido o llamado interno)
        if ($this->uri === '/api/reservas/cron' && $this->method === 'POST') {
            require_once ROUTES_PATH . '/reservas.php';
            handlePostReservasCron();
            return;
        }

        JsonResponse::error('Recurso no encontrado', 404);
    }

    private function serveStaticFile(): void
    {
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