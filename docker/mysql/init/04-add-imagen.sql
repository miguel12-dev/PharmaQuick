-- =========================================================
-- PharmaQuick - Agregar campo imagen a productos
-- Ejecutar en phpMyAdmin o línea de comandos
-- =========================================================

-- Para cluster-1
USE db_cluster_1;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen VARCHAR(255) NULL;

-- Para cluster-2
USE db_cluster_2;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen VARCHAR(255) NULL;