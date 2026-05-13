package com.loboalquileres.mapper;

import com.loboalquileres.dto.response.ContratoResponse;
import com.loboalquileres.dto.response.CuotaResponse;
import com.loboalquileres.entity.Contrato;
import com.loboalquileres.entity.Cuota;
import com.loboalquileres.enums.EstadoCuota;

import java.util.List;

public final class ContratoMapper {

    private ContratoMapper() {}

    public static ContratoResponse toResponse(Contrato c, List<Cuota> cuotas) {
        List<CuotaResponse> cuotasResponse = cuotas.stream()
            .map(CuotaMapper::toResponse)
            .toList();

        long pagadas  = cuotas.stream().filter(q -> q.getEstado() == EstadoCuota.PAGADA).count();
        long vencidas = cuotas.stream().filter(Cuota::estaVencida).count();
        long pendientes = cuotas.stream()
            .filter(q -> q.getEstado() == EstadoCuota.PENDIENTE || q.getEstado() == EstadoCuota.PAGADA_PARCIAL)
            .count();

        return new ContratoResponse(
            c.getId(),
            c.getNumeroContrato(),
            c.getInmueble().getId(),
            c.getInmueble().getDireccionCompleta(),
            c.getInquilino().getId(),
            c.getInquilino().getNombreCompleto(),
            c.getGarante() != null ? c.getGarante().getId()            : null,
            c.getGarante() != null ? c.getGarante().getNombreCompleto() : null,
            c.getMartillero().getId(),
            c.getMartillero().getNombreCompleto(),
            c.getFechaInicio(),
            c.getFechaFin(),
            c.getMontoAlquilerInicial(),
            c.getMonedaContrato(),
            c.getTipoAjuste(),
            c.getPeriodicidadAjuste(),
            c.getPorcentajeAjusteFijo(),
            c.getProximoAjusteFecha(),
            c.getComisionPorcentaje(),
            c.getDepositoMeses(),
            c.getDepositoMonto(),
            c.isDepositoDevuelto(),
            c.getDiaVencimientoCuota(),
            c.getEstado(),
            cuotas.size(),
            pagadas,
            pendientes,
            vencidas,
            cuotasResponse,
            c.getClausulasAdicionales(),
            c.getObservaciones(),
            c.getCreatedAt()
        );
    }
}
