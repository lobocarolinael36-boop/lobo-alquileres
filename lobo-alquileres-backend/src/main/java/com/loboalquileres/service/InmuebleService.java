package com.loboalquileres.service;

import com.loboalquileres.dto.request.InmuebleRequest;
import com.loboalquileres.dto.response.InmuebleResponse;
import com.loboalquileres.enums.EstadoInmueble;

import java.util.List;
import java.util.UUID;

public interface InmuebleService {
    InmuebleResponse crear(InmuebleRequest request);
    InmuebleResponse actualizar(UUID id, InmuebleRequest request);
    InmuebleResponse buscarPorId(UUID id);
    List<InmuebleResponse> listarActivos();
    List<InmuebleResponse> listarPorDueno(UUID duenoId);
    List<InmuebleResponse> listarPorEstado(EstadoInmueble estado);
    List<InmuebleResponse> buscarPorDireccion(String texto);
    void desactivar(UUID id);
}
