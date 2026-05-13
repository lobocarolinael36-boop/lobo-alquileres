-- =============================================================================
-- V6: Gastos adicionales en cuotas + datos de contacto de tenants
-- =============================================================================

-- ── Cuotas: agua (Aysa) y expensas comunes ───────────────────────────────────
ALTER TABLE cuotas
    ADD COLUMN IF NOT EXISTS monto_agua      NUMERIC(12,2) NULL,
    ADD COLUMN IF NOT EXISTS monto_expensas  NUMERIC(12,2) NULL;

-- Recalcular montoLiquidacion para incluir los nuevos campos cuando se usen:
-- el backend lo recalcula al momento de guardar, no hace falta update aquí.

-- ── Tenants: datos de contacto para imprimir en recibos ──────────────────────
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS schema_name  VARCHAR(50)  NULL,   -- tenant_{slug}
    ADD COLUMN IF NOT EXISTS telefono     VARCHAR(30)  NULL,
    ADD COLUMN IF NOT EXISTS domicilio    VARCHAR(200) NULL,
    ADD COLUMN IF NOT EXISTS cuit         VARCHAR(20)  NULL,
    ADD COLUMN IF NOT EXISTS website      VARCHAR(200) NULL;
