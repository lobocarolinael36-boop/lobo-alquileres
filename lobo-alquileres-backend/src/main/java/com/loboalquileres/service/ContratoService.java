package com.loboalquileres.service;

import com.loboalquileres.dto.request.ContratoRequest;
import com.loboalquileres.dto.response.ContratoResponse;
import com.loboalquileres.dto.response.CuotaResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ContratoService {
    ContratoResponse crear(ContratoRequest request);
    ContratoResponse buscarPorId(UUID id);
    ContratoResponse buscarPorNumero(String numeroContrato);
    List<ContratoResponse> listarActivos();
    /** Todos los contratos sin filtro de estado — para la pantalla principal con filtros. */
    List<ContratoResponse> listarTodos();
    List<ContratoResponse> listarPorInmueble(UUID inmuebleId);
    List<ContratoResponse> listarPorInquilino(UUID inquilinoId);

    // Acciones del ciclo de vida del contrato
    ContratoResponse rescindir(UUID id, String observaciones);
    ContratoResponse devolver(UUID id);  // devolver depósito

    // Consultas del motor de inflación
    List<ContratoResponse> buscarConAjustePendiente(LocalDate hasta);
    List<CuotaResponse> listarCuotas(UUID contratoId);
}
