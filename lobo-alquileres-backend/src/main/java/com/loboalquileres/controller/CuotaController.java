package com.loboalquileres.controller;

import com.loboalquileres.dto.request.GastoCuotaRequest;
import com.loboalquileres.dto.request.PagoRequest;
import com.loboalquileres.dto.response.CuotaResponse;
import com.loboalquileres.service.CuotaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cuotas")
@RequiredArgsConstructor
@Tag(name = "Cuotas", description = "Consulta de cuotas y registro de pagos")
public class CuotaController {

    private final CuotaService cuotaService;

    // =========================================================================
    // CONSULTAS
    // =========================================================================

    /**
     * Cuotas cuya fecha de vencimiento cae en el mes indicado.
     * Se usa en el panel "Cuotas y Cobros" para el selector de mes.
     *
     * @param mes  formato YYYY-MM  (ej: 2026-05)
     */
    @GetMapping("/por-mes")
    @Operation(summary = "Listar cuotas de un mes (formato YYYY-MM)")
    public ResponseEntity<List<CuotaResponse>> porMes(@RequestParam String mes) {
        return ResponseEntity.ok(cuotaService.listarPorMes(YearMonth.parse(mes)));
    }

    // =========================================================================
    // PAGOS
    // =========================================================================

    /**
     * Registra un pago total o parcial sobre una cuota.
     * El estado de la cuota se actualiza automáticamente:
     *   montoPagado >= montoTotal  →  PAGADA
     *   montoPagado  < montoTotal  →  PAGADA_PARCIAL
     */
    @PostMapping("/{id}/pagar")
    @PreAuthorize("hasAnyRole('ADMIN', 'MARTILLERO')")
    @Operation(summary = "Registrar pago total o parcial de una cuota")
    public ResponseEntity<CuotaResponse> pagar(
            @PathVariable UUID id,
            @RequestBody @Valid PagoRequest request) {
        return ResponseEntity.ok(cuotaService.registrarPago(id, request));
    }

    // =========================================================================
    // GASTOS VARIABLES
    // =========================================================================

    /**
     * Carga o actualiza los gastos variables de una cuota (tasa municipal + luz).
     * El backend recalcula montoLiquidacion = montoTotal + tasa + luz.
     */
    @PatchMapping("/{id}/gastos")
    @PreAuthorize("hasAnyRole('ADMIN', 'MARTILLERO')")
    @Operation(summary = "Cargar gastos variables de una cuota (tasa + luz)")
    public ResponseEntity<CuotaResponse> actualizarGastos(
            @PathVariable UUID id,
            @RequestBody @Valid GastoCuotaRequest request) {
        return ResponseEntity.ok(cuotaService.actualizarGastos(id, request));
    }
}
