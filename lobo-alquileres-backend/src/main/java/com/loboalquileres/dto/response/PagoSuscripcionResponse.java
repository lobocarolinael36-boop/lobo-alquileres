package com.loboalquileres.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PagoSuscripcionResponse(
    UUID id,
    String mesPago,
    BigDecimal monto,
    String metodo,
    LocalDate fechaPago,
    String observaciones,
    OffsetDateTime createdAt,
    String tipoPago,
    UUID grupoId
) {}
