-- =============================================================================
-- V1: Esquema inicial - Sistema de Gestión de Alquileres Lobo
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- TIPOS ENUMERADOS
-- Definirlos primero porque las tablas los referencian.
-- -----------------------------------------------------------------------------

CREATE TYPE tipo_documento_identidad AS ENUM ('DNI', 'CUIL', 'CUIT', 'PASAPORTE', 'LE');
CREATE TYPE rol_persona               AS ENUM ('DUENO', 'INQUILINO', 'GARANTE', 'MARTILLERO');
CREATE TYPE tipo_inmueble             AS ENUM ('DEPARTAMENTO', 'CASA', 'LOCAL_COMERCIAL', 'OFICINA', 'COCHERA', 'TERRENO', 'GALPON', 'BODEGA');
CREATE TYPE estado_inmueble           AS ENUM ('DISPONIBLE', 'ALQUILADO', 'RESERVADO', 'EN_REPARACION', 'INACTIVO');
CREATE TYPE moneda                    AS ENUM ('ARS', 'USD');
CREATE TYPE tipo_ajuste               AS ENUM ('IPC', 'ICL', 'FIJO_PORCENTAJE', 'NINGUNO');
CREATE TYPE periodicidad_ajuste       AS ENUM ('MENSUAL', 'TRIMESTRAL', 'CUATRIMESTRAL', 'SEMESTRAL', 'ANUAL');
CREATE TYPE estado_contrato           AS ENUM ('ACTIVO', 'FINALIZADO', 'RESCINDIDO', 'SUSPENDIDO');
CREATE TYPE estado_cuota              AS ENUM ('PENDIENTE', 'PAGADA', 'VENCIDA', 'PAGADA_PARCIAL');
CREATE TYPE metodo_pago               AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'DEPOSITO_BANCARIO');
CREATE TYPE tipo_indice_inflacion     AS ENUM ('IPC', 'ICL');
CREATE TYPE tipo_documento_generado   AS ENUM ('CONTRATO', 'RECIBO', 'NOTIFICACION_AJUSTE', 'RESCISION');
CREATE TYPE rol_usuario               AS ENUM ('ADMIN', 'MARTILLERO', 'AGENTE');

-- -----------------------------------------------------------------------------
-- PERSONAS
-- Una persona puede ser Dueño, Inquilino, Garante y/o Martillero al mismo tiempo.
-- Se normaliza el rol en tabla separada para evitar columnas boolean redundantes.
-- -----------------------------------------------------------------------------

CREATE TABLE personas (
    id                    UUID                      PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_documento        tipo_documento_identidad  NOT NULL DEFAULT 'DNI',
    numero_documento      VARCHAR(20)               NOT NULL,
    nombre                VARCHAR(100)              NOT NULL,
    apellido              VARCHAR(100)              NOT NULL,
    email                 VARCHAR(255),
    telefono_principal    VARCHAR(30),
    telefono_alternativo  VARCHAR(30),
    calle                 VARCHAR(200),
    numero_puerta         VARCHAR(20),
    piso                  VARCHAR(10),
    departamento_unidad   VARCHAR(20),
    ciudad                VARCHAR(100),
    provincia             VARCHAR(100)              DEFAULT 'Buenos Aires',
    codigo_postal         VARCHAR(10),
    fecha_nacimiento      DATE,
    observaciones         TEXT,
    activo                BOOLEAN                   NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ               NOT NULL DEFAULT NOW(),

    -- Un documento es único por tipo. Evita duplicar una persona en el sistema.
    CONSTRAINT uq_persona_documento UNIQUE (tipo_documento, numero_documento)
);

-- Tabla de roles: permite que una persona tenga múltiples roles sin columnas boolean.
-- Ejemplo: Juan puede ser DUENO de un inmueble e INQUILINO de otro.
CREATE TABLE persona_roles (
    persona_id  UUID        NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    rol         rol_persona NOT NULL,
    PRIMARY KEY (persona_id, rol)
);

-- -----------------------------------------------------------------------------
-- INMUEBLES
-- Cada inmueble pertenece a exactamente un dueño (persona con rol DUENO).
-- Montos de tasación en NUMERIC para evitar errores de punto flotante.
-- -----------------------------------------------------------------------------

CREATE TABLE inmuebles (
    id                    UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    dueno_id              UUID             NOT NULL REFERENCES personas(id),
    tipo                  tipo_inmueble    NOT NULL,
    estado                estado_inmueble  NOT NULL DEFAULT 'DISPONIBLE',

    -- Dirección del inmueble (distinta a la del dueño)
    calle                 VARCHAR(200)     NOT NULL,
    numero_puerta         VARCHAR(20),
    piso                  VARCHAR(10),
    departamento_unidad   VARCHAR(20),
    ciudad                VARCHAR(100)     NOT NULL DEFAULT 'Buenos Aires',
    provincia             VARCHAR(100)     NOT NULL DEFAULT 'Buenos Aires',
    codigo_postal         VARCHAR(10),

    -- Características físicas
    superficie_cubierta   NUMERIC(10, 2),
    superficie_total      NUMERIC(10, 2),
    ambientes             SMALLINT         CHECK (ambientes > 0),
    dormitorios           SMALLINT         CHECK (dormitorios >= 0),
    banos                 SMALLINT         CHECK (banos > 0),
    antiguedad_anios      SMALLINT         CHECK (antiguedad_anios >= 0),
    tiene_cochera         BOOLEAN          NOT NULL DEFAULT FALSE,
    tiene_baulera         BOOLEAN          NOT NULL DEFAULT FALSE,
    tiene_amenities       BOOLEAN          NOT NULL DEFAULT FALSE,

    -- Valuación financiera (NUMERIC obligatorio, nunca FLOAT)
    valor_tasacion        NUMERIC(15, 2),
    moneda_tasacion       moneda           DEFAULT 'USD',

    descripcion           TEXT,
    observaciones         TEXT,
    activo                BOOLEAN          NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- CONTRATOS
-- Entidad central del sistema. Vincula Inmueble + Inquilino + Garante + Martillero.
-- Todos los montos: NUMERIC(15,2) — mapea a BigDecimal en Java.
-- -----------------------------------------------------------------------------

CREATE TABLE contratos (
    id                          UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Número legible por humanos, generado por la aplicación (ej: "CTR-2024-0001")
    numero_contrato             VARCHAR(20)         UNIQUE NOT NULL,

    -- Relaciones principales
    inmueble_id                 UUID                NOT NULL REFERENCES inmuebles(id),
    inquilino_id                UUID                NOT NULL REFERENCES personas(id),
    garante_id                  UUID                REFERENCES personas(id),   -- nullable: no siempre hay garante
    martillero_id               UUID                NOT NULL REFERENCES personas(id),

    -- Vigencia
    fecha_inicio                DATE                NOT NULL,
    fecha_fin                   DATE                NOT NULL,

    -- Monto inicial (NUNCA usar FLOAT/DOUBLE para dinero)
    monto_alquiler_inicial      NUMERIC(15, 2)      NOT NULL,
    moneda_contrato             moneda              NOT NULL DEFAULT 'ARS',

    -- Motor de ajuste por inflación
    tipo_ajuste                 tipo_ajuste         NOT NULL DEFAULT 'ICL',
    periodicidad_ajuste         periodicidad_ajuste NOT NULL DEFAULT 'CUATRIMESTRAL',
    porcentaje_ajuste_fijo      NUMERIC(6, 3),      -- solo si tipo_ajuste = 'FIJO_PORCENTAJE'
    proximo_ajuste_fecha        DATE,               -- calculado al crear/ajustar, base para alertas

    -- Comisión del martillero (% sobre cada cuota)
    comision_porcentaje         NUMERIC(5, 2)       NOT NULL DEFAULT 10.00,

    -- Depósito de garantía
    deposito_meses              SMALLINT            NOT NULL DEFAULT 1,
    deposito_monto              NUMERIC(15, 2),
    deposito_devuelto           BOOLEAN             NOT NULL DEFAULT FALSE,
    deposito_fecha_devolucion   DATE,

    -- Día del mes en que vence cada cuota (1-28 para compatibilidad con todos los meses)
    dia_vencimiento_cuota       SMALLINT            NOT NULL DEFAULT 10,

    estado                      estado_contrato     NOT NULL DEFAULT 'ACTIVO',
    clausulas_adicionales       TEXT,
    observaciones               TEXT,
    created_at                  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    -- Constraints de negocio
    CONSTRAINT chk_contrato_fechas         CHECK (fecha_fin > fecha_inicio),
    CONSTRAINT chk_contrato_monto_positivo CHECK (monto_alquiler_inicial > 0),
    CONSTRAINT chk_contrato_dia_cuota      CHECK (dia_vencimiento_cuota BETWEEN 1 AND 28),
    CONSTRAINT chk_contrato_comision       CHECK (comision_porcentaje BETWEEN 0 AND 100),

    -- Si el ajuste es fijo, el porcentaje no puede ser nulo
    CONSTRAINT chk_ajuste_fijo_porcentaje CHECK (
        tipo_ajuste != 'FIJO_PORCENTAJE'
        OR porcentaje_ajuste_fijo IS NOT NULL
    )
);

-- -----------------------------------------------------------------------------
-- CUOTAS
-- Generadas automáticamente al crear el contrato. Una por mes de vigencia.
-- monto_total se mantiene como columna calculada-y-almacenada para queries rápidas
-- y para que el CHECK garantice consistencia sin lógica en la app.
-- -----------------------------------------------------------------------------

CREATE TABLE cuotas (
    id                      UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id             UUID          NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    numero_cuota            SMALLINT      NOT NULL,  -- 1, 2, 3... Nro de mes del contrato

    fecha_vencimiento       DATE          NOT NULL,
    fecha_pago              TIMESTAMPTZ,             -- null hasta que se registra el pago

    -- Descomposición del monto para auditoría completa
    monto_base              NUMERIC(15, 2) NOT NULL, -- alquiler del período sin ajuste
    monto_ajuste            NUMERIC(15, 2) NOT NULL DEFAULT 0, -- incremento por inflación
    monto_total             NUMERIC(15, 2) NOT NULL, -- monto_base + monto_ajuste

    monto_pagado            NUMERIC(15, 2),          -- null hasta el pago

    estado                  estado_cuota  NOT NULL DEFAULT 'PENDIENTE',
    metodo_pago             metodo_pago,
    numero_comprobante      VARCHAR(100),

    -- Trazabilidad del índice usado para el ajuste
    indice_aplicado_tipo    tipo_indice_inflacion,
    indice_aplicado_pct     NUMERIC(8, 4), -- porcentaje de variación del índice aplicado

    -- Comisión del martillero derivada de esta cuota
    comision_monto          NUMERIC(15, 2),
    comision_pagada         BOOLEAN       NOT NULL DEFAULT FALSE,

    observaciones           TEXT,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Una cuota por número dentro de un contrato
    CONSTRAINT uq_cuota_contrato_numero UNIQUE (contrato_id, numero_cuota),
    CONSTRAINT chk_cuota_monto_positivo CHECK (monto_base > 0),
    CONSTRAINT chk_cuota_total          CHECK (monto_total = monto_base + monto_ajuste),
    CONSTRAINT chk_cuota_monto_pagado   CHECK (monto_pagado IS NULL OR monto_pagado > 0)
);

-- -----------------------------------------------------------------------------
-- ÍNDICES DE INFLACIÓN
-- Histórico de variaciones IPC/ICL por período mensual.
-- La app los sincroniza desde APIs públicas (INDEC / BCRA).
-- -----------------------------------------------------------------------------

CREATE TABLE indices_inflacion (
    id                  UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo                tipo_indice_inflacion   NOT NULL,

    -- Primer día del mes al que corresponde la variación (ej: 2024-03-01)
    periodo             DATE                    NOT NULL,

    -- Variación porcentual mensual (ej: 12.8 = 12.8%)
    porcentaje_variacion NUMERIC(8, 4)          NOT NULL,

    fuente              VARCHAR(200),           -- URL o nombre de la fuente oficial
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_indice_tipo_periodo UNIQUE (tipo, periodo)
);

-- -----------------------------------------------------------------------------
-- DOCUMENTOS GENERADOS
-- Registra los PDFs generados (contratos, recibos, notificaciones).
-- Los archivos físicos se almacenan en el filesystem o S3 (según etapa).
-- -----------------------------------------------------------------------------

CREATE TABLE documentos (
    id                  UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id         UUID                    REFERENCES contratos(id),
    cuota_id            UUID                    REFERENCES cuotas(id),
    tipo                tipo_documento_generado NOT NULL,
    nombre_archivo      VARCHAR(255)            NOT NULL,
    ruta_almacenamiento TEXT                    NOT NULL,
    tamano_bytes        BIGINT,
    generado_por        UUID                    REFERENCES personas(id),
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- USUARIOS DEL SISTEMA
-- Separados de Personas para mantener limpio el modelo de dominio.
-- Una persona puede existir sin ser usuario (ej: inquilinos, dueños).
-- -----------------------------------------------------------------------------

CREATE TABLE usuarios (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    persona_id      UUID            REFERENCES personas(id),
    username        VARCHAR(50)     UNIQUE NOT NULL,
    password_hash   TEXT            NOT NULL,
    email           VARCHAR(255)    UNIQUE NOT NULL,
    rol             rol_usuario     NOT NULL DEFAULT 'AGENTE',
    activo          BOOLEAN         NOT NULL DEFAULT TRUE,
    ultimo_login    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ÍNDICES DE PERFORMANCE
-- =============================================================================

-- Inmuebles
CREATE INDEX idx_inmuebles_dueno_id ON inmuebles(dueno_id);
CREATE INDEX idx_inmuebles_estado   ON inmuebles(estado);

-- Contratos
CREATE INDEX idx_contratos_inmueble_id    ON contratos(inmueble_id);
CREATE INDEX idx_contratos_inquilino_id   ON contratos(inquilino_id);
CREATE INDEX idx_contratos_martillero_id  ON contratos(martillero_id);
CREATE INDEX idx_contratos_estado         ON contratos(estado);

-- Índice parcial: solo contratos activos con ajuste próximo (query más frecuente del motor de inflación)
CREATE INDEX idx_contratos_proximo_ajuste
    ON contratos(proximo_ajuste_fecha)
    WHERE estado = 'ACTIVO';

-- Cuotas
CREATE INDEX idx_cuotas_contrato_id ON cuotas(contrato_id);
CREATE INDEX idx_cuotas_estado      ON cuotas(estado);

-- Índice parcial: cuotas pendientes/vencidas por fecha (dashboard y alertas)
CREATE INDEX idx_cuotas_vencimiento_pendientes
    ON cuotas(fecha_vencimiento)
    WHERE estado IN ('PENDIENTE', 'VENCIDA');

-- Índices de inflación
CREATE INDEX idx_indices_tipo_periodo ON indices_inflacion(tipo, periodo DESC);
