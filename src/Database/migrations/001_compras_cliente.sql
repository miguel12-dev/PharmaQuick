-- =========================================================
-- Migration: 001_compras_cliente.sql
-- Descripción: Tablas para compras simuladas de clientes
-- Fecha: 2026-05-09
-- =========================================================

SET NAMES utf8mb4;

-- =========================================================
-- Tabla de compras de clientes (simuladas)
-- =========================================================

CREATE TABLE compras_cliente (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Referencia al cliente (usuario)
    usuario_id BIGINT UNSIGNED NOT NULL,
    
    -- Farmacia asociada (para multi-tenant)
    farmacia_id INT UNSIGNED DEFAULT 1,
    
    -- Información de la compra
    codigo_pedido VARCHAR(20) UNIQUE NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    
    -- Método de pago
    metodo_pago ENUM('TARJETA', 'NEQUI') NOT NULL,
    
    -- Estado de la compra
    estado ENUM('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'ENTREGADA') DEFAULT 'CONFIRMADA',
    
    -- Información de entrega
    direccion_envio VARCHAR(255) NOT NULL,
    nombre_recibe VARCHAR(100) NOT NULL,
    telefono_contacto VARCHAR(20) NOT NULL,
    observaciones TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_usuario (usuario_id),
    INDEX idx_codigo_pedido (codigo_pedido),
    INDEX idx_estado (estado),
    INDEX idx_fecha (created_at),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Tabla de detalle de compras (items)
-- =========================================================

CREATE TABLE compras_detalle (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Referencia a la compra
    compra_id BIGINT UNSIGNED NOT NULL,
    
    -- Información del producto (desnormalizado para simplicidad)
    producto_id BIGINT UNSIGNED,
    producto_nombre VARCHAR(150) NOT NULL,
    
    -- Cantidad y precio
    cantidad INT UNSIGNED NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_compra (compra_id),
    
    FOREIGN KEY (compra_id) REFERENCES compras_cliente(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Tabla de métodos de pago registrados (opcional)
-- Para simular almacenamiento de métodos de pago
-- =========================================================

CREATE TABLE metodos_pago_cliente (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    usuario_id BIGINT UNSIGNED NOT NULL,
    
    -- Tipo de método
    tipo ENUM('TARJETA', 'NEQUI') NOT NULL,
    
    -- Datos enmascarados (solo últimos 4 dígitos para tarjetas)
    ultimo_digito VARCHAR(4),
    tipo_tarjeta VARCHAR(20), -- Visa, Mastercard, etc.
    
    -- Teléfono para Nequi
    telefono VARCHAR(20),
    
    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_usuario (usuario_id),
    INDEX idx_activo (activo),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Comentarios de documentación
-- =========================================================

ALTER TABLE compras_cliente COMMENT = 'Tabla para compras simuladas de clientes (e-commerce)';
ALTER TABLE compras_detalle COMMENT = 'Detalle de productos en compras de clientes';
ALTER TABLE metodos_pago_cliente COMMENT = 'Métodos de pago guardados por clientes para checkout rápido';