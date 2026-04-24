<?php

declare(strict_types=1);

/**
 * PharmaQuick - Test Login
 */

define('BASE_PATH', '/var/www/html');
define('SRC_PATH', BASE_PATH . '/src');

require_once SRC_PATH . '/Core/Exceptions.php';

class TestLogin {
    public static function run(): void {
        try {
            // Direct PDO connection
            $pdo = new PDO('mysql:host=mysql;port=3306;dbname=db_cluster_1;charset=utf8mb4', 'root', 'root_pharma_2024');
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Get user
            $stmt = $pdo->prepare("SELECT id, email, password_hash FROM usuarios WHERE email = :email");
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
            
        } catch (\Throwable $e) {
            echo "Error: " . $e->getMessage() . "\n";
        }
    }
}

TestLogin::run();