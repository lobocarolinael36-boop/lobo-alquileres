package com.loboalquileres.controller;

import com.loboalquileres.dto.request.CambiarPasswordRequest;
import com.loboalquileres.dto.request.PagoSuscripcionRequest;
import com.loboalquileres.dto.request.TenantRequest;
import com.loboalquileres.dto.response.PagoSuscripcionResponse;
import com.loboalquileres.dto.response.TenantResponse;
import com.loboalquileres.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/tenants")
@RequiredArgsConstructor
@Tag(name = "Admin — Tenants", description = "Gestión de inmobiliarias clientes del SaaS")
public class TenantController {

    private final TenantService tenantService;

    @GetMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Listar todas las inmobiliarias")
    public ResponseEntity<List<TenantResponse>> listar() {
        return ResponseEntity.ok(tenantService.listarTodos());
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Crear una nueva inmobiliaria cliente")
    public ResponseEntity<TenantResponse> crear(@RequestBody @Valid TenantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tenantService.crear(request));
    }

    @PatchMapping("/{id}/toggle-activo")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Activar o desactivar una inmobiliaria (cortar acceso sin eliminar datos)")
    public ResponseEntity<TenantResponse> toggleActivo(@PathVariable UUID id) {
        return ResponseEntity.ok(tenantService.toggleActivo(id));
    }

    @PatchMapping("/{id}/password")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Cambiar la contraseña del admin de una inmobiliaria")
    public ResponseEntity<Void> cambiarPassword(
            @PathVariable UUID id,
            @RequestBody @Valid CambiarPasswordRequest request) {
        tenantService.cambiarPassword(id, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Eliminar una inmobiliaria (los datos del schema se mantienen para recovery)")
    public ResponseEntity<Void> eliminar(@PathVariable UUID id) {
        tenantService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // ── Pagos de suscripción ─────────────────────────────────────────────────

    @GetMapping("/{id}/pagos")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Listar historial de pagos de suscripción de una inmobiliaria")
    public ResponseEntity<List<PagoSuscripcionResponse>> listarPagos(@PathVariable UUID id) {
        return ResponseEntity.ok(tenantService.listarPagos(id));
    }

    @PostMapping("/{id}/pagos")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Registrar un pago de suscripción mensual")
    public ResponseEntity<PagoSuscripcionResponse> registrarPago(
            @PathVariable UUID id,
            @RequestBody @Valid PagoSuscripcionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tenantService.registrarPago(id, request));
    }

    @DeleteMapping("/{id}/pagos/{pagoId}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Eliminar un pago de suscripción registrado por error")
    public ResponseEntity<Void> eliminarPago(@PathVariable UUID id, @PathVariable UUID pagoId) {
        tenantService.eliminarPago(id, pagoId);
        return ResponseEntity.noContent().build();
    }

}
