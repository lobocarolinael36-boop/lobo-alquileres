-- ============================================================================
-- V3 — Desglose de gastos por cuota (tasa municipal + luz + liquidación total)
-- ============================================================================

ALTER TABLE cuotas
    ADD COLUMN monto_tasa_municipal NUMERIC(12,2) NULL,
    ADD COLUMN monto_luz            NUMERIC(12,2) NULL,
    ADD COLUMN nro_cuenta_luz       VARCHAR(20)   NULL,
    ADD COLUMN monto_liquidacion    NUMERIC(12,2) NULL;

COMMENT ON COLUMN cuotas.monto_tasa_municipal IS 'Monto tasa municipal ya prorrateado según porcentaje_gasto del inmueble.';
COMMENT ON COLUMN cuotas.monto_luz            IS 'Monto de luz ya prorrateado según porcentaje_gasto del inmueble.';
COMMENT ON COLUMN cuotas.nro_cuenta_luz       IS 'Nro. de cuenta Edenor/distribuidora (referencia, 11 dígitos).';
COMMENT ON COLUMN cuotas.monto_liquidacion    IS 'Total a cobrar al inquilino: monto_total + tasa_municipal + luz.';
