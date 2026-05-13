package com.loboalquileres.controller;

import com.loboalquileres.dto.request.PersonaRequest;
import com.loboalquileres.dto.response.PersonaResponse;
import com.loboalquileres.enums.RolPersona;
import com.loboalquileres.service.PersonaService;
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
@RequestMapping("/api/v1/personas")
@RequiredArgsConstructor
@Tag(name = "Personas", description = "Gestión de dueños, inquilinos, garantes y martilleros")
public class PersonaController {

    private final PersonaService personaService;

    // -------------------------------------------------------------------------
    // GET — Lecturas: accesibles por cualquier usuario autenticado
    // -------------------------------------------------------------------------

    @GetMapping
    @Operation(summary = "Listar todas las personas activas")
    public ResponseEntity<List<PersonaResponse>> listarActivas() {
        return ResponseEntity.ok(personaService.listarActivas());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener persona por ID")
    public ResponseEntity<PersonaResponse> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(personaService.buscarPorId(id));
    }

    @GetMapping("/buscar")
    @Operation(summary = "Buscar personas por nombre o apellido (autocomplete)")
    public ResponseEntity<List<PersonaResponse>> buscar(@RequestParam String q) {
        return ResponseEntity.ok(personaService.buscarPorNombre(q));
    }

    @GetMapping("/por-rol/{rol}")
    @Operation(summary = "Listar personas por rol (para dropdowns del formulario de contrato)")
    public ResponseEntity<List<PersonaResponse>> porRol(@PathVariable RolPersona rol) {
        return ResponseEntity.ok(personaService.buscarPorRol(rol));
    }

    // -------------------------------------------------------------------------
    // POST / PUT — Escrituras: solo ADMIN y MARTILLERO
    // @PreAuthorize evalúa la expresión SpEL antes de entrar al método.
    // Si falla, Spring Security retorna 403 Forbidden automáticamente.
    // -------------------------------------------------------------------------

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MARTILLERO')")
    @Operation(summary = "Registrar una nueva persona")
    public ResponseEntity<PersonaResponse> crear(@RequestBody @Valid PersonaRequest request) {
        PersonaResponse creada = personaService.crear(request);
        // 201 Created con el objeto creado — estándar REST para POST exitoso
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MARTILLERO')")
    @Operation(summary = "Actualizar datos de una persona")
    public ResponseEntity<PersonaResponse> actualizar(
            @PathVariable UUID id,
            @RequestBody @Valid PersonaRequest request) {
        return ResponseEntity.ok(personaService.actualizar(id, request));
    }

    // -------------------------------------------------------------------------
    // DELETE — Soft delete: solo ADMIN
    // -------------------------------------------------------------------------

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desactivar una persona (soft delete)")
    public ResponseEntity<Void> desactivar(@PathVariable UUID id) {
        personaService.desactivar(id);
        return ResponseEntity.noContent().build();  // 204 No Content — estándar para DELETE
    }
}
