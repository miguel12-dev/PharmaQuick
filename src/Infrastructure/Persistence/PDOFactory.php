<?php

declare(strict_types=1);

/**
 * PharmaQuick - PDOFactory
 */
namespace PharmaQuick\Infrastructure\Persistence;

use PDO;

class PDOFactory {
    private static $connections = [];
    public const CLUSTER_PREFIX = 'db_cluster_';
    public const MAX_PHARMACIES_PER_CLUSTER = 5;

    const DB_MASTER = [
        'host' => 'mysql',
        'port' => '3306',
        'database' => 'pharma_master',
        'username' => 'root',
        'password' => 'root_pharma_2024',
    ];

    const DB_CLUSTERS = [
        'db_cluster_1' => ['host' => 'mysql', 'port' => '3306', 'database' => 'db_cluster_1', 'username' => 'root', 'password' => 'root_pharma_2024'],
        'db_cluster_2' => ['host' => 'mysql', 'port' => '3306', 'database' => 'db_cluster_2', 'username' => 'root', 'password' => 'root_pharma_2024'],
    ];

    public static function getMaster(): PDO {
        return self::getConnection('master', self::DB_MASTER);
    }

    public static function getCluster(int $num): PDO {
        $name = "db_cluster_$num";
        $config = self::DB_CLUSTERS[$name] ?? self::DB_MASTER;
        return self::getConnection($name, $config);
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
