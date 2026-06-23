package com.loboalquileres.dto.request;

import com.loboalquileres.enums.RolPersona;
import com.loboalquileres.enums.TipoDocumentoIdentidad;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

public record PersonaRequest(

    @NotNull(message = "El tipo de documento es obligatorio")
    TipoDocumentoIdentidad tipoDocumento,

    @NotBlank(message = "El número de documento es obligatorio")
    @Size(max = 20, message = "El número de documento no puede superar los 20 caracteres")
    String numeroDocumento,

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100)
    String nombre,

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 100)
    String apellido,

    @Size(max = 20)
    String cuil,

    @Size(max = 255)
    String email,

    @Size(max = 30)
    String telefonoPrincipal,

    @Size(max = 30)
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

    // Al menos un rol es necesario para saber qué función cumple la persona
    @NotEmpty(message = "La persona debe tener al menos un rol asignado")
    Set<RolPersona> roles

) {}
