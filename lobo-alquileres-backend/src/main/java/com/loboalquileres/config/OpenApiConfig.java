package com.loboalquileres.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        final String securitySchemeName = "Bearer Auth";

        return new OpenAPI()
            .info(new Info()
                .title("Lobo Alquileres — API")
                .description("Sistema de gestión de alquileres inmobiliarios. " +
                    "Autenticarse en /api/v1/auth/login y usar el token en el botón 'Authorize'.")
                .version("1.0.0")
                .contact(new Contact()
                    .name("Lobo Alquileres")
                    .email("admin@loboalquileres.com")))
            // Agrega el campo "Authorize" con Bearer token a todo Swagger UI
            .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
            .components(new Components()
                .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                    .name(securitySchemeName)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")));
    }
}
