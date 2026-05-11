<?php
// Debug script
define('BASE_PATH', dirname(__FILE__));
require BASE_PATH . '/src/Core/Exceptions.php';
require BASE_PATH . '/src/Infrastructure/Persistence/PDOFactory.php';
require BASE_PATH . '/src/Infrastructure/Persistence/UsuarioRepository.php';
require BASE_PATH . '/src/Infrastructure/Services/JwtService.php';
require BASE_PATH . '/src/Infrastructure/Services/AuthService.php';

echo "=== DEBUG LOGIN ===\n";

try {
    $pdo = PDOFactory::getCluster(1);
    echo "[OK] PDO connected\n";
    
    // Try authenticate
    echo "\n=== Test Authenticate ===\n";
    $repo = new UsuarioRepository($pdo);
    $user = $repo->authenticate('admin@pharmaquick.com', 'password');
    echo "User authenticated:\n";
    print_r($user);
    
    // Try AuthService
    echo "\n=== Test AuthService ===\n";
    $authService = new AuthService(1);
    $result = $authService->login('admin@pharmaquick.com', 'password');
    echo "Login success:\n";
    print_r($result);
    
} catch (Exception $e) {
    echo "ERROR: " . get_class($e) . " - " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}