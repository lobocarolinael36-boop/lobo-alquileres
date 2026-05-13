package com.loboalquileres.service;

import com.loboalquileres.dto.response.ContratoResponse;
import com.loboalquileres.dto.response.CuotaResponse;

/**
 * Servicio de notificaciones por email al inquilino.
 *
 * Para activar, configurar en application.yml:
 *   spring.mail.host / username / password
 *   app.email.from
 */
public interface EmailService {

    /** Envía el PDF/detalle del contrato al inquilino al crear el contrato. */
    void enviarContratoCreado(ContratoResponse contrato, String emailInquilino);

    /** Envía el desglose mensual de liquidación (alquiler + tasas + luz). */
    void enviarLiquidacionMensual(CuotaResponse cuota, String emailInquilino);
}
