package com.loboalquileres.service.impl;

import com.loboalquileres.service.IclService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class IclServiceImpl implements IclService {

    private final RestTemplate restTemplate;

    @Value("${bcra.icl.variable-id:41}")
    private int variableId;

    @Value("${bcra.api.url:https://api.bcra.gob.ar/estadisticas/v2.0/monetarias}")
    private String apiUrl;

    /** Al iniciar, auto-descubrir el ID real de la variable ICL buscando "Locaci" en la lista del BCRA. */
    @PostConstruct
    void descubrirVariableId() {
        try {
            @SuppressWarnings("unchecked")
            Map<?, ?> resp = restTemplate.getForObject(apiUrl, Map.class);
            if (resp == null) return;
            List<?> results = (List<?>) resp.get("results");
            if (results == null) return;
            for (Object item : results) {
                if (!(item instanceof Map<?, ?> m)) continue;
                Object descObj = m.get("descripcion");
                String desc = descObj != null ? descObj.toString() : "";
                if (desc.contains("Locaci")) {
                    Object id = m.get("idVariable");
                    if (id != null) {
                        variableId = Integer.parseInt(id.toString());
                        log.info("ICL variable ID auto-descubierto: {} — {}", variableId, desc);
                        return;
                    }
                }
            }
            log.info("No se encontró variable ICL en la lista del BCRA, usando ID configurado: {}", variableId);
        } catch (Exception e) {
            log.warn("No se pudo auto-descubrir la variable ICL ({}), usando ID={}", e.getMessage(), variableId);
        }
    }

    @Override
    public BigDecimal obtenerValor(LocalDate fecha) {
        try {
            String url = String.format("%s/%d?desde=%s&hasta=%s", apiUrl, variableId, fecha, fecha);
            Map<?, ?> response = restTemplate.getForObject(url, Map.class);
            return extraerUltimoValor(response);
        } catch (Exception e) {
            log.warn("No se pudo obtener el ICL del BCRA para {}: {}", fecha, e.getMessage());
            return null;
        }
    }

    @Override
    public BigDecimal calcularVariacion(LocalDate desde, LocalDate hasta) {
        try {
            String url = String.format("%s/%d?desde=%s&hasta=%s", apiUrl, variableId, desde, hasta);
            Map<?, ?> response = restTemplate.getForObject(url, Map.class);

            List<?> results = (List<?>) response.get("results");
            if (results == null || results.size() < 2) return null;

            BigDecimal valorInicio = extraerValorDe(results.get(0));
            BigDecimal valorFin    = extraerValorDe(results.get(results.size() - 1));

            if (valorInicio == null || valorFin == null || valorInicio.compareTo(BigDecimal.ZERO) == 0) {
                return null;
            }

            return valorFin.subtract(valorInicio)
                           .divide(valorInicio, 6, RoundingMode.HALF_UP)
                           .multiply(BigDecimal.valueOf(100))
                           .setScale(4, RoundingMode.HALF_UP);

        } catch (Exception e) {
            log.warn("No se pudo calcular la variación ICL del BCRA ({} → {}): {}", desde, hasta, e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private BigDecimal extraerUltimoValor(Map<?, ?> response) {
        if (response == null) return null;
        List<?> results = (List<?>) response.get("results");
        if (results == null || results.isEmpty()) return null;
        return extraerValorDe(results.get(results.size() - 1));
    }

    @SuppressWarnings("unchecked")
    private BigDecimal extraerValorDe(Object item) {
        if (!(item instanceof Map<?, ?> map)) return null;
        Object val = map.get("valor");
        if (val == null) return null;
        return new BigDecimal(val.toString());
    }
}
