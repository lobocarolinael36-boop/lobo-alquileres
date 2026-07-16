package com.loboalquileres.service.impl;

import com.loboalquileres.dto.request.CambiarPasswordRequest;
import com.loboalquileres.dto.request.PagoSuscripcionRequest;
import com.loboalquileres.dto.request.PerfilUpdateRequest;
import com.loboalquileres.dto.request.TenantRequest;
import com.loboalquileres.dto.response.PagoSuscripcionResponse;
import com.loboalquileres.dto.response.TenantResponse;
import com.loboalquileres.entity.PagoSuscripcion;
import com.loboalquileres.entity.Tenant;
import com.loboalquileres.entity.Usuario;
import com.loboalquileres.enums.RolUsuario;
import com.loboalquileres.repository.PagoSuscripcionRepository;
import com.loboalquileres.repository.TenantRepository;
import com.loboalquileres.repository.UsuarioRepository;
import com.loboalquileres.service.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository          tenantRepository;
    private final UsuarioRepository         usuarioRepository;
    private final PagoSuscripcionRepository pagoRepository;
    private final PasswordEncoder           passwordEncoder;
    private final DataSource                dataSource;
    private final JdbcTemplate              jdbcTemplate;

    // ── Listar ────────────────────────────────────────────────────────────────

    @Override
    public List<TenantResponse> listarTodos() {
        return tenantRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    // ── Crear tenant ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TenantResponse crear(TenantRequest req) {
        // Validar unicidad
        if (tenantRepository.existsBySlug(req.slug())) {
            throw new ResponseStatusException(CONFLICT, "Ya existe un tenant con ese slug.");
        }
        if (usuarioRepository.existsByUsernameOrEmail(req.adminUsername(), req.email())) {
            throw new ResponseStatusException(CONFLICT, "El username o email del admin ya están en uso.");
        }

        // Crear y guardar el tenant
        String schema = "tenant_" + req.slug().toLowerCase().replaceAll("[^a-z0-9]", "_");
        Tenant tenant = tenantRepository.save(Tenant.builder()
            .nombre(req.nombre())
            .slug(req.slug())
            .email(req.email())
            .plan(req.plan())
            .fechaVencimiento(req.fechaVencimiento())
            .observaciones(req.observaciones())
            .schemaName(schema)
            .telefono(req.telefono())
            .domicilio(req.domicilio())
            .cuit(req.cuit())
            .website(req.website())
            .activo(true)
            .build());

        // Correr migraciones V1-V3 (estructurales) en el nuevo schema.
        // Flyway crea el schema automáticamente con schemas(schema) — no hace falta llamada explícita.
        // V4 = datos de ejemplo → se omite en producción.
        // V5 = tenants + usuarios → solo para public.
        correrMigraciones(schema);

        // Crear el usuario administrador del tenant
        Usuario adminUser = Usuario.builder()
            .username(req.adminUsername())
            .passwordHash(passwordEncoder.encode(req.adminPassword()))
            .email(req.email() != null ? req.email() : req.adminUsername() + "@loboalquileres.com")
            .rol(RolUsuario.ADMIN)
            .tenantSchema(schema)
            .activo(true)
            .build();
        usuarioRepository.save(adminUser);

        log.info("Tenant creado: {} (schema={})", tenant.getNombre(), schema);
        return toResponse(tenant);
    }

    // ── Activar / Desactivar ──────────────────────────────────────────────────

    @Override
    @Transactional
    public TenantResponse toggleActivo(UUID id) {
        Tenant tenant = findOrThrow(id);
        tenant.setActivo(!tenant.isActivo());
        // Sincronizar usuarios del tenant: si se desactiva el tenant, se inactivan sus usuarios
        if (!tenant.isActivo()) {
            usuarioRepository.findAllByTenantSchemaOrderByCreatedAtDesc(tenant.getSchemaName())
                .forEach(u -> u.setActivo(false));
        }
        return toResponse(tenantRepository.save(tenant));
    }

    // ── Cambiar contraseña del admin ─────────────────────────────────────────

    @Override
    @Transactional
    public void cambiarPassword(UUID id, CambiarPasswordRequest req) {
        Tenant tenant = findOrThrow(id);
        // Cambiar la contraseña del usuario admin del tenant (primer admin encontrado)
        usuarioRepository.findAllByTenantSchemaOrderByCreatedAtDesc(tenant.getSchemaName())
            .stream()
            .filter(u -> u.getRol() == RolUsuario.ADMIN)
            .findFirst()
            .ifPresentOrElse(
                u -> {
                    u.setPasswordHash(passwordEncoder.encode(req.nuevaPassword()));
                    usuarioRepository.save(u);
                    log.info("Contraseña cambiada para usuario admin del tenant {}", tenant.getSlug())
                    ;
                },
                () -> { throw new ResponseStatusException(NOT_FOUND, "No se encontró usuario admin para este tenant."); }
            );
    }

    // ── Eliminar ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void eliminar(UUID id) {
        Tenant tenant = findOrThrow(id);
        String schema = tenant.getSchemaName();

        // Eliminar usuarios del tenant
        usuarioRepository.findAllByTenantSchemaOrderByCreatedAtDesc(schema)
            .forEach(usuarioRepository::delete);

        // Eliminar el tenant
        tenantRepository.delete(tenant);

        // Opcionalmente: DROP SCHEMA (comentado por seguridad — hacerlo manualmente)
        // jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schema + "\" CASCADE");

        log.info("Tenant eliminado: {} (schema={})", tenant.getNombre(), schema);
    }

    // ── Perfil del tenant activo ──────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public TenantResponse getBySchemaName(String schemaName) {
        Tenant tenant = tenantRepository.findBySchemaName(schemaName)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Tenant no encontrado para schema: " + schemaName));
        return toResponse(tenant);
    }

    @Override
    @Transactional
    public TenantResponse actualizarPerfil(String schemaName, PerfilUpdateRequest req) {
        Tenant tenant = tenantRepository.findBySchemaName(schemaName)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Tenant no encontrado para schema: " + schemaName));

        // Solo se pueden actualizar datos de contacto, no slug ni credenciales desde aquí
        if (req.nombre() != null)    tenant.setNombre(req.nombre());
        if (req.email() != null)     tenant.setEmail(req.email());
        if (req.telefono() != null)  tenant.setTelefono(req.telefono());
        if (req.domicilio() != null) tenant.setDomicilio(req.domicilio());
        if (req.cuit() != null)      tenant.setCuit(req.cuit());
        if (req.website() != null)   tenant.setWebsite(req.website());

        return toResponse(tenantRepository.save(tenant));
    }

    // ── Pagos de suscripción ─────────────────────────────────────────────────

    @Override
    public List<PagoSuscripcionResponse> listarPagos(UUID tenantId) {
        findOrThrow(tenantId);
        return pagoRepository.findByTenantIdOrderByMesPagoDesc(tenantId)
            .stream()
            .map(this::toPagoResponse)
            .toList();
    }

    @Override
    @Transactional
    public PagoSuscripcionResponse registrarPago(UUID tenantId, PagoSuscripcionRequest req) {
        Tenant tenant = findOrThrow(tenantId);

        String mes = (req.mesPago() != null && !req.mesPago().isBlank())
            ? req.mesPago()
            : YearMonth.now().toString();

        if (pagoRepository.existsByTenantIdAndMesPago(tenantId, mes)) {
            throw new ResponseStatusException(CONFLICT,
                "Ya existe un pago registrado para " + tenant.getNombre() + " en " + mes + ".");
        }

        PagoSuscripcion pago = pagoRepository.save(PagoSuscripcion.builder()
            .tenant(tenant)
            .mesPago(mes)
            .monto(req.monto() != null ? req.monto() : java.math.BigDecimal.ZERO)
            .metodo(req.metodo())
            .fechaPago(req.fechaPago() != null ? req.fechaPago() : LocalDate.now())
            .observaciones(req.observaciones())
            .build());

        log.info("Pago de suscripción registrado: {} — {}", tenant.getNombre(), mes);
        return toPagoResponse(pago);
    }

    @Override
    @Transactional
    public void eliminarPago(UUID tenantId, UUID pagoId) {
        findOrThrow(tenantId);
        PagoSuscripcion pago = pagoRepository.findById(pagoId)
            .filter(p -> p.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Pago no encontrado."));
        pagoRepository.delete(pago);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void crearSchema(String schema) {
        String safe = schema.replaceAll("[^a-z0-9_]", "");
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS " + safe);
        log.info("Schema creado: {}", safe);
    }

    private void correrMigraciones(String schema) {
        try {
            Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas(schema)
                // Directorio exclusivo para tenant schemas: V1-V4 (sin datos de ejemplo ni tablas de public)
                .locations("classpath:db/tenant-migration")
                // Incluir public en search_path para que uuid_generate_v4() sea accesible
                .initSql("SET search_path TO " + schema + ", public")
                .load();
            flyway.migrate();
            log.info("Migraciones tenant (V1-V4) aplicadas al schema {}", schema);
        } catch (Exception e) {
            log.error("Error aplicando migraciones al schema {}: {}", schema, e.getMessage(), e);
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Error al inicializar el schema del tenant: " + e.getMessage());
        }
    }

    private Tenant findOrThrow(UUID id) {
        return tenantRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Tenant no encontrado."));
    }

    private TenantResponse toResponse(Tenant t) {
        String adminUsername = usuarioRepository
            .findAllByTenantSchemaOrderByCreatedAtDesc(t.getSchemaName())
            .stream()
            .filter(u -> u.getRol() == RolUsuario.ADMIN)
            .findFirst()
            .map(Usuario::getUsername)
            .orElse("—");

        String mesActual = YearMonth.now().toString();
        boolean pagaMesActual = pagoRepository.existsByTenantIdAndMesPago(t.getId(), mesActual);

        LocalDate fechaUltimoPago = pagoRepository
            .findByTenantIdOrderByMesPagoDesc(t.getId())
            .stream()
            .findFirst()
            .map(PagoSuscripcion::getFechaPago)
            .orElse(null);

        return new TenantResponse(
            t.getId(),
            t.getNombre(),
            t.getSlug(),
            t.getSchemaName(),
            t.getEmail(),
            t.isActivo(),
            t.getPlan(),
            t.getFechaVencimiento(),
            adminUsername,
            t.getObservaciones(),
            t.getTelefono(),
            t.getDomicilio(),
            t.getCuit(),
            t.getWebsite(),
            t.getCreatedAt(),
            pagaMesActual,
            fechaUltimoPago
        );
    }

    private PagoSuscripcionResponse toPagoResponse(PagoSuscripcion p) {
        return new PagoSuscripcionResponse(
            p.getId(),
            p.getMesPago(),
            p.getMonto(),
            p.getMetodo(),
            p.getFechaPago(),
            p.getObservaciones(),
            p.getCreatedAt()
        );
    }
}
