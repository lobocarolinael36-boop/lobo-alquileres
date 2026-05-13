package com.loboalquileres.service;

import com.loboalquileres.dto.request.PersonaRequest;
import com.loboalquileres.dto.response.PersonaResponse;
import com.loboalquileres.enums.RolPersona;

import java.util.List;
import java.util.UUID;

public interface PersonaService {
    PersonaResponse crear(PersonaRequest request);
    PersonaResponse actualizar(UUID id, PersonaRequest request);
    PersonaResponse buscarPorId(UUID id);
    List<PersonaResponse> listarActivas();
    List<PersonaResponse> buscarPorRol(RolPersona rol);
    List<PersonaResponse> buscarPorNombre(String texto);
    void desactivar(UUID id);
}
