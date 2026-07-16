package com.loboalquileres.scheduler;

import com.loboalquileres.entity.Contrato;
import com.loboalquileres.entity.Cuota;
import com.loboalquileres.entity.Tenant;
import com.loboalquileres.enums.EstadoCuota;
import com.loboalquileres.enums.PeriodicidadAjuste;
import com.loboalquileres.enums.TipoAjuste;
import com.loboalquileres.enums.TipoIndiceInflacion;
import com.loboalquileres.repository.ContratoRepository;
import com.loboalquileres.repository.CuotaRepository;
import com.loboalquileres.service.IclService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AjusteInflacionService {

    private final ContratoRepository contratoRepository;
    private final CuotaRepository cuotaRepository;
    private final IclService iclService;

    @Transactional
    public void procesarTenant(Tenant tenant, LocalDate hoy) {
        List<Contrato> contratos = contratoRepository.findConAjustePendienteHasta(hoy);
        if (contratos.isEmpty()) {
            log.debug("[Ajuste] {} — sin contratos pendientes", tenant.getSchemaName());
            return;
        }
        log.info("[Ajuste] {} — {} contratos a ajustar", tenant.getSchemaName(), contratos.size());
        for (Contrato contrato : contratos) {
            try {
                ajustarContrato(contrato, hoy);
            } catch (Exception e) {
                log.error("[Ajuste] {}/{} — error al ajustar: {}",
                    tenant.getSchemaName(), contrato.getNumeroContrato(), e.getMessage(), e);
            }
        }
    }

    @Transactional
    public void marcarVencidas(LocalDate hoy) {
        List<Cuota> vencidas = cuotaRepository.findPendientesVencidas(hoy);
        if (vencidas.isEmpty()) return;
        for (Cuota c : vencidas) {
            c.setEstado(EstadoCuota.VENCIDA);
        }
        cuotaRepository.saveAll(vencidas);
        log.info("[Vencidas] {} cuotas marcadas como VENCIDA", vencidas.size());
    }

    // -------------------------------------------------------------------------

    private void ajustarContrato(Contrato contrato, LocalDate hoy) {
        if (contrato.getTipoAjuste() == TipoAjuste.NINGUNO) {
            avanzarAjuste(contrato);
            return;
        }

        BigDecimal pct = obtenerPorcentaje(contrato, hoy);
        if (pct == null) {
            log.warn("[Ajuste] No se pudo obtener el índice para contrato {} — se reintenta mañana",
                contrato.getNumeroContrato());
            return;
        }

        List<Cuota> todasLasCuotas = cuotaRepository.findByContratoIdOrderByNumeroCuota(contrato.getId());

        // Cuotas pendientes/vencidas cuyo vencimiento cae a partir de la fecha de ajuste
        List<Cuota> aAjustar = todasLasCuotas.stream()
            .filter(c -> !c.getFechaVencimiento().isBefore(contrato.getProximoAjusteFecha()))
            .filter(c -> c.getEstado() == EstadoCuota.PENDIENTE || c.getEstado() == EstadoCuota.VENCIDA)
            .toList();

        if (aAjustar.isEmpty()) {
            log.info("[Ajuste] Contrato {} sin cuotas pendientes para ajustar — avanzando fecha",
                contrato.getNumeroContrato());
            avanzarAjuste(contrato);
            return;
        }

        // Monto base: última cuota ANTES del período de ajuste (o montoAlquilerInicial si es el primer ajuste)
        BigDecimal baseActual = todasLasCuotas.stream()
            .filter(c -> c.getFechaVencimiento().isBefore(contrato.getProximoAjusteFecha()))
            .max(Comparator.comparing(Cuota::getFechaVencimiento))
            .map(Cuota::getMontoTotal)
            .orElse(contrato.getMontoAlquilerInicial());

        BigDecimal factor = BigDecimal.ONE.add(pct.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
        BigDecimal nuevoMonto = baseActual.multiply(factor).setScale(2, RoundingMode.HALF_UP);
        BigDecimal ajuste = nuevoMonto.subtract(contrato.getMontoAlquilerInicial()).max(BigDecimal.ZERO);

        TipoIndiceInflacion tipoIndice = contrato.getTipoAjuste() == TipoAjuste.IPC
            ? TipoIndiceInflacion.IPC
            : TipoIndiceInflacion.ICL;

        for (Cuota c : aAjustar) {
            c.setMontoBase(contrato.getMontoAlquilerInicial());
            c.setMontoAjuste(ajuste);
            c.setMontoTotal(nuevoMonto);
            c.setIndiceAplicadoTipo(tipoIndice);
            c.setIndiceAplicadoPct(pct.setScale(4, RoundingMode.HALF_UP));
            c.setComisionMonto(contrato.calcularComisionSobre(nuevoMonto));
            recalcularLiquidacion(c, nuevoMonto);
        }
        cuotaRepository.saveAll(aAjustar);

        avanzarAjuste(contrato);

        log.info("[Ajuste] Contrato {} {} {} → {} ({} +{}%)",
            contrato.getNumeroContrato(), contrato.getTipoAjuste(), contrato.getMonedaContrato(),
            baseActual, nuevoMonto, tipoIndice, pct.setScale(2, RoundingMode.HALF_UP).toPlainString());
    }

    private BigDecimal obtenerPorcentaje(Contrato contrato, LocalDate hoy) {
        return switch (contrato.getTipoAjuste()) {
            case FIJO_PORCENTAJE -> contrato.getPorcentajeAjusteFijo();
            case ICL, IPC -> {
                LocalDate desde = retrocederPeriodo(contrato.getProximoAjusteFecha(), contrato.getPeriodicidadAjuste());
                yield iclService.calcularVariacion(desde, contrato.getProximoAjusteFecha());
            }
            case NINGUNO -> BigDecimal.ZERO;
        };
    }

    private LocalDate retrocederPeriodo(LocalDate fecha, PeriodicidadAjuste periodicidad) {
        return switch (periodicidad) {
            case MENSUAL      -> fecha.minusMonths(1);
            case TRIMESTRAL   -> fecha.minusMonths(3);
            case CUATRIMESTRAL -> fecha.minusMonths(4);
            case SEMESTRAL    -> fecha.minusMonths(6);
            case ANUAL        -> fecha.minusMonths(12);
        };
    }

    private void avanzarAjuste(Contrato contrato) {
        LocalDate siguiente = switch (contrato.getPeriodicidadAjuste()) {
            case MENSUAL      -> contrato.getProximoAjusteFecha().plusMonths(1);
            case TRIMESTRAL   -> contrato.getProximoAjusteFecha().plusMonths(3);
            case CUATRIMESTRAL -> contrato.getProximoAjusteFecha().plusMonths(4);
            case SEMESTRAL    -> contrato.getProximoAjusteFecha().plusMonths(6);
            case ANUAL        -> contrato.getProximoAjusteFecha().plusMonths(12);
        };
        contrato.setProximoAjusteFecha(siguiente);
        contratoRepository.save(contrato);
    }

    /** Si la cuota ya tenía montoLiquidacion calculado, lo actualiza con el nuevo montoTotal. */
    private void recalcularLiquidacion(Cuota c, BigDecimal nuevoMonto) {
        if (c.getMontoLiquidacion() == null) return;
        BigDecimal servicios = BigDecimal.ZERO;
        if (c.getMontoTasaMunicipal() != null) servicios = servicios.add(c.getMontoTasaMunicipal());
        if (c.getMontoAgua()          != null) servicios = servicios.add(c.getMontoAgua());
        if (c.getMontoExpensas()      != null) servicios = servicios.add(c.getMontoExpensas());
        if (c.getMontoLuz()           != null) servicios = servicios.add(c.getMontoLuz());
        c.setMontoLiquidacion(nuevoMonto.add(servicios));
    }
}
