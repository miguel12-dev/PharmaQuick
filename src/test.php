<?php

declare(strict_types=1);

/**
 * PharmaQuick - Test Login con JWT
 */

define('BASE_PATH', dirname(__DIR__));
define('SRC_PATH', BASE_PATH . '/src');

require_once SRC_PATH . '/Core/Exceptions.php';

class TestLoginJwt {
    public static function run(): void {
        try {
            // Direct PDO connection
            $pdo = new PDO('mysql:host=mysql;port=3306;dbname=db_cluster_1;charset=utf8mb4', 'root', 'root_pharma_2024');
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Get user
            $stmt = $pdo->prepare("SELECT id, email, password_hash, farmacia_id FROM usuarios WHERE email = :email");
            $stmt->execute([':email' => 'admin@pharmaquick.com']);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                echo "Usuario no encontrado!\n";
                return;
            }
            
            echo "Usuario encontrado: " . print_r($user, true) . "\n";
            
            // Test password
            $result = password_verify('password', $user['password_hash']);
            echo "Password verify result: " . ($result ? 'TRUE' : 'FALSE') . "\n";
            
            if ($result) {
                // Test JwtService
                require_once SRC_PATH . '/Infrastructure/Services/JwtService.php';
                $jwtService = new JwtService();
                
                $payload = [
                    'sub' => $user['id'],
                    'email' => $user['email'],
                    'farmacia_id' => $user['farmacia_id'],
                ];
                
                $token = $jwtService->generate($payload);
                echo "\nJWT Generado:\n" . $token . "\n";
                
                // Validate token
                $validated = $jwtService->validate($token);
                echo "\nToken validado: " . ($validated ? 'OK' : 'FAIL') . "\n";
                if ($validated) {
                    print_r($validated);
                }
            }
            
        } catch (\Throwable $e) {
            echo "Error: " . $e->getMessage() . "\n";
            echo "Trace: " . $e->getTraceAsString() . "\n";
        }
    }
}

TestLoginJwt::run();