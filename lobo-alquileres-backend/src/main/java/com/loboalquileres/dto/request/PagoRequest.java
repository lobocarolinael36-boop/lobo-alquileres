package com.loboalquileres.dto.request;

import com.loboalquileres.enums.MetodoPago;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO para registrar el pago (total o parcial) de una cuota.
 *
 * El backend determina el nuevo estado de la cuota:
 *   - montoPagado >= montoTotal  →  PAGADA
 *   - montoPagado  < montoTotal  →  PAGADA_PARCIAL
 */
public record PagoRequest(

    @NotNull(message = "La fecha de pago es obligatoria")
    LocalDate fechaPago,

    @NotNull(message = "El método de pago es obligatorio")
    MetodoPago metodoPago,

    @NotNull(message = "El monto pagado es obligatorio")
    @Positive(message = "El monto pagado debe ser mayor a cero")
    BigDecimal montoPagado,

    /** Número de transferencia, cheque, recibo, etc. Opcional. */
    String numeroComprobante,

    String observaciones

) {}
