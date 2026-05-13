package com.loboalquileres.dto.request;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record TenantRequest(

    @NotBlank(message = "El nombre de la inmobiliaria es obligatorio")
    @Size(max = 200)
    String nombre,

    /** Identificador único URL-safe (ej: "lobo", "remax-centro"). Se usa como schema. */
    @NotBlank(message = "El slug es obligatorio")
    @Pattern(regexp = "^[a-z0-9][a-z0-9\\-]{1,48}[a-z0-9]$",
             message = "El slug solo puede contener letras minúsculas, números y guiones (3-50 chars)")
    String slug,

    @Email(message = "Email inválido")
    String email,

    @NotBlank(message = "El nombre de usuario del admin es obligatorio")
    @Size(min = 3, max = 50)
    String adminUsername,

    @NotBlank(message = "La contraseña del admin es obligatoria")
    @Size(min = 8, max = 100, message = "La contraseña debe tener entre 8 y 100 caracteres")
    String adminPassword,

    @NotBlank(message = "El plan es obligatorio")
    String plan,

    LocalDate fechaVencimiento,

    String observaciones,

    // Datos de contacto para encabezado de recibos (opcionales)
    @Size(max = 30)
    String telefono,

    @Size(max = 200)
    String domicilio,

    @Size(max = 20)
    String cuit,

    @Size(max = 200)
    String website
) {}
