package com.loboalquileres.dto.request;

import com.loboalquileres.enums.Moneda;
import com.loboalquileres.enums.PeriodicidadAjuste;
import com.loboalquileres.enums.TipoAjuste;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ContratoRequest(

    @NotNull(message = "El inmueble es obligatorio")
    UUID inmuebleId,

    @NotNull(message = "El inquilino es obligatorio")
    UUID inquilinoId,

    // Nullable: no todo contrato requiere garante
    UUID garanteId,

    @NotNull(message = "El martillero es obligatorio")
    UUID martilleroId,

    @NotNull(message = "La fecha de inicio es obligatoria")
    LocalDate fechaInicio,

    @NotNull(message = "La fecha de fin es obligatoria")
    LocalDate fechaFin,

    @NotNull(message = "El monto de alquiler es obligatorio")
    @Positive(message = "El monto de alquiler debe ser mayor a cero")
    BigDecimal montoAlquilerInicial,

    @NotNull(message = "La moneda es obligatoria")
    Moneda monedaContrato,

    @NotNull(message = "El tipo de ajuste es obligatorio")
    TipoAjuste tipoAjuste,

    @NotNull(message = "La periodicidad de ajuste es obligatoria")
    PeriodicidadAjuste periodicidadAjuste,

    // Solo requerido cuando tipoAjuste == FIJO_PORCENTAJE.
    // La validación cruzada la hace ContratoService, no Bean Validation.
    @Positive(message = "El porcentaje de ajuste fijo debe ser positivo")
    BigDecimal porcentajeAjusteFijo,

    @NotNull
    @DecimalMin(value = "0", message = "La comisión no puede ser negativa")
    @DecimalMax(value = "100", message = "La comisión no puede superar el 100%")
    BigDecimal comisionPorcentaje,

    @NotNull
    @Min(value = 1, message = "El depósito debe ser de al menos 1 mes")
    @Max(value = 6, message = "El depósito no puede superar los 6 meses")
    Integer depositoMeses,

    @NotNull
    @Min(value = 1, message = "El día de vencimiento debe ser entre 1 y 28")
    @Max(value = 28, message = "El día de vencimiento debe ser entre 1 y 28")
    Integer diaVencimientoCuota,

    String clausulasAdicionales,
    String observaciones

) {}
