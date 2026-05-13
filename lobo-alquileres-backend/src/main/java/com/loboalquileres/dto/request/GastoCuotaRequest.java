package com.loboalquileres.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Carga mensual de gastos variables sobre una cuota:
 * tasa municipal (prorrateada) + luz (prorrateada).
 * El backend recalcula montoLiquidacion = montoTotal + tasa + luz.
 */
public record GastoCuotaRequest(

    @DecimalMin(value = "0", message = "El monto de tasa municipal no puede ser negativo")
    BigDecimal montoTasaMunicipal,

    @DecimalMin(value = "0", message = "El monto de agua no puede ser negativo")
    BigDecimal montoAgua,

    @DecimalMin(value = "0", message = "El monto de expensas no puede ser negativo")
    BigDecimal montoExpensas,

    @DecimalMin(value = "0", message = "El monto de luz no puede ser negativo")
    BigDecimal montoLuz,

    @Pattern(regexp = "\\d{0,20}", message = "El número de cuenta debe contener solo dígitos (máx. 20)")
    @Size(max = 20)
    String nroCuentaLuz

) {}
