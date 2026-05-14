-- =============================================================================
-- V4 (tenant): Gastos adicionales en cuotas (agua + expensas)
-- Equivale a las columnas de cuotas del V6 del schema público.
-- NO incluye los cambios de la tabla tenants (esa vive en public, no aquí).
-- =============================================================================

ALTER TABLE cuotas
    ADD COLUMN IF NOT EXISTS monto_agua      NUMERIC(12,2) NULL,
    ADD COLUMN IF NOT EXISTS monto_expensas  NUMERIC(12,2) NULL;
