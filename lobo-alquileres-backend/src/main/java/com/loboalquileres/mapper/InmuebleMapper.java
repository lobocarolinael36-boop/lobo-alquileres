package com.loboalquileres.mapper;

import com.loboalquileres.dto.response.InmuebleResponse;
import com.loboalquileres.entity.Inmueble;
import com.loboalquileres.enums.MunicipioPartida;

public final class InmuebleMapper {

    private InmuebleMapper() {}

    public static InmuebleResponse toResponse(Inmueble i) {
        MunicipioPartida municipio = MunicipioPartida.detectar(i.getNroPartida());
        return new InmuebleResponse(
            i.getId(),
            i.getDueno().getId(),
            i.getDueno().getNombreCompleto(),
            i.getTipo(),
            i.getEstado(),
            i.getCalle(),
            i.getNumeroPuerta(),
            i.getPiso(),
            i.getDepartamentoUnidad(),
            i.getCiudad(),
            i.getProvincia(),
            i.getCodigoPostal(),
            i.getDireccionCompleta(),
            i.getSuperficieCubierta(),
            i.getSuperficieTotal(),
            i.getAmbientes(),
            i.getDormitorios(),
            i.getBanos(),
            i.getAntiguedadAnios(),
            i.isTieneCochera(),
            i.isTieneBaulera(),
            i.isTieneAmenities(),
            i.getValorTasacion(),
            i.getMonedaTasacion(),
            i.getNroPartida(),
            i.getPorcentajeGasto(),
            municipio == MunicipioPartida.DESCONOCIDO ? null : municipio.getNombre(),
            municipio.getUrlConsulta(),
            i.getDescripcion(),
            i.getObservaciones(),
            i.isActivo(),
            i.getCreatedAt(),
            i.getUpdatedAt()
        );
    }
}
