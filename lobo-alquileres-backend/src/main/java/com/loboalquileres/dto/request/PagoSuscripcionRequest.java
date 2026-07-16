package com.loboalquileres.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PagoSuscripcionRequest(

    /**
     * Mes de inicio del pago. Formato "YYYY-MM".
     * Para MENSUAL: el mes que se está pagando.
     * Para ANUAL: el primer mes de los 12 que se cubren.
     * Por defecto se usa el mes actual.
     */
    @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "Formato de mes inválido, use YYYY-MM")
    String mesPago,

    /** "MENSUAL" (default) o "ANUAL". */
    String tipoPago,

    @DecimalMin(value = "0", message = "El monto no puede ser negativo")
    BigDecimal monto,

    @Size(max = 80)
    String metodo,

    LocalDate fechaPago,

    String observaciones
) {}
