-- PharmaQuick - Base de Datos Master (pharma_master)
-- Catalogo central de farmacias
-- Version: 1.0.1
-- 
-- Notas de version 1.0.1:
-- - Actualizado sistema de roles para совпадать con backend Fase 2
-- - rol: ADMINISTRADOR | USUARIO

CREATE DATABASE IF NOT EXISTS pharma_master;
USE pharma_master;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- 1. CORE MULTI-TENANT (tablas del master)
-- =========================================================

CREATE TABLE IF NOT EXISTS farmacias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo_sucursal VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) DEFAULT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo_sucursal),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sistema deroles actualizado para Fase 2
-- ADMINISTRADOR: puede crear/editar/eliminar productos del catalogo global
-- USUARIO: acceso basico a productos y precios de su farmacia
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) DEFAULT NULL,
    rol ENUM('ADMINISTRADOR', 'USUARIO') DEFAULT 'USUARIO',
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (farmacia_id, email),
    INDEX idx_email (email),
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Mapeo de farmacias a clusters
-- =========================================================
CREATE TABLE IF NOT EXISTS cluster_farmacias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED NOT NULL,
    cluster_prefix VARCHAR(30) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (farmacia_id),
    INDEX idx_cluster (cluster_prefix),
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- AUDITORIA
-- =========================================================
CREATE TABLE IF NOT EXISTS logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED,
    evento VARCHAR(50) NOT NULL,
    modulo VARCHAR(50) DEFAULT NULL,
    usuario_id BIGINT UNSIGNED DEFAULT NULL,
    data JSON,
    ip_address VARCHAR(45) DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_farmacia (farmacia_id),
    INDEX idx_evento (evento),
    INDEX idx_fecha (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Datos de prueba: Farmacias
INSERT INTO farmacias (id, codigo_sucursal, nombre, direccion, telefono) VALUES
(1, 'F001', 'PharmaQuick Central', 'Calle 100 #15-20, Bogota', '+57 601 555 0100'),
(2, 'F002', 'PharmaQuick Norte', 'Av. Americas #45-30, Bogota', '+57 601 555 0200'),
(3, 'F003', 'PharmaQuick Cedritos', 'Calle 147 #45-12, Bogota', '+57 601 555 0300'),
(4, 'F004', 'PharmaQuick Chapinero', 'Carrera 7 #45-12, Bogota', '+57 601 555 0400'),
(5, 'F005', 'PharmaQuick Calle 80', 'Av. Suba #80-20, Bogota', '+57 601 555 0500'),
(6, 'F006', 'PharmaQuick Alamos', 'Calle 65 #35-20, Bogota', '+57 601 555 0600');

-- Mapeo de Clusters (formula: ceil(id/5))
INSERT INTO cluster_farmacias (farmacia_id, cluster_prefix) VALUES
(1, 'db_cluster_1'),
(2, 'db_cluster_1'),
(3, 'db_cluster_1'),
(4, 'db_cluster_1'),
(5, 'db_cluster_1'),
(6, 'db_cluster_2');

-- Usuarios de prueba (password: 'password' para todos)
-- Rol ADMINISTRADOR: acceso completo a productos (crear/editar/eliminar catalogo global)
-- Rol USUARIO: acceso basico a productos y precios de su farmacia
INSERT INTO usuarios (farmacia_id, email, password_hash, nombre, rol) VALUES
(1, 'admin@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador Central', 'ADMINISTRADOR'),
(1, 'vendedor@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor Principal', 'USUARIO'),
(2, 'vendedor2@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor Norte', 'USUARIO'),
(3, 'vendedor3@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor Cedritos', 'USUARIO'),
(4, 'vendedor4@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor Chapinero', 'USUARIO'),
(5, 'vendedor5@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor Calle 80', 'USUARIO'),
(6, 'vendedor6@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor Alamos', 'USUARIO');