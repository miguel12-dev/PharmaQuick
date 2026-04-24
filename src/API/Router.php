<?php

declare(strict_types=1);

/**
 * PharmaQuick - Router
 */

define('BASE_PATH', '/var/www/html');
define('SRC_PATH', BASE_PATH . '/src');

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
            parse_str(file_get_contents('php://input'), $postData);
            $email = $postData['email'] ?? $_POST['email'] ?? '';
            $password = $postData['password'] ?? $_POST['password'] ?? '';
            $this->handleLogin($email, $password);
            exit;
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

            // Farmacia 1 = cluster 1
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