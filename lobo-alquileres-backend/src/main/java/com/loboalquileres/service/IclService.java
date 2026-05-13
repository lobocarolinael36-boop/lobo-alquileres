package com.loboalquileres.service;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Servicio para obtener el Índice de Contratos de Locación (ICL)
 * publicado por el BCRA (Banco Central de la República Argentina).
 *
 * API pública: https://api.bcra.gob.ar/estadisticas/v2.0/monetarias/{idVariable}
 */
public interface IclService {

    /**
     * Obtiene el valor del índice ICL para la fecha indicada.
     * Retorna null si la API no está disponible o no hay dato para esa fecha.
     */
    BigDecimal obtenerValor(LocalDate fecha);

    /**
     * Calcula la variación porcentual del ICL entre dos fechas.
     * Fórmula: ((valorFin - valorInicio) / valorInicio) * 100
     *
     * @return porcentaje de variación (ej: 15.43 para 15,43%)
     *         o null si no hay datos disponibles para el período
     */
    BigDecimal calcularVariacion(LocalDate desde, LocalDate hasta);
}
