-- Soporte para pagos anuales: tipo_pago identifica si el registro forma parte
-- de un pago mensual o de uno anual. grupo_id agrupa los 12 registros mensuales
-- generados automáticamente por un pago anual (permite borrarlos de a grupo).
ALTER TABLE public.pagos_suscripcion
    ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(10) NOT NULL DEFAULT 'MENSUAL',
    ADD COLUMN IF NOT EXISTS grupo_id  UUID         NULL;

CREATE INDEX IF NOT EXISTS idx_pago_grupo
    ON public.pagos_suscripcion (grupo_id)
    WHERE grupo_id IS NOT NULL;
