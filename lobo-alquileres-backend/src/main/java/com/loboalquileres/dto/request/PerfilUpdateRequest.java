package com.loboalquileres.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * Actualización parcial del perfil de contacto del tenant (inmobiliaria).
 * Todos los campos son opcionales — solo se aplican los no nulos.
 */
public record PerfilUpdateRequest(

    @Size(max = 200)
    String nombre,

    @Email(message = "Email inválido")
    String email,

    @Size(max = 30)
    String telefono,

    @Size(max = 200)
    String domicilio,

    @Size(max = 20)
    String cuit,

    @Size(max = 200)
    String website

) {}
