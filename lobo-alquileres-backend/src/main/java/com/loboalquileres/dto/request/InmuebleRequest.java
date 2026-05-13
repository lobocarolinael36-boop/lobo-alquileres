package com.loboalquileres.dto.request;

import com.loboalquileres.enums.Moneda;
import com.loboalquileres.enums.TipoInmueble;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record InmuebleRequest(

    @NotNull(message = "El dueño es obligatorio")
    UUID duenoId,

    @NotNull(message = "El tipo de inmueble es obligatorio")
    TipoInmueble tipo,

    @NotBlank(message = "La calle es obligatoria")
    @Size(max = 200)
    String calle,

    String numeroPuerta,
    String piso,
    String departamentoUnidad,

    @NotBlank(message = "La ciudad es obligatoria")
    String ciudad,

    @NotBlank(message = "La provincia es obligatoria")
    String provincia,

    String codigoPostal,

    @Positive(message = "La superficie cubierta debe ser positiva")
    BigDecimal superficieCubierta,

    @Positive(message = "La superficie total debe ser positiva")
    BigDecimal superficieTotal,

    @Min(value = 1, message = "Los ambientes deben ser al menos 1")
    Integer ambientes,

    @Min(value = 0)
    Integer dormitorios,

    @Min(value = 1)
    Integer banos,

    @Min(value = 0)
    Integer antiguedadAnios,

    boolean tieneCochera,
    boolean tieneBaulera,
    boolean tieneAmenities,

    @Positive(message = "El valor de tasación debe ser positivo")
    BigDecimal valorTasacion,

    Moneda monedaTasacion,

    @Size(max = 30, message = "El número de partida no puede superar los 30 caracteres")
    String nroPartida,

    @DecimalMin(value = "0",   message = "El porcentaje debe ser ≥ 0")
    @DecimalMax(value = "100", message = "El porcentaje debe ser ≤ 100")
    BigDecimal porcentajeGasto,

    String descripcion,
    String observaciones

) {}
