
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- 1. CORE MULTI-TENANT
-- =========================================================

CREATE TABLE farmacias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo_sucursal VARCHAR(20) UNIQUE,
    nombre VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE usuarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255),
    rol ENUM('USUARIO','ADMINISTRADOR') DEFAULT 'USUARIO',
    activo BOOLEAN DEFAULT TRUE,

    UNIQUE (farmacia_id, email),

    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id)
) ENGINE=InnoDB;

-- =========================================================
-- 2. PRODUCTOS
-- =========================================================

CREATE TABLE productos (
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
) ENGINE=InnoDB;

-- =========================================================
-- 3. LOTES (FEFO OPTIMIZED)
-- =========================================================

CREATE TABLE lotes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED,
    farmacia_id INT UNSIGNED,

    codigo_lote VARCHAR(50),
    fecha_vencimiento DATE,

    costo_unitario DECIMAL(12,3),

    stock_actual DECIMAL(12,3) DEFAULT 0,
    stock_reservado DECIMAL(12,3) DEFAULT 0,

    UNIQUE(producto_id, farmacia_id, codigo_lote),

    INDEX idx_fefo_lookup (farmacia_id, producto_id, fecha_vencimiento, stock_actual),

    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id)
) ENGINE=InnoDB;

-- =========================================================
-- 4. KARDEX (SOURCE OF TRUTH)
-- =========================================================

CREATE TABLE movimientos_inventario (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lote_id BIGINT UNSIGNED,
    farmacia_id INT UNSIGNED,
    usuario_id BIGINT UNSIGNED,

    tipo ENUM('ENTRADA','SALIDA','RESERVA','LIBERACION') NOT NULL,
    cantidad DECIMAL(12,3),

    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_lote (lote_id),

    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- =========================================================
-- 5. TRIGGER ÚNICO (STOCK ENGINE)
-- =========================================================

DELIMITER $$

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

    -- RESERVAS (CRÍTICO)
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
-- 6. VENTAS (SIN TRIGGERS DE STOCK)
-- =========================================================

CREATE TABLE ventas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED,
    usuario_id BIGINT UNSIGNED,

    total DECIMAL(12,2),

    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_farmacia_fecha (farmacia_id, creado_en)
) ENGINE=InnoDB;

CREATE TABLE detalle_ventas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    venta_id BIGINT UNSIGNED,
    lote_id BIGINT UNSIGNED,

    cantidad DECIMAL(12,3),
    precio DECIMAL(12,2),
    subtotal DECIMAL(12,2),

    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (lote_id) REFERENCES lotes(id)
) ENGINE=InnoDB;

-- =========================================================
-- 7. RESERVAS (CONTROL REAL)
-- =========================================================

CREATE TABLE reservas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED,
    cliente_id BIGINT UNSIGNED,
    lote_id BIGINT UNSIGNED,

    cantidad DECIMAL(12,3),

    estado ENUM('ACTIVA','EXPIRADA','CANCELADA','CONSUMIDA'),

    fecha_expiracion DATETIME,

    INDEX idx_estado (estado),

    FOREIGN KEY (lote_id) REFERENCES lotes(id)
) ENGINE=InnoDB;

-- =========================================================
-- 8. PRECIOS (SIN OVERLAP LÓGICO)
-- =========================================================

CREATE TABLE precios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED,
    farmacia_id INT UNSIGNED,

    precio DECIMAL(12,2),
    activo BOOLEAN DEFAULT FALSE,

    INDEX idx_precio (producto_id, farmacia_id, activo),

    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id)
) ENGINE=InnoDB;

-- =========================================================
-- 9. AUDITORÍA
-- =========================================================

CREATE TABLE logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED,
    evento VARCHAR(50),
    data JSON,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

