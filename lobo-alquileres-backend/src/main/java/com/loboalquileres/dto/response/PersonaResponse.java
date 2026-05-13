package com.loboalquileres.dto.response;

import com.loboalquileres.enums.RolPersona;
import com.loboalquileres.enums.TipoDocumentoIdentidad;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

public record PersonaResponse(
    UUID id,
    TipoDocumentoIdentidad tipoDocumento,
    String numeroDocumento,
    String nombre,
    String apellido,
    String nombreCompleto,       // apellido + ", " + nombre — listo para mostrar
    String email,
    String telefonoPrincipal,
    String telefonoAlternativo,
    String calle,
    String numeroPuerta,
    String piso,
    String departamentoUnidad,
    String ciudad,
    String provincia,
    String codigoPostal,
    LocalDate fechaNacimiento,
    String observaciones,
    boolean activo,
    Set<RolPersona> roles,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
