package com.loboalquileres.scheduler;

import com.loboalquileres.entity.Tenant;
import com.loboalquileres.multitenancy.TenantContext;
import com.loboalquileres.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AjusteInflacionScheduler {

    private final TenantRepository tenantRepository;
    private final AjusteInflacionService ajusteInflacionService;

    /**
     * Corre diariamente a las 8 AM UTC.
     * Para cada tenant activo: aplica el ajuste ICL/IPC/fijo a las cuotas
     * cuyo período de ajuste ya venció.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void ejecutarAjustes() {
        LocalDate hoy = LocalDate.now();
        log.info("[AjusteInflacion] Iniciando proceso — {}", hoy);

        List<Tenant> tenants = tenantRepository.findAll().stream()
            .filter(Tenant::isActivo)
            .toList();

        for (Tenant tenant : tenants) {
            TenantContext.set(tenant.getSchemaName());
            try {
                ajusteInflacionService.procesarTenant(tenant, hoy);
            } catch (Exception e) {
                log.error("[AjusteInflacion] Error en tenant {}: {}", tenant.getSchemaName(), e.getMessage(), e);
            } finally {
                TenantContext.clear();
            }
        }

        log.info("[AjusteInflacion] Proceso finalizado para {} tenants", tenants.size());
    }

    /**
     * Corre diariamente a las 1 AM UTC.
     * Marca como VENCIDA toda cuota PENDIENTE cuya fecha de vencimiento ya pasó.
     * Se ejecuta por cada tenant activo.
     */
    @Scheduled(cron = "0 0 1 * * *")
    public void marcarCuotasVencidas() {
        LocalDate hoy = LocalDate.now();
        log.debug("[Vencidas] Iniciando marcado de cuotas vencidas — {}", hoy);

        List<Tenant> tenants = tenantRepository.findAll().stream()
            .filter(Tenant::isActivo)
            .toList();

        for (Tenant tenant : tenants) {
            TenantContext.set(tenant.getSchemaName());
            try {
                ajusteInflacionService.marcarVencidas(hoy);
            } catch (Exception e) {
                log.error("[Vencidas] Error en tenant {}: {}", tenant.getSchemaName(), e.getMessage(), e);
            } finally {
                TenantContext.clear();
            }
        }
    }
}
