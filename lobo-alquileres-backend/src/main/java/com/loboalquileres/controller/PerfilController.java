package com.loboalquileres.controller;

import com.loboalquileres.dto.request.PerfilUpdateRequest;
import com.loboalquileres.dto.response.TenantResponse;
import com.loboalquileres.multitenancy.TenantContext;
import com.loboalquileres.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

/**
 * Expone datos del tenant (inmobiliaria) activo.
 * Accesible por cualquier usuario autenticado con tenantSchema — se usa
 * para obtener el encabezado de recibos PDF sin necesitar permisos de SUPERADMIN.
 */
@RestController
@RequestMapping("/api/v1/perfil")
@RequiredArgsConstructor
@Tag(name = "Perfil", description = "Datos de la inmobiliaria activa (encabezado de recibos)")
public class PerfilController {

    private final TenantService tenantService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MARTILLERO','AGENTE')")
    @Operation(summary = "Obtener perfil de la inmobiliaria actual")
    public ResponseEntity<TenantResponse> getPerfil() {
        String schema = TenantContext.get();
        if (schema == null) {
            throw new ResponseStatusException(BAD_REQUEST, "No hay tenant activo en el contexto.");
        }
        return ResponseEntity.ok(tenantService.getBySchemaName(schema));
    }

    @PatchMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar datos de contacto de la inmobiliaria actual")
    public ResponseEntity<TenantResponse> actualizarPerfil(@RequestBody @Valid PerfilUpdateRequest request) {
        String schema = TenantContext.get();
        if (schema == null) {
            throw new ResponseStatusException(BAD_REQUEST, "No hay tenant activo en el contexto.");
        }
        return ResponseEntity.ok(tenantService.actualizarPerfil(schema, request));
    }
}
