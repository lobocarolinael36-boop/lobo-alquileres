package com.loboalquileres.dto.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TenantResponse(
    UUID id,
    String nombre,
    String slug,
    String schemaName,
    String email,
    boolean activo,
    String plan,
    LocalDate fechaVencimiento,
    String adminUsername,
    String observaciones,
    // Datos de contacto para encabezado de recibos
    String telefono,
    String domicilio,
    String cuit,
    String website,
    OffsetDateTime createdAt
) {}
