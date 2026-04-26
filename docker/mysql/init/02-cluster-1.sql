-- PharmaQuick - Base de Datos Cluster (db_cluster_1)
-- Basado en pharmaquick.sql original
-- Version: 1.0.0

CREATE DATABASE IF NOT EXISTS db_cluster_1;
USE db_cluster_1;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- 1. CORE MULTI-TENANT
-- =========================================================
-- NOTA: En los clusters,farmacias es solo una referencia al ID del master
-- No se crea FK para evitar dependencia circular

CREATE TABLE IF NOT EXISTS farmacias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo_sucursal VARCHAR(20) UNIQUE,
    nombre VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255),
    nombre VARCHAR(100) DEFAULT NULL,
    rol ENUM('ADMIN', 'VENDEDOR', 'AUXILIAR') DEFAULT 'VENDEDOR',
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (farmacia_id, email),
    INDEX idx_email (email)
    -- FK a farmacias se omite - es solo referencia local en el cluster
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

-- Productos
INSERT INTO productos (nombre, codigo_barras, descripcion, categoria, presentacion) VALUES
('Acetaminofen 500mg', '7501234567890', 'Analgesico y antipiretico', 'Analgesicos', 'Caja x 20 tablets'),
('Ibuprofeno 400mg', '7501234567891', 'Antiinflamatorio no esteroideo', 'Antiinflamatorios', 'Caja x 30 tablets'),
('Amoxicilina 500mg', '7501234567892', 'Antibiotico de amplio espectro', 'Antibioticos', 'Caja x 21 capsulas'),
('Vitamina C 1000mg', '7501234567893', 'Suplemento vitaminico', 'Vitaminas', 'Frasco x 30 tabletas'),
('Omeprazol 20mg', '7501234567894', 'Inhibidor de bomba de protones', 'Gastroprotectores', 'Caja x 14 capsulas');

-- Lotes (FEFO - First Expired First Out)
INSERT INTO lotes (producto_id, farmacia_id, codigo_lote, fecha_vencimiento, costo_unitario, stock_actual) VALUES
(1, 1, 'LOTE-A-001', '2026-06-15', 2.500, 100),
(1, 1, 'LOTE-A-002', '2026-08-20', 2.300, 200),
(1, 1, 'LOTE-A-003', '2027-01-10', 2.700, 150),
(2, 1, 'LOTE-B-001', '2026-05-30', 3.200, 80),
(2, 1, 'LOTE-B-002', '2026-09-15', 3.000, 120),
(3, 1, 'LOTE-C-001', '2026-07-01', 8.500, 50),
(4, 1, 'LOTE-D-001', '2027-06-01', 5.000, 300),
(5, 1, 'LOTE-E-001', '2026-11-30', 4.500, 75);

-- Precios (solo 1 activo por producto/farmacia)
INSERT INTO precios (producto_id, farmacia_id, precio, activo) VALUES
(1, 1, 5.500, TRUE),
(2, 1, 6.800, TRUE),
(3, 1, 15.000, TRUE),
(4, 1, 12.000, TRUE),
(5, 1, 8.500, TRUE);

-- Movimientos de inventario (poblar stock - trigger actualizara lotes)
INSERT INTO movimientos_inventario (lote_id, farmacia_id, usuario_id, tipo, cantidad, referencia) VALUES
(1, 1, 1, 'ENTRADA', 100, 'Inventario inicial'),
(2, 1, 1, 'ENTRADA', 200, 'Inventario inicial'),
(3, 1, 1, 'ENTRADA', 150, 'Inventario inicial'),
(4, 1, 1, 'ENTRADA', 80, 'Inventario inicial'),
(5, 1, 1, 'ENTRADA', 120, 'Inventario inicial'),
(6, 1, 1, 'ENTRADA', 50, 'Inventario inicial'),
(7, 1, 1, 'ENTRADA', 300, 'Inventario inicial'),
(8, 1, 1, 'ENTRADA', 75, 'Inventario inicial');