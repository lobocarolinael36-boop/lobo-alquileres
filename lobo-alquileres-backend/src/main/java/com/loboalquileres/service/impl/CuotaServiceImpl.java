package com.loboalquileres.service.impl;

import com.loboalquileres.dto.request.GastoCuotaRequest;
import com.loboalquileres.dto.request.PagoRequest;
import com.loboalquileres.dto.response.CuotaResponse;
import com.loboalquileres.entity.Cuota;
import com.loboalquileres.enums.EstadoCuota;
import com.loboalquileres.exception.BusinessRuleException;
import com.loboalquileres.exception.ResourceNotFoundException;
import com.loboalquileres.mapper.CuotaMapper;
import com.loboalquileres.repository.CuotaRepository;
import com.loboalquileres.service.CuotaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CuotaServiceImpl implements CuotaService {

    private final CuotaRepository cuotaRepository;

    // =========================================================================
    // CONSULTAS
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public List<CuotaResponse> listarPorMes(YearMonth mes) {
        LocalDate inicio = mes.atDay(1);
        LocalDate fin    = mes.atEndOfMonth();
        return cuotaRepository.findByFechaVencimientoBetweenWithContrato(inicio, fin)
            .stream()
            .map(CuotaMapper::toResponse)
            .toList();
    }

    // =========================================================================
    // PAGOS
    // =========================================================================

    @Override
    @Transactional
    public CuotaResponse registrarPago(UUID cuotaId, PagoRequest request) {
        // findById retorna proxy con Contrato LAZY — al estar en @Transactional
        // el acceso posterior a c.getContrato() en el Mapper no genera LazyException.
        Cuota cuota = cuotaRepository.findById(cuotaId)
            .orElseThrow(() -> new ResourceNotFoundException("Cuota", cuotaId));

        if (cuota.getEstado() == EstadoCuota.PAGADA) {
            throw new BusinessRuleException(
                "La cuota #" + cuota.getNumeroCuota() + " del contrato "
                + cuota.getContrato().getNumeroContrato() + " ya fue pagada completamente."
            );
        }

        // Registrar datos del pago
        cuota.setFechaPago(request.fechaPago().atStartOfDay().atOffset(ZoneOffset.UTC));
        cuota.setMetodoPago(request.metodoPago());
        cuota.setMontoPagado(request.montoPagado());
        cuota.setNumeroComprobante(request.numeroComprobante());

        if (request.observaciones() != null && !request.observaciones().isBlank()) {
            cuota.setObservaciones(request.observaciones());
        }

        // Determinar nuevo estado
        int cmp = request.montoPagado().compareTo(cuota.getMontoTotal());
        cuota.setEstado(cmp >= 0 ? EstadoCuota.PAGADA : EstadoCuota.PAGADA_PARCIAL);

        return CuotaMapper.toResponse(cuotaRepository.save(cuota));
    }

    // =========================================================================
    // GASTOS VARIABLES
    // =========================================================================

    @Override
    @Transactional
    public CuotaResponse actualizarGastos(UUID cuotaId, GastoCuotaRequest request) {
        Cuota cuota = cuotaRepository.findById(cuotaId)
            .orElseThrow(() -> new ResourceNotFoundException("Cuota", cuotaId));

        BigDecimal tasa     = orZero(request.montoTasaMunicipal());
        BigDecimal agua     = orZero(request.montoAgua());
        BigDecimal expensas = orZero(request.montoExpensas());
        BigDecimal luz      = orZero(request.montoLuz());

        cuota.setMontoTasaMunicipal(nullIfZero(tasa));
        cuota.setMontoAgua(nullIfZero(agua));
        cuota.setMontoExpensas(nullIfZero(expensas));
        cuota.setMontoLuz(nullIfZero(luz));
        cuota.setNroCuentaLuz(request.nroCuentaLuz());

        // Recalcular liquidación total: alquiler + tasa + agua + expensas + luz
        cuota.setMontoLiquidacion(
            cuota.getMontoTotal().add(tasa).add(agua).add(expensas).add(luz)
        );

        return CuotaMapper.toResponse(cuotaRepository.save(cuota));
    }

    // =========================================================================
    // HELPERS PRIVADOS
    // =========================================================================

    private static BigDecimal orZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private static BigDecimal nullIfZero(BigDecimal v) {
        return v != null && v.compareTo(BigDecimal.ZERO) != 0 ? v : null;
    }
}
