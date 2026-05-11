<?php

declare(strict_types=1);

/**
 * PharmaQuick - PDOFactory
 * Configuración compatible con Docker y Hosting Compartido
 */
namespace PharmaQuick\Infrastructure\Persistence;

use PDO;

class PDOFactory {
    private static $connections = [];
    public const CLUSTER_PREFIX = 'db_cluster_';
    public const MAX_PHARMACIES_PER_CLUSTER = 5;

    /**
     * Cargar configuración según el entorno
     * Prioridad: database-local.php > database.php > fallback
     */
    private static function loadConfig(): array {
        $configDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'config';

        // 1. Si existe database-local.php (desarrollo local/Docker), usarlo
        $localConfig = $configDir . DIRECTORY_SEPARATOR . 'database-local.php';
        if (file_exists($localConfig)) {
            return require $localConfig;
        }

        // 2. Si existe database.php (producción/hosting), usarlo
        $prodConfig = $configDir . DIRECTORY_SEPARATOR . 'database.php';
        if (file_exists($prodConfig)) {
            return require $prodConfig;
        }

        // 3. Fallback: Docker legacy (hardcoded)
        return [
            'master' => [
                'host' => getenv('DB_HOST') ?: 'mysql',
                'port' => getenv('DB_PORT') ?: '3306',
                'database' => getenv('DB_NAME') ?: 'pharma_master',
                'username' => getenv('DB_USER') ?: 'root',
                'password' => getenv('DB_PASS') ?: 'root_pharma_2024',
            ],
            'clusters' => [
                'db_cluster_1' => [
                    'host' => getenv('DB_HOST') ?: 'mysql',
                    'port' => getenv('DB_PORT') ?: '3306',
                    'database' => 'db_cluster_1',
                    'username' => getenv('DB_USER') ?: 'root',
                    'password' => getenv('DB_PASS') ?: 'root_pharma_2024',
                ],
                'db_cluster_2' => [
                    'host' => getenv('DB_HOST') ?: 'mysql',
                    'port' => getenv('DB_PORT') ?: '3306',
                    'database' => 'db_cluster_2',
                    'username' => getenv('DB_USER') ?: 'root',
                    'password' => getenv('DB_PASS') ?: 'root_pharma_2024',
                ],
            ],
        ];
    }

    public static function getMaster(): PDO {
        $config = self::loadConfig();
        return self::getConnection('master', $config['master']);
    }

    public static function getCluster(int $num): PDO {
        $config = self::loadConfig();
        $clusterName = "db_cluster_$num";
        $clusterConfig = $config['clusters'][$clusterName] ?? $config['master'];
        return self::getConnection($clusterName, $clusterConfig);
    }

    private static function getConnection(string $name, array $config): PDO {
        if (isset(self::$connections[$name])) {
            return self::$connections[$name];
        }

        try {
            $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset=utf8mb4";
            $pdo = new PDO($dsn, $config['username'], $config['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false, // Mejor seguridad
            ]);
            self::$connections[$name] = $pdo;
            return $pdo;
        } catch (\Exception $e) {
            throw new \Exception("Error connecting to $name: " . $e->getMessage());
        }
    }
}

// Compatibilidad retroactiva para código legacy sin namespace.
if (!class_exists('PDOFactory', false)) {
    class_alias(PDOFactory::class, 'PDOFactory');
}
