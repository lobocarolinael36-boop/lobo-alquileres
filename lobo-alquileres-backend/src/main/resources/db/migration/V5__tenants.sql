-- =============================================================================
-- V5: Sistema multi-tenant — tabla tenants, ajuste usuarios
-- =============================================================================

-- Nuevo rol para el super-administrador del SaaS
ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'SUPERADMIN';

-- ── Tabla de tenants (inmobiliarias que contratan el servicio) ────────────────
CREATE TABLE tenants (
    id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre              VARCHAR(200)  NOT NULL,
    slug                VARCHAR(50)   UNIQUE NOT NULL,  -- usado como nombre del schema: tenant_{slug}
    email               VARCHAR(255),
    activo              BOOLEAN       NOT NULL DEFAULT TRUE,
    plan                VARCHAR(50)   NOT NULL DEFAULT 'BASICO',
    fecha_vencimiento   DATE,
    observaciones       TEXT,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Vincular usuarios a su tenant ────────────────────────────────────────────
-- NULL = superadmin (acceso a panel de administración, sin datos de negocio)
-- 'tenant_xxx' = usuario perteneciente al schema de ese tenant
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS tenant_schema VARCHAR(50) NULL;

-- ── Eliminar FK cross-schema: usuarios.persona_id → personas ─────────────────
-- Con multi-tenancy, personas vive en schemas de tenant y usuarios en public.
-- Mantenemos la columna como referencia lógica pero sin FK de base de datos.
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_persona_id_fkey;
