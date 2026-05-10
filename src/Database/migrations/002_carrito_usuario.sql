-- =========================================================
-- Migración 002: Tabla de Carrito de Usuario
-- PharmaQuick - Carrito persistente por usuario
-- =========================================================

SET NAMES utf8mb4;

-- Tabla principal del carrito
CREATE TABLE IF NOT EXISTS carritos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT UNSIGNED NOT NULL,
    farmacia_id INT UNSIGNED NULL,
    
    -- Datos del producto (desnormalizados porque pueden estar en clusters)
    producto_id BIGINT UNSIGNED NULL,
    producto_nombre VARCHAR(150) NOT NULL,
    producto_codigo_barras VARCHAR(50) NULL,
    
    cantidad INT UNSIGNED NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(12,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índice único para evitar duplicados del mismo producto para el mismo usuario
    UNIQUE KEY uk_usuario_producto (usuario_id, producto_id),
    
    -- Índices para búsquedas frecuentes
    INDEX idx_usuario (usuario_id),
    INDEX idx_farmacia (farmacia_id),
    
    -- FK al usuario (obligatorio)
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- La FK a productos es opcional porque los productos pueden estar en clusters (no en master)
-- Cuando el producto existe en master, se puede referenciar:
-- ALTER TABLE carritos ADD CONSTRAINT fk_carrito_producto 
--     FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL;

-- =========================================================
-- Verificar existencia de la tabla:
-- SHOW TABLES LIKE 'carritos';
-- DESCRIBE carritos;
-- =========================================================