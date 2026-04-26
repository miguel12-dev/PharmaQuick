-- PharmaQuick - Base de Datos Cluster (db_cluster_1)
--_VERSION: 1.0.1
--
-- Version 1.0.1 cambios:
-- - Sistema de roles actualizado: ADMINISTRADOR | USUARIO

CREATE DATABASE IF NOT EXISTS db_cluster_1;
USE db_cluster_1;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- 1. CORE MULTI-TENANT
-- =========================================================

-- Tabla local de farmacias (referencia al master - solo IDs)
CREATE TABLE IF NOT EXISTS farmacias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo_sucursal VARCHAR(20) UNIQUE,
    nombre VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuarios locales para autenticacion en este cluster
-- IMPORTANTE: El rol aqui es para acceso al catalogo local
-- El rol se sincroniza desde el master o usa estos valores locales
-- ADMINISTRADOR: puede gestionar productos y precios
-- USUARIO: solo puede gestionar precios de su farmacia
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255),
    nombre VARCHAR(100) DEFAULT NULL,
    rol ENUM('ADMINISTRADOR', 'USUARIO') DEFAULT 'USUARIO',
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (farmacia_id, email),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 2. PRODUCTOS (catalogo global - sin FK)
-- =========================================================
CREATE TABLE IF NOT EXISTS productos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    codigo_barras VARCHAR(50) UNIQUE,
    descripcion TEXT,
    categoria VARCHAR(50),
    presentacion VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 3. LOTES (FEFO OPTIMIZED)
-- =========================================================
CREATE TABLE IF NOT EXISTS lotes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED,
    farmacia_id INT UNSIGNED,
    codigo_lote VARCHAR(50),
    fecha_vencimiento DATE,
    costo_unitario DECIMAL(12,3),
    stock_actual DECIMAL(12,3) DEFAULT 0,
    stock_reservado DECIMAL(12,3) DEFAULT 0,
    UNIQUE(producto_id, farmacia_id, codigo_lote),
    INDEX idx_fefo_lookup (farmacia_id, producto_id, fecha_vencimiento, stock_actual)
    -- FK a productos y farmacias locales solo si existen
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 4. KARDEX (SOURCE OF TRUTH)
-- =========================================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lote_id BIGINT UNSIGNED,
    farmacia_id INT UNSIGNED,
    usuario_id BIGINT UNSIGNED,
    tipo ENUM('ENTRADA','SALIDA','RESERVA','LIBERACION') NOT NULL,
    cantidad DECIMAL(12,3),
    referencia VARCHAR(100) DEFAULT NULL,
    observaciones TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lote (lote_id),
    INDEX idx_farmacia (farmacia_id),
    INDEX idx_fecha (creado_en),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 5. TRIGGER (STOCK ENGINE) - BASADO EN pharmaquick.sql
-- =========================================================
DELIMITER $$

DROP TRIGGER IF EXISTS trg_kardex_stock$$

CREATE TRIGGER trg_kardex_stock
AFTER INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN
    -- STOCK REAL
    IF NEW.tipo = 'ENTRADA' THEN
        UPDATE lotes SET stock_actual = stock_actual + NEW.cantidad
        WHERE id = NEW.lote_id;
    END IF;

    IF NEW.tipo = 'SALIDA' THEN
        UPDATE lotes SET stock_actual = stock_actual - NEW.cantidad
        WHERE id = NEW.lote_id;
    END IF;

    -- RESERVAS (CRITICO)
    IF NEW.tipo = 'RESERVA' THEN
        UPDATE lotes
        SET stock_actual = stock_actual - NEW.cantidad,
            stock_reservado = stock_reservado + NEW.cantidad
        WHERE id = NEW.lote_id;
    END IF;

    IF NEW.tipo = 'LIBERACION' THEN
        UPDATE lotes
        SET stock_actual = stock_actual + NEW.cantidad,
            stock_reservado = stock_reservado - NEW.cantidad
        WHERE id = NEW.lote_id;
    END IF;
END$$

DELIMITER ;

-- =========================================================
-- 6. VENTAS
-- =========================================================
CREATE TABLE IF NOT EXISTS ventas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED,
    usuario_id BIGINT UNSIGNED,
    cliente_nombre VARCHAR(150) DEFAULT NULL,
    cliente_documento VARCHAR(20) DEFAULT NULL,
    total DECIMAL(12,2),
    descuento DECIMAL(12,2) DEFAULT 0,
    estado ENUM('PENDIENTE','COMPLETADA','CANCELADA') DEFAULT 'COMPLETADA',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_farmacia_fecha (farmacia_id, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detalle_ventas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    venta_id BIGINT UNSIGNED,
    lote_id BIGINT UNSIGNED,
    cantidad DECIMAL(12,3),
    precio DECIMAL(12,2),
    subtotal DECIMAL(12,2),
    INDEX idx_venta (venta_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 7. RESERVAS
-- =========================================================
CREATE TABLE IF NOT EXISTS reservas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED,
    cliente_id BIGINT UNSIGNED,
    lote_id BIGINT UNSIGNED,
    cantidad DECIMAL(12,3),
    estado ENUM('ACTIVA','EXPIRADA','CANCELADA','CONSUMIDA'),
    fecha_expiracion DATETIME,
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 8. PRECIOS
-- =========================================================
CREATE TABLE IF NOT EXISTS precios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED,
    farmacia_id INT UNSIGNED,
    precio DECIMAL(12,2),
    activo BOOLEAN DEFAULT FALSE,
    INDEX idx_precio (producto_id, farmacia_id, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- DATOS DE PRUEBA
-- =========================================================

-- Farmacias locales (sincronizar IDs del master)
INSERT INTO farmacias (id, codigo_sucursal, nombre) VALUES
(1, 'F001', 'PharmaQuick Central'),
(2, 'F002', 'PharmaQuick Norte'),
(3, 'F003', 'PharmaQuick Cedritos'),
(4, 'F004', 'PharmaQuick Chapinero'),
(5, 'F005', 'PharmaQuick Calle 80');

-- Usuarios de prueba (password: 'password')
-- Cada usuario tiene acceso a su farmacia
INSERT INTO usuarios (farmacia_id, email, password_hash, nombre, rol) VALUES
(1, 'admin@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador Central', 'ADMINISTRADOR'),
(1, 'vendedor@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor Principal', 'USUARIO'),
(2, 'vendedor2@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor Norte', 'USUARIO'),
(3, 'vendedor3@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor Cedritos', 'USUARIO'),
(4, 'vendedor4@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor Chapinero', 'USUARIO'),
(5, 'vendedor5@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor Calle 80', 'USUARIO');