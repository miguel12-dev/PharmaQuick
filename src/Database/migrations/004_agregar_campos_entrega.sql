-- =========================================================
-- Migration: 004_agregar_campos_entrega.sql
-- Descripción: Agregar campos para método de entrega y costos
-- Fecha: 2026-05-10
-- =========================================================

SET NAMES utf8mb4;

-- Agregar columnas a compras_cliente
ALTER TABLE compras_cliente 
    ADD COLUMN subtotal DECIMAL(12,2) DEFAULT 0 AFTER total,
    ADD COLUMN costo_envio DECIMAL(10,2) DEFAULT 0 AFTER subtotal,
    ADD COLUMN metodo_entrega ENUM('ENVIO', 'RECOGER') DEFAULT 'ENVIO' AFTER metodo_pago;

-- Actualizar registros existentes para que tengan valores por defecto
UPDATE compras_cliente SET subtotal = total, costo_envio = 0, metodo_entrega = 'ENVIO' WHERE subtotal = 0;

-- Verificar que la tabla tenga las nuevas columnas
-- SELECT id, codigo_pedido, subtotal, costo_envio, metodo_entrega, total FROM compras_cliente LIMIT 5;