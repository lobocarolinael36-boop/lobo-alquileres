package com.loboalquileres.config;

import com.loboalquileres.multitenancy.SchemaMultiTenantConnectionProvider;
import com.loboalquileres.multitenancy.TenantIdentifierResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Inyecta la configuración multi-tenant en Hibernate sin reemplazar
 * el EntityManagerFactory de Spring Boot (menos riesgo de ruptura).
 *
 * Estrategia SCHEMA: Hibernate setea el search_path de PostgreSQL por tenant.
 * Los beans TenantIdentifierResolver y SchemaMultiTenantConnectionProvider
 * se registran como objetos Hibernate (no como strings de clase), lo que
 * permite el uso de @Autowired en esos beans.
 */
@Configuration
@RequiredArgsConstructor
public class HibernateMultiTenancyConfig {

    private final SchemaMultiTenantConnectionProvider connectionProvider;
    private final TenantIdentifierResolver tenantResolver;

    @Bean
    public HibernatePropertiesCustomizer hibernateMultiTenancyCustomizer() {
        return properties -> {
            properties.put("hibernate.multiTenancy", "SCHEMA");
            properties.put("hibernate.multi_tenant_connection_provider", connectionProvider);
            properties.put("hibernate.tenant_identifier_resolver", tenantResolver);
        };
    }
}
