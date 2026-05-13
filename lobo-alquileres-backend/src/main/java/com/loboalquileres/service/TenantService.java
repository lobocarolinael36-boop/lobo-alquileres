package com.loboalquileres.service;

import com.loboalquileres.dto.request.CambiarPasswordRequest;
import com.loboalquileres.dto.request.PerfilUpdateRequest;
import com.loboalquileres.dto.request.TenantRequest;
import com.loboalquileres.dto.response.TenantResponse;

import java.util.List;
import java.util.UUID;

public interface TenantService {

    List<TenantResponse> listarTodos();

    TenantResponse crear(TenantRequest request);

    TenantResponse toggleActivo(UUID id);

    void cambiarPassword(UUID id, CambiarPasswordRequest request);

    void eliminar(UUID id);

    /** Devuelve el perfil del tenant activo para el encabezado de recibos */
    TenantResponse getBySchemaName(String schemaName);

    /** Actualiza los datos de contacto del tenant activo */
    TenantResponse actualizarPerfil(String schemaName, PerfilUpdateRequest request);
}
