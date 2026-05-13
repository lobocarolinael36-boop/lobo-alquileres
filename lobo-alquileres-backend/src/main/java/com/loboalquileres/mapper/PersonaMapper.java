package com.loboalquileres.mapper;

import com.loboalquileres.dto.response.PersonaResponse;
import com.loboalquileres.entity.Persona;

// Clase de utilidad estática — no necesita ser un @Component porque no tiene
// dependencias de Spring. Es pura lógica de transformación sin estado.
public final class PersonaMapper {

    private PersonaMapper() {}

    public static PersonaResponse toResponse(Persona p) {
        return new PersonaResponse(
            p.getId(),
            p.getTipoDocumento(),
            p.getNumeroDocumento(),
            p.getNombre(),
            p.getApellido(),
            p.getNombreCompleto(),
            p.getEmail(),
            p.getTelefonoPrincipal(),
            p.getTelefonoAlternativo(),
            p.getCalle(),
            p.getNumeroPuerta(),
            p.getPiso(),
            p.getDepartamentoUnidad(),
            p.getCiudad(),
            p.getProvincia(),
            p.getCodigoPostal(),
            p.getFechaNacimiento(),
            p.getObservaciones(),
            p.isActivo(),
            p.getRoles(),
            p.getCreatedAt(),
            p.getUpdatedAt()
        );
    }
}
