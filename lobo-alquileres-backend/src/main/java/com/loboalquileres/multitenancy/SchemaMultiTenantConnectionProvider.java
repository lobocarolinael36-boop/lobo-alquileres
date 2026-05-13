package com.loboalquileres.multitenancy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.hibernate.service.UnknownUnwrapTypeException;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.Serial;
import java.io.Serializable;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Provee conexiones PostgreSQL con search_path ajustado al schema del tenant activo.
 *
 * Estrategia:
 *   - getConnection(schema)  → setea search_path = "{schema}", public
 *   - releaseConnection(...)  → resetea search_path = public antes de devolver al pool
 *
 * El schema se sanitiza para prevenir SQL injection (solo a-z, 0-9 y _).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SchemaMultiTenantConnectionProvider
        implements MultiTenantConnectionProvider<String>, Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private final DataSource dataSource;

    // ── Conexión genérica (sin tenant) ────────────────────────────────────────

    @Override
    public Connection getAnyConnection() throws SQLException {
        return dataSource.getConnection();
    }

    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException {
        connection.close();
    }

    // ── Conexión para un tenant específico ───────────────────────────────────

    @Override
    public Connection getConnection(String schema) throws SQLException {
        Connection conn = getAnyConnection();
        String safe = sanitize(schema);
        try (Statement s = conn.createStatement()) {
            s.execute("SET search_path TO " + safe + ", public");
        } catch (SQLException e) {
            log.error("Error seteando search_path para schema '{}': {}", safe, e.getMessage());
            conn.close();
            throw e;
        }
        return conn;
    }

    @Override
    public void releaseConnection(String schema, Connection connection) throws SQLException {
        try (Statement s = connection.createStatement()) {
            // Resetear al schema por defecto antes de devolver al pool
            s.execute("SET search_path TO public");
        } catch (SQLException e) {
            log.warn("No se pudo resetear search_path: {}", e.getMessage());
        }
        connection.close();
    }

    // ── Utilidades ────────────────────────────────────────────────────────────

    /**
     * Solo permite caracteres a-z, 0-9 y _ para prevenir inyección SQL.
     * Los nombres de schema generados por TenantServiceImpl ya cumplen esto.
     */
    private static String sanitize(String schema) {
        if (schema == null || schema.isBlank()) return "public";
        return schema.toLowerCase().replaceAll("[^a-z0-9_]", "");
    }

    @Override
    public boolean supportsAggressiveRelease() {
        return false;
    }

    @Override
    public boolean isUnwrappableAs(Class<?> type) {
        return MultiTenantConnectionProvider.class.isAssignableFrom(type);
    }

    @SuppressWarnings("unchecked")
    @Override
    public <T> T unwrap(Class<T> type) {
        if (isUnwrappableAs(type)) return (T) this;
        throw new UnknownUnwrapTypeException(type);
    }
}
