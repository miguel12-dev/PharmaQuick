-- =========================================================
-- Migration: Agregar campos de recuperación de contraseña
-- =========================================================

ALTER TABLE usuarios 
ADD COLUMN recover_token VARCHAR(64) NULL,
ADD COLUMN recover_expires_at DATETIME NULL;

CREATE INDEX idx_recover_token ON usuarios(recover_token);