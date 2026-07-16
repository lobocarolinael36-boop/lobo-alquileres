-- Tracking de pagos mensuales de suscripción por inmobiliaria.
-- Vive en el schema public igual que tenants.
CREATE TABLE public.pagos_suscripcion (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID         NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    mes_pago   VARCHAR(7)   NOT NULL,                  -- formato "YYYY-MM", ej: "2026-07"
    monto      NUMERIC(12,2) NOT NULL DEFAULT 0,
    metodo     VARCHAR(80),                            -- "Transferencia", "Efectivo", etc.
    fecha_pago DATE         NOT NULL DEFAULT CURRENT_DATE,
    observaciones TEXT,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_pago_tenant_mes UNIQUE (tenant_id, mes_pago)
);

CREATE INDEX idx_pago_suscripcion_tenant ON public.pagos_suscripcion (tenant_id);
