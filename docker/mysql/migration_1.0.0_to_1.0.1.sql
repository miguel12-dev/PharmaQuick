-- =============================================================================
-- PharmaQuick - Script de Migracion
-- Version: 1.0.0 -> 1.0.1
--
-- Este script actualiza una instalacion existente de PharmaQuick a la version 1.0.1
-- que incluye el nuevo sistema de roles para Fase 2
--
-- Ejecutar en orden: 01-master.sql -> 02-cluster-1.sql -> 03-cluster-2.sql
-- Luego ejecutar este script de migracion en cada base de datos
-- =============================================================================

SET NAMES utf8mb4;

-- =============================================================================
-- PARTE 1: Actualizar base de datos master (pharma_master)
-- =============================================================================

USE pharma_master;

-- Agregar columna rol si no existe (cuando venia de version anterior)
-- Nota: En version 1.0.0 el enum era ('ADMIN', 'VENDEDOR', 'AUXILIAR')
-- En version 1.0.1 el enum es ('ADMINISTRADOR', 'USUARIO')

-- Primero verificamos si existe la columna rol
-- Si existe y tiene valores old, actualizamos

-- Caso 1: La tabla ya tiene la nueva estructura
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM('ADMINISTRADOR', 'USUARIO') DEFAULT 'USUARIO';

-- Caso 2: Actualizar valores old a nuevos
-- ADMIN -> ADMINISTRADOR
-- VENDEDOR, AUXILIAR -> USUARIO
UPDATE usuarios SET rol = 'ADMINISTRADOR' WHERE rol = 'ADMIN';
UPDATE usuarios SET rol = 'USUARIO' WHERE rol IN ('VENDEDOR', 'AUXILIAR');

-- Agregar columna activo si no existe
-- (En version 1.0.0 podia no existir)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE AFTER rol;

-- Agregar columna ultimo_login si no existe
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP NULL AFTER activo;

--================================================================================
-- PARTE 2: Actualizar clusters
-- =============================================================================

-- Ejecutar en cada cluster (db_cluster_1, db_cluster_2, etc.)

-- Para db_cluster_1:
USE db_cluster_1;

ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM('ADMINISTRADOR', 'USUARIO') DEFAULT 'USUARIO';

UPDATE usuarios SET rol = 'ADMINISTRADOR' WHERE rol = 'ADMIN';
UPDATE usuarios SET rol = 'USUARIO' WHERE rol IN ('VENDEDOR', 'AUXILIAR');

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE AFTER rol;

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP NULL AFTER activo;

-- Repetir los mismos comandos para db_cluster_2, db_cluster_3, etc. si existen

-- =============================================================================
-- PARTE 3: Verificar Datos de Prueba
-- =============================================================================

-- Verificar que los usuarios de prueba existen con password 'password'
-- El hash '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' = 'password'

-- En pharma_master:
SELECT 
    id,
    email,
    rol,
    activo,
    CASE 
        WHEN password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' THEN 'OK'
        ELSE 'PASSWORD需更新'
    END AS password_status
FROM usuarios;

-- En cada cluster:
SELECT 
    id,
    email,
    rol,
    activo,
    CASE 
        WHEN password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' THEN 'OK'
        ELSE 'PASSWORD需更新'
    END AS password_status
FROM usuarios;

-- =============================================================================
-- PARTE 4: Recomendaciones Post-Migracion
-- =============================================================================

/*

Despues de ejecutar este script, se recomienda:

1. Verificar que los usuarios tienen los roles correctos:
   - admin@pharmaquick.com debe tener rol ADMINISTRADOR
   - vendedores deben tener rol USUARIO

2. Verificar que la columna activo esta en TRUE para usuarios activos

3. Probar el login con las credenciales de prueba:
   - email: admin@pharmaquick.com
   - password: password
   - Este debe retornar rol ADMINISTRADOR

4. Probar el login con un usuario no-admin:
   - email: vendedor@pharmaquick.com  
   - password: password
   - Este debe retornar rol USUARIO

5. Verificar que el JWT contiene el rol correcto

6. Probar los endpoints:
   - GET /api/productos (cualquier usuario autenticado)
   - POST /api/productos (solo ADMINISTRADOR)
   - GET /api/precios (cualquier usuario autenticado)

*/

-- =============================================================================
-- FIN DEL SCRIPT DE MIGRACION
-- =============================================================================