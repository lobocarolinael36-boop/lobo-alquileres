package com.loboalquileres.dto.response;

import com.loboalquileres.enums.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ContratoResponse(
    UUID id,
    String numeroContrato,

    // Datos del inmueble — los suficientes para mostrar en la UI sin un request extra
    UUID inmuebleId,
    String inmuebleDireccion,

    // Personas — solo ID + nombre para los cards y listas
    UUID inquilinoId,
    String inquilinoNombreCompleto,
    UUID garanteId,                   // puede ser null
    String garanteNombreCompleto,     // puede ser null
    UUID martilleroId,
    String martilleroNombreCompleto,

    LocalDate fechaInicio,
    LocalDate fechaFin,

    BigDecimal montoAlquilerInicial,
    Moneda monedaContrato,

    TipoAjuste tipoAjuste,
    PeriodicidadAjuste periodicidadAjuste,
    BigDecimal porcentajeAjusteFijo,
    LocalDate proximoAjusteFecha,

    BigDecimal comisionPorcentaje,
    Integer depositoMeses,
    BigDecimal depositoMonto,
    boolean depositoDevuelto,

    Integer diaVencimientoCuota,
    EstadoContrato estado,

    // KPIs de cuotas — para mostrar el progreso en la card del contrato
    int totalCuotas,
    long cuotasPagadas,
    long cuotasPendientes,
    long cuotasVencidas,

    List<CuotaResponse> cuotas,       // incluidas en la vista de detalle

    String clausulasAdicionales,
    String observaciones,
    OffsetDateTime createdAt
) {}
