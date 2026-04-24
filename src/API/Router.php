<?php

declare(strict_types=1);

define('BASE_PATH', '/var/www/html');
define('SRC_PATH', BASE_PATH . '/src');
define('PUBLIC_PATH', BASE_PATH . '/public');

require_once SRC_PATH . '/Core/App.php';
require_once SRC_PATH . '/Core/JsonResponse.php';
require_once SRC_PATH . '/Core/Exceptions.php';

class PharmaRouter {
    private $method;
    private $uri;

    public function __construct() {
        App::bootstrap();
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $this->uri = parse_url($uri, PHP_URL_PATH);
    }

    public function run(): void {
        // Archivos estaticos (HTML, CSS, JS, etc.)
        if ($this->method === 'GET' && !$this->isApiRequest($this->uri)) {
            $this->serveStaticFile();
            return;
        }

        // Health check
        if ($this->method === 'GET' && $this->uri === '/health') {
            header('Content-Type: application/json');
            echo json_encode(['service' => 'PharmaQuick API', 'status' => 'running']);
            exit;
        }

        // Login GET para testing
        if ($this->method === 'GET' && strpos($this->uri, '/api/auth/login') !== false) {
            $email = $_GET['email'] ?? 'admin@pharmaquick.com';
            $password = $_GET['password'] ?? 'password';
            $this->handleLogin($email, $password);
            exit;
        }

        // Login POST
        if ($this->method === 'POST' && $this->uri === '/api/auth/login') {
            $postData = [];
            parse_str(file_get_contents('php://input'), $postData);
            $email = $postData['email'] ?? $_POST['email'] ?? '';
            $password = $postData['password'] ?? $_POST['password'] ?? '';
            $this->handleLogin($email, $password);
            exit;
        }

        JsonResponse::error('Recurso no encontrado', 404);
    }

    private function isApiRequest(string $uri): bool {
        return strpos($uri, '/api/') === 0;
    }

    private function serveStaticFile(): void {
        $requestUri = $this->uri === '/' ? '/index.html' : $this->uri;

        $filePath = PUBLIC_PATH . $requestUri;

        if (strpos($requestUri, '/pages/') === 0) {
            $filePath = PUBLIC_PATH . $requestUri;
        } elseif ($requestUri === '/index.html') {
            $filePath = PUBLIC_PATH . '/index.html';
        } else {
            $filePath = PUBLIC_PATH . $requestUri;
        }

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
            exit;
        }

        if ($this->uri === '/') {
            $indexPath = PUBLIC_PATH . '/index.html';
            if (file_exists($indexPath)) {
                header('Content-Type: text/html');
                readfile($indexPath);
                exit;
            }
        }

        JsonResponse::error('Recurso no encontrado', 404);
    }

    private function handleLogin(string $email, string $password): void {
        if (empty($email) || empty($password)) {
            JsonResponse::error('Email y contrasena son requeridos', 400);
        }

        try {
            require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
            require_once SRC_PATH . '/Infrastructure/Persistence/UsuarioRepository.php';

            $pdo = PDOFactory::getCluster(1);
            $repo = new UsuarioRepository($pdo);
            $userData = $repo->authenticate($email, $password);

            JsonResponse::authSuccess(1, $userData, 'Autenticacion exitosa');

        } catch (AuthenticationException $e) {
            JsonResponse::error($e->getMessage(), 401);
        } catch (\Throwable $e) {
            JsonResponse::error('Error: ' . $e->getMessage(), 500);
        }
    }
}

$router = new PharmaRouter();
$router->run();