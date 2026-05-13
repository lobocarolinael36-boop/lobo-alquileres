package com.loboalquileres.dto.response;

import com.loboalquileres.enums.EstadoInmueble;
import com.loboalquileres.enums.Moneda;
import com.loboalquileres.enums.TipoInmueble;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record InmuebleResponse(
    UUID id,
    UUID duenoId,
    String duenoNombreCompleto,
    TipoInmueble tipo,
    EstadoInmueble estado,
    String calle,
    String numeroPuerta,
    String piso,
    String departamentoUnidad,
    String ciudad,
    String provincia,
    String codigoPostal,
    String direccionCompleta,
    BigDecimal superficieCubierta,
    BigDecimal superficieTotal,
    Integer ambientes,
    Integer dormitorios,
    Integer banos,
    Integer antiguedadAnios,
    boolean tieneCochera,
    boolean tieneBaulera,
    boolean tieneAmenities,
    BigDecimal valorTasacion,
    Moneda monedaTasacion,
    // Partida municipal y gastos
    String nroPartida,
    BigDecimal porcentajeGasto,
    String municipioNombre,       // nombre del municipio detectado por prefijo de partida
    String municipioUrlConsulta,  // URL de consulta de tasas (si la tiene)
    String descripcion,
    String observaciones,
    boolean activo,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
