package com.loboalquileres.controller;

import com.loboalquileres.dto.request.InmuebleRequest;
import com.loboalquileres.dto.response.InmuebleResponse;
import com.loboalquileres.enums.EstadoInmueble;
import com.loboalquileres.service.InmuebleService;
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
@RequestMapping("/api/v1/inmuebles")
@RequiredArgsConstructor
@Tag(name = "Inmuebles", description = "Gestión del portfolio de propiedades")
public class InmuebleController {

    private final InmuebleService inmuebleService;

    @GetMapping
    @Operation(summary = "Listar todos los inmuebles activos")
    public ResponseEntity<List<InmuebleResponse>> listarActivos() {
        return ResponseEntity.ok(inmuebleService.listarActivos());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener inmueble por ID")
    public ResponseEntity<InmuebleResponse> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(inmuebleService.buscarPorId(id));
    }

    @GetMapping("/buscar")
    @Operation(summary = "Buscar por dirección (autocomplete al crear contratos)")
    public ResponseEntity<List<InmuebleResponse>> buscar(@RequestParam String q) {
        return ResponseEntity.ok(inmuebleService.buscarPorDireccion(q));
    }

    @GetMapping("/por-estado/{estado}")
    @Operation(summary = "Filtrar por estado (DISPONIBLE, ALQUILADO, etc.)")
    public ResponseEntity<List<InmuebleResponse>> porEstado(@PathVariable EstadoInmueble estado) {
        return ResponseEntity.ok(inmuebleService.listarPorEstado(estado));
    }

    @GetMapping("/por-dueno/{duenoId}")
    @Operation(summary = "Listar inmuebles de un dueño específico")
    public ResponseEntity<List<InmuebleResponse>> porDueno(@PathVariable UUID duenoId) {
        return ResponseEntity.ok(inmuebleService.listarPorDueno(duenoId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MARTILLERO')")
    @Operation(summary = "Registrar un nuevo inmueble")
    public ResponseEntity<InmuebleResponse> crear(@RequestBody @Valid InmuebleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inmuebleService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MARTILLERO')")
    @Operation(summary = "Actualizar datos de un inmueble")
    public ResponseEntity<InmuebleResponse> actualizar(
            @PathVariable UUID id,
            @RequestBody @Valid InmuebleRequest request) {
        return ResponseEntity.ok(inmuebleService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desactivar un inmueble (solo si no tiene contrato activo)")
    public ResponseEntity<Void> desactivar(@PathVariable UUID id) {
        inmuebleService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
