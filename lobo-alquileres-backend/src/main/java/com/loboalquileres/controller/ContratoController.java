package com.loboalquileres.controller;

import com.loboalquileres.dto.request.ContratoRequest;
import com.loboalquileres.dto.response.ContratoResponse;
import com.loboalquileres.dto.response.CuotaResponse;
import com.loboalquileres.service.ContratoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/contratos")
@RequiredArgsConstructor
@Tag(name = "Contratos", description = "Gestión de contratos de alquiler y cuotas")
public class ContratoController {

    private final ContratoService contratoService;

    // =========================================================================
    // CONSULTAS
    // =========================================================================

    @GetMapping
    @Operation(summary = "Listar contratos activos")
    public ResponseEntity<List<ContratoResponse>> listarActivos() {
        return ResponseEntity.ok(contratoService.listarActivos());
    }

    @GetMapping("/todos")
    @Operation(summary = "Listar todos los contratos (todos los estados)")
    public ResponseEntity<List<ContratoResponse>> listarTodos() {
        return ResponseEntity.ok(contratoService.listarTodos());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener contrato por ID con todas sus cuotas")
    public ResponseEntity<ContratoResponse> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(contratoService.buscarPorId(id));
    }

    @GetMapping("/numero/{numeroContrato}")
    @Operation(summary = "Buscar contrato por número legible (ej: CTR-2025-0001)")
    public ResponseEntity<ContratoResponse> buscarPorNumero(@PathVariable String numeroContrato) {
        return ResponseEntity.ok(contratoService.buscarPorNumero(numeroContrato));
    }

    @GetMapping("/por-inmueble/{inmuebleId}")
    @Operation(summary = "Historial de contratos de un inmueble")
    public ResponseEntity<List<ContratoResponse>> porInmueble(@PathVariable UUID inmuebleId) {
        return ResponseEntity.ok(contratoService.listarPorInmueble(inmuebleId));
    }

    @GetMapping("/por-inquilino/{inquilinoId}")
    @Operation(summary = "Contratos de un inquilino")
    public ResponseEntity<List<ContratoResponse>> porInquilino(@PathVariable UUID inquilinoId) {
        return ResponseEntity.ok(contratoService.listarPorInquilino(inquilinoId));
    }

    @GetMapping("/{id}/cuotas")
    @Operation(summary = "Listar todas las cuotas de un contrato")
    public ResponseEntity<List<CuotaResponse>> listarCuotas(@PathVariable UUID id) {
        return ResponseEntity.ok(contratoService.listarCuotas(id));
    }

    // =========================================================================
    // MOTOR DE INFLACIÓN — endpoint consultado por el scheduler y el dashboard
    // =========================================================================

    @GetMapping("/ajuste-pendiente")
    @Operation(
        summary = "Contratos activos con ajuste por inflación pendiente",
        description = "Retorna los contratos cuyo próximo ajuste vence hasta la fecha indicada. " +
                      "Si no se pasa fecha, usa hoy + 7 días como alerta preventiva."
    )
    public ResponseEntity<List<ContratoResponse>> ajustePendiente(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {

        LocalDate fechaLimite = hasta != null ? hasta : LocalDate.now().plusDays(7);
        return ResponseEntity.ok(contratoService.buscarConAjustePendiente(fechaLimite));
    }

    // =========================================================================
    // CREACIÓN Y ACCIONES DE CICLO DE VIDA
    // =========================================================================

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MARTILLERO')")
    @Operation(
        summary = "Crear un nuevo contrato",
        description = "Genera automáticamente el número de contrato y todas las cuotas del período."
    )
    public ResponseEntity<ContratoResponse> crear(@RequestBody @Valid ContratoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contratoService.crear(request));
    }

    // PATCH en vez de PUT: modifica solo una parte del recurso (el estado)
    @PatchMapping("/{id}/rescindir")
    @PreAuthorize("hasAnyRole('ADMIN', 'MARTILLERO')")
    @Operation(summary = "Rescindir un contrato activo y liberar el inmueble")
    public ResponseEntity<ContratoResponse> rescindir(
            @PathVariable UUID id,
            @RequestParam(required = false) String observaciones) {
        return ResponseEntity.ok(contratoService.rescindir(id, observaciones));
    }

    @PatchMapping("/{id}/devolver-deposito")
    @PreAuthorize("hasAnyRole('ADMIN', 'MARTILLERO')")
    @Operation(summary = "Registrar la devolución del depósito de garantía")
    public ResponseEntity<ContratoResponse> devolverDeposito(@PathVariable UUID id) {
        return ResponseEntity.ok(contratoService.devolver(id));
    }
}
