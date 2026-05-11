-- ============================================================
-- PharmaQuick - Script de Instalación para Hosting Compartido
-- Ejecutar este script en phpMyAdmin o terminal MySQL
-- ============================================================

-- NOTA: Para hosting básico, puedes usar UNA sola base de datos
-- en lugar de múltiples clusters. Modifica según las capacidades
-- de tu hosting.

-- ============================================================
-- 1. CREAR BASE DE DATOS
-- ============================================================

-- Opción A: Una sola base de datos (recomendado para hosting básico)
CREATE DATABASE IF NOT EXISTS pharma_quick;
USE pharma_quick;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 2. TABLAS DEL MASTER (pharma_master)
-- ============================================================

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

CREATE TABLE IF NOT EXISTS cluster_farmacias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED NOT NULL,
    cluster_prefix VARCHAR(30) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (farmacia_id),
    INDEX idx_cluster (cluster_prefix),
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- ============================================================
-- 3. TABLAS DEL CLUSTER (db_cluster_1)
-- ============================================================

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

CREATE TABLE IF NOT EXISTS lotes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED,
    farmacia_id INT UNSIGNED,
    codigo_lote VARCHAR(50),
    fecha_vencimiento DATE,
    costo_unitario DECIMAL(12,2) DEFAULT 0,
    stock_actual INT UNSIGNED DEFAULT 0,
    stock_reservado INT UNSIGNED DEFAULT 0,
    UNIQUE(producto_id, farmacia_id, codigo_lote),
    INDEX idx_fefo_lookup (farmacia_id, producto_id, fecha_vencimiento, stock_actual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lote_id BIGINT UNSIGNED,
    farmacia_id INT UNSIGNED,
    usuario_id BIGINT UNSIGNED,
    tipo ENUM('ENTRADA','SALIDA','RESERVA','LIBERACION') NOT NULL,
    cantidad INT UNSIGNED DEFAULT 0,
    referencia VARCHAR(100) DEFAULT NULL,
    observaciones TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lote (lote_id),
    INDEX idx_farmacia (farmacia_id),
    INDEX idx_fecha (creado_en),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. TRIGGER PARA STOCK (STOCK ENGINE)
-- ============================================================

DELIMITER $$

DROP TRIGGER IF EXISTS trg_kardex_stock$$

CREATE TRIGGER trg_kardex_stock
AFTER INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN
    IF NEW.tipo = 'ENTRADA' THEN
        UPDATE lotes SET stock_actual = stock_actual + NEW.cantidad
        WHERE id = NEW.lote_id;
    END IF;

    IF NEW.tipo = 'SALIDA' THEN
        UPDATE lotes SET stock_actual = stock_actual - NEW.cantidad
        WHERE id = NEW.lote_id;
    END IF;

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

-- ============================================================
-- 5. VENTAS Y RESERVAS
-- ============================================================

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

CREATE TABLE IF NOT EXISTS precios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED,
    farmacia_id INT UNSIGNED,
    precio DECIMAL(12,2),
    activo BOOLEAN DEFAULT FALSE,
    INDEX idx_precio (producto_id, farmacia_id, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. CLIENTES (para tienda/cliente)
-- ============================================================

CREATE TABLE IF NOT EXISTS clientes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    documento VARCHAR(20) DEFAULT NULL,
    password_hash VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (email),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 7. DATOS DE PRUEBA
-- ============================================================

INSERT INTO farmacias (id, codigo_sucursal, nombre, direccion, telefono) VALUES
(1, 'F001', 'PharmaQuick Central', 'Calle 100 #15-20, Bogota', '+57 601 555 0100');

INSERT INTO cluster_farmacias (farmacia_id, cluster_prefix) VALUES
(1, 'db_cluster_1');

-- Password para todos los usuarios: 'password'
INSERT INTO usuarios (farmacia_id, email, password_hash, nombre, rol) VALUES
(1, 'admin@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'ADMINISTRADOR'),
(1, 'vendedor@pharmaquick.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor', 'USUARIO');

-- ============================================================
-- INSTRUCCIONES PARA HOSTING COMPARTIDO
-- ============================================================
/*
1. Ejecuta este script en phpMyAdmin
2. Completa config/database.php con tus credenciales
3. Actualiza .env con los datos de tu hosting
4. Sube los archivos via FTP al public_html
5. Ejecuta: composer install --no-dev --optimize-autoloader
6. Listo!
*/