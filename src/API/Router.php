<?php

declare(strict_types=1);

/**
 * PharmaQuick - Router
 *
 * Sistema de enrutamiento con middleware JWT
 * 
 * @version 1.0.0
 */

define('BASE_PATH', '/var/www/html');
define('SRC_PATH', BASE_PATH . '/src');
define('PUBLIC_PATH', BASE_PATH . '/public');
define('ROUTES_PATH', SRC_PATH . '/API/routes');

require_once SRC_PATH . '/Core/App.php';
require_once SRC_PATH . '/Core/JsonResponse.php';
require_once SRC_PATH . '/Core/Exceptions.php';

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
        // Productos
        if ($this->uri === '/api/productos') {
            require_once ROUTES_PATH . '/productos.php';
            
            if ($this->method === 'GET') {
                handleGetProductos();
                return;
            }
        }

        // Producto individual: /api/productos/{id}
        if (preg_match('#^/api/productos/(\d+)$#', $this->uri, $matches)) {
            require_once ROUTES_PATH . '/productos.php';
            
            if ($this->method === 'GET') {
                handleGetProductoById((int) $matches[1]);
                return;
            }
        }

        // Búsqueda: /api/productos/search?q=...
        if ($this->uri === '/api/productos/search') {
            require_once ROUTES_PATH . '/productos.php';
            
            if ($this->method === 'GET') {
                handleSearchProductos();
                return;
            }
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