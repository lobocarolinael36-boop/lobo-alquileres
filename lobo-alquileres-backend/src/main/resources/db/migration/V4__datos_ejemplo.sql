-- =============================================================================
-- V4: Datos de ejemplo para testing
-- =============================================================================

-- ── DUEÑOS ───────────────────────────────────────────────────────────────────

INSERT INTO personas (id, tipo_documento, numero_documento, nombre, apellido,
    email, telefono_principal, calle, numero_puerta, ciudad, provincia, activo)
VALUES
    ('00000000-0000-0000-0001-000000000001', 'DNI', '20123456',
     'Roberto', 'García', 'roberto.garcia@gmail.com', '11-4123-5678',
     'Av. San Martín', '1500', 'San Martín', 'Buenos Aires', TRUE),

    ('00000000-0000-0000-0001-000000000002', 'DNI', '24567890',
     'María', 'Fernández', 'maria.fernandez@gmail.com', '11-4234-6789',
     'Laprida', '345', 'Ciudadela', 'Buenos Aires', TRUE);

INSERT INTO persona_roles (persona_id, rol) VALUES
    ('00000000-0000-0000-0001-000000000001', 'DUENO'),
    ('00000000-0000-0000-0001-000000000002', 'DUENO');

-- ── INQUILINOS ───────────────────────────────────────────────────────────────

INSERT INTO personas (id, tipo_documento, numero_documento, nombre, apellido,
    email, telefono_principal, calle, numero_puerta, ciudad, provincia, activo)
VALUES
    ('00000000-0000-0000-0002-000000000001', 'DNI', '35678901',
     'Juan', 'Martínez', 'lobokay5@gmail.com', '11-4345-7890',
     'Belgrano', '234', 'Villa del Parque', 'Buenos Aires', TRUE),

    ('00000000-0000-0000-0002-000000000002', 'DNI', '38901234',
     'Ana', 'Gómez', 'ana.gomez.alquiler@gmail.com', '11-4456-8901',
     'Rivadavia', '1200', 'Flores', 'Buenos Aires', TRUE);

INSERT INTO persona_roles (persona_id, rol) VALUES
    ('00000000-0000-0000-0002-000000000001', 'INQUILINO'),
    ('00000000-0000-0000-0002-000000000002', 'INQUILINO');

-- ── GARANTES ─────────────────────────────────────────────────────────────────

INSERT INTO personas (id, tipo_documento, numero_documento, nombre, apellido,
    email, telefono_principal, calle, numero_puerta, ciudad, provincia, activo)
VALUES
    ('00000000-0000-0000-0003-000000000001', 'DNI', '22345678',
     'Pablo', 'Rodríguez', 'pablo.rodriguez@gmail.com', '11-4567-9012',
     'Corrientes', '4500', 'San Martín', 'Buenos Aires', TRUE),

    ('00000000-0000-0000-0003-000000000002', 'DNI', '26789012',
     'Laura', 'Sánchez', 'laura.sanchez@gmail.com', '11-4678-0123',
     'Santa Fe', '2200', 'San Martín', 'Buenos Aires', TRUE);

INSERT INTO persona_roles (persona_id, rol) VALUES
    ('00000000-0000-0000-0003-000000000001', 'GARANTE'),
    ('00000000-0000-0000-0003-000000000002', 'GARANTE');

-- ── INMUEBLES ────────────────────────────────────────────────────────────────
-- Prefijo partida:  044 = General San Martín
--                   116 = Tres de Febrero

INSERT INTO inmuebles (
    id, dueno_id, tipo, estado,
    calle, numero_puerta, piso, departamento_unidad,
    ciudad, provincia, codigo_postal,
    superficie_cubierta, ambientes, dormitorios, banos, antiguedad_anios,
    tiene_cochera, tiene_baulera, tiene_amenities,
    valor_tasacion, moneda_tasacion,
    nro_partida, porcentaje_gasto,
    descripcion
) VALUES
    -- Dpto 3°B — San Martín (dueño García)
    ('00000000-0000-0000-0004-000000000001',
     '00000000-0000-0000-0001-000000000001',
     'DEPARTAMENTO', 'DISPONIBLE',
     'Av. Belgrano', '1234', '3', 'B',
     'San Martín', 'Buenos Aires', '1650',
     65.00, 3, 2, 1, 12,
     FALSE, TRUE, FALSE,
     75000.00, 'USD',
     '044-12345-6', 30.00,
     'Departamento luminoso a metros del tren. Cocina equipada, balcón corrido.'),

    -- Dpto 1°A — San Martín (dueño García)
    ('00000000-0000-0000-0004-000000000002',
     '00000000-0000-0000-0001-000000000001',
     'DEPARTAMENTO', 'DISPONIBLE',
     'San Lorenzo', '890', '1', 'A',
     'San Martín', 'Buenos Aires', '1650',
     48.00, 2, 1, 1, 8,
     FALSE, FALSE, FALSE,
     55000.00, 'USD',
     '044-67890-1', 25.00,
     'Monoambiente amplio con balcón. Excelente ubicación, muy luminoso.'),

    -- Casa — Ciudadela / Tres de Febrero (dueña Fernández)
    ('00000000-0000-0000-0004-000000000003',
     '00000000-0000-0000-0001-000000000002',
     'CASA', 'DISPONIBLE',
     'Lavalle', '567', NULL, NULL,
     'Ciudadela', 'Buenos Aires', '1702',
     120.00, 5, 3, 2, 25,
     TRUE, FALSE, FALSE,
     120000.00, 'USD',
     '116-23456-7', 35.00,
     'Casa con jardín y cochera para dos autos. Parrilla cubierta. Ideal familia.'),

    -- Local comercial — San Martín (dueño García)
    ('00000000-0000-0000-0004-000000000004',
     '00000000-0000-0000-0001-000000000001',
     'LOCAL_COMERCIAL', 'DISPONIBLE',
     'Av. Santa Fe', '3200', NULL, NULL,
     'San Martín', 'Buenos Aires', '1650',
     80.00, NULL, NULL, 1, 20,
     FALSE, FALSE, FALSE,
     95000.00, 'USD',
     '044-34567-8', 20.00,
     'Local a la calle en avenida principal. Amplio salón, depósito al fondo y baño.');
