package com.loboalquileres.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

    @NotBlank(message = "El username es obligatorio")
    String username,

    @NotBlank(message = "La contraseña es obligatoria")
    String password

) {}
