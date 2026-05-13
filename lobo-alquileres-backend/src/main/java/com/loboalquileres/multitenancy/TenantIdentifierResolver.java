package com.loboalquileres.multitenancy;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

/**
 * Le dice a Hibernate qué schema usar para el request actual.
 * Si no hay tenant en el contexto (superadmin), usa "public".
 */
@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<String> {

    private static final String DEFAULT_SCHEMA = "public";

    @Override
    public String resolveCurrentTenantIdentifier() {
        String schema = TenantContext.get();
        return (schema != null && !schema.isBlank()) ? schema : DEFAULT_SCHEMA;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        // true: re-valida el tenant en sesiones existentes de Hibernate (stateless, siempre OK)
        return true;
    }
}
