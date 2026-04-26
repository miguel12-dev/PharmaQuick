<?php

declare(strict_types=1);

/**
 * PharmaQuick - Mapeo de Clusters
 *
 * Acceso a datos para la tabla cluster_farmacias.
 * Gestiona el mapeo entre farmacias y sus clusters de base de datos.
 *
 * @package PharmaQuick\Infrastructure\Persistence
 * @version 1.0.0
 */
namespace PharmaQuick\Infrastructure\Persistence;

use PharmaQuick\Core\Exceptions\DatabaseException;
use PDO;

/**
 * Repositorio para gestion de clusters de farmacias.
 *
 * @since 1.0.0
 */
final class ClusterRepository
{
    /** @var PDO Conexion a la base master */
    private PDO $masterPdo;

    /**
     * Constructor.
     *
     * @param PDO $masterPdo Conexion a la base master (pharma_master)
     *
     * @since 1.0.0
     */
    public function __construct(PDO $masterPdo)
    {
        $this->masterPdo = $masterPdo;
    }

    /**
     * Obtiene el cluster de una farmacia.
     *
     * @param int $farmaciaId ID de la farmacia
     * @return string|null Prefijo del cluster o null si no existe
     *
     * @since 1.0.0
     */
    public function getClusterByFarmaciaId(int $farmaciaId): ?string
    {
        $query = "SELECT cluster_prefix FROM cluster_farmacias WHERE farmacia_id = :farmacia_id";
        $stmt = $this->masterPdo->prepare($query);
        $stmt->execute([':farmacia_id' => $farmaciaId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result['cluster_prefix'] ?? null;
    }

    /**
     * Obtiene todas las farmacias de un cluster.
     *
     * @param string $clusterPrefix Prefijo del cluster
     * @return array<int> Lista de IDs de farmacias
     *
     * @since 1.0.0
     */
    public function getFarmaciasByCluster(string $clusterPrefix): array
    {
        $query = "SELECT farmacia_id FROM cluster_farmacias WHERE cluster_prefix = :cluster_prefix";
        $stmt = $this->masterPdo->prepare($query);
        $stmt->execute([':cluster_prefix' => $clusterPrefix]);

        $farmacias = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $farmacias[] = (int) $row['farmacia_id'];
        }

        return $farmacias;
    }

    /**
     * Obtiene todos los clusters existentes.
     *
     * @return array<string> Lista de prefijos de clusters
     *
     * @since 1.0.0
     */
    public function getAllClusters(): array
    {
        $query = "SELECT DISTINCT cluster_prefix FROM cluster_farmacias ORDER BY cluster_prefix";
        $stmt = $this->masterPdo->query($query);

        $clusters = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $clusters[] = $row['cluster_prefix'];
        }

        return $clusters;
    }

    /**
     * Aigna una farmacia a un cluster.
     *
     * @param int $farmaciaId ID de la farmacia
     * @param string $clusterPrefix Prefijo del cluster destino
     * @return bool True si la asignacion fue exitosa
     *
     * @since 1.0.0
     */
    public function assignToCluster(int $farmaciaId, string $clusterPrefix): bool
    {
        $query = "INSERT INTO cluster_farmacias (farmacia_id, cluster_prefix) VALUES (:farmacia_id, :cluster_prefix)
                  ON DUPLICATE KEY UPDATE cluster_prefix = :cluster_prefix_update";
        $stmt = $this->masterPdo->prepare($query);
        return $stmt->execute([
            ':farmacia_id' => $farmaciaId,
            ':cluster_prefix' => $clusterPrefix,
            ':cluster_prefix_update' => $clusterPrefix,
        ]);
    }

    /**
     * Calcula y asigna automaticamente una farmacia al cluster correspondiente.
     * Usa la formula: ceil(farmacia_id / 5)
     *
     * @param int $farmaciaId ID de la farmacia
     * @return string Prefijo del cluster asignado
     *
     * @since 1.0.0
     */
    public function autoAssignCluster(int $farmaciaId): string
    {
        $clusterNumber = (int) ceil($farmaciaId / PDOFactory::MAX_PHARMACIES_PER_CLUSTER);
        $clusterPrefix = PDOFactory::CLUSTER_PREFIX . $clusterNumber;

        $this->assignToCluster($farmaciaId, $clusterPrefix);

        return $clusterPrefix;
    }
}