-- ============================================================================
-- V2 — Partida municipal y prorrateo de gastos en inmuebles
-- ============================================================================

ALTER TABLE inmuebles
    ADD COLUMN nro_partida      VARCHAR(30)  NULL,
    ADD COLUMN porcentaje_gasto NUMERIC(5,2) NULL
        CONSTRAINT ck_inmueble_pct_gasto CHECK (porcentaje_gasto >= 0 AND porcentaje_gasto <= 100);

COMMENT ON COLUMN inmuebles.nro_partida      IS 'Nro. de partida municipal. Los 3 primeros dígitos identifican la municipalidad (ej: 044 = Gral. San Martín).';
COMMENT ON COLUMN inmuebles.porcentaje_gasto IS '% (0-100) del gasto de servicios que paga este inquilino. Útil en edificios con un solo medidor compartido.';
