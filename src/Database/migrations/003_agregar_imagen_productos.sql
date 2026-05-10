-- =========================================================
-- Migration: 003_agregar_imagen_productos.sql
-- Descripción: Agregar columna imagen a tabla productos
-- Fecha: 2026-05-10
-- =========================================================

SET NAMES utf8mb4;

-- Agregar columna imagen a productos si no existe
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen VARCHAR(255) NULL;

-- Comentar la columna para documentación
ALTER TABLE productos COMMENT = 'Catálogo de productos con imagen';