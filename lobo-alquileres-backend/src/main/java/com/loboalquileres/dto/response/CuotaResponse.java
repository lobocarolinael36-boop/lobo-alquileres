package com.loboalquileres.dto.response;

import com.loboalquileres.enums.EstadoCuota;
import com.loboalquileres.enums.MetodoPago;
import com.loboalquileres.enums.Moneda;
import com.loboalquileres.enums.TipoIndiceInflacion;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CuotaResponse(
    UUID id,
    UUID contratoId,
    String numeroContrato,
    Moneda monedaContrato,
    Integer numeroCuota,
    LocalDate fechaVencimiento,
    OffsetDateTime fechaPago,
    BigDecimal montoBase,
    BigDecimal montoAjuste,
    BigDecimal montoTotal,
    BigDecimal montoPagado,
    EstadoCuota estado,
    MetodoPago metodoPago,
    String numeroComprobante,
    TipoIndiceInflacion indiceAplicadoTipo,
    BigDecimal indiceAplicadoPct,
    BigDecimal comisionMonto,
    boolean comisionPagada,
    // Desglose de liquidación mensual
    BigDecimal montoTasaMunicipal,
    BigDecimal montoAgua,
    BigDecimal montoExpensas,
    BigDecimal montoLuz,
    String nroCuentaLuz,
    BigDecimal montoLiquidacion,
    String observaciones
) {}
