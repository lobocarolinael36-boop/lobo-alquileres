package com.loboalquileres.service;

import com.loboalquileres.dto.request.GastoCuotaRequest;
import com.loboalquileres.dto.request.PagoRequest;
import com.loboalquileres.dto.response.CuotaResponse;

import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/**
 * Servicio de gestión de cuotas y registro de pagos.
 *
 * Las cuotas se crean automáticamente al crear un contrato
 * (ver {@link ContratoService#crear}). Este servicio las consulta
 * y permite registrar pagos totales o parciales.
 */
public interface CuotaService {

    /**
     * Lista todas las cuotas cuya fecha de vencimiento cae dentro del mes indicado.
     * Se usa en la pantalla "Cuotas y Cobros" del panel.
     *
     * @param mes  mes y año a consultar (ej: YearMonth.of(2026, 5))
     */
    List<CuotaResponse> listarPorMes(YearMonth mes);

    /**
     * Registra un pago (total o parcial) sobre una cuota.
     * Actualiza el estado de la cuota según el monto informado:
     *   montoPagado >= montoTotal  →  PAGADA
     *   montoPagado  < montoTotal  →  PAGADA_PARCIAL
     *
     * @throws com.loboalquileres.exception.BusinessRuleException si la cuota ya está completamente pagada
     * @throws com.loboalquileres.exception.ResourceNotFoundException si la cuota no existe
     */
    CuotaResponse registrarPago(UUID cuotaId, PagoRequest request);

    /**
     * Carga o actualiza los gastos variables de una cuota (tasa municipal + luz).
     * Recalcula montoLiquidacion = montoTotal + tasa + luz.
     */
    CuotaResponse actualizarGastos(UUID cuotaId, GastoCuotaRequest request);
}
