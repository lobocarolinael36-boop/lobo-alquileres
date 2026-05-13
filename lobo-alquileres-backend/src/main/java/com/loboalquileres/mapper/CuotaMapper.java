package com.loboalquileres.mapper;

import com.loboalquileres.dto.response.CuotaResponse;
import com.loboalquileres.entity.Cuota;

public final class CuotaMapper {

    private CuotaMapper() {}

    public static CuotaResponse toResponse(Cuota c) {
        return new CuotaResponse(
            c.getId(),
            c.getContrato().getId(),
            c.getContrato().getNumeroContrato(),
            c.getContrato().getMonedaContrato(),
            c.getNumeroCuota(),
            c.getFechaVencimiento(),
            c.getFechaPago(),
            c.getMontoBase(),
            c.getMontoAjuste(),
            c.getMontoTotal(),
            c.getMontoPagado(),
            c.getEstado(),
            c.getMetodoPago(),
            c.getNumeroComprobante(),
            c.getIndiceAplicadoTipo(),
            c.getIndiceAplicadoPct(),
            c.getComisionMonto(),
            c.isComisionPagada(),
            c.getMontoTasaMunicipal(),
            c.getMontoAgua(),
            c.getMontoExpensas(),
            c.getMontoLuz(),
            c.getNroCuentaLuz(),
            c.getMontoLiquidacion(),
            c.getObservaciones()
        );
    }
}
