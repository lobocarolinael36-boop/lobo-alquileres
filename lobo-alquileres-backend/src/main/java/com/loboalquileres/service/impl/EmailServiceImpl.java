package com.loboalquileres.service.impl;

import com.loboalquileres.dto.response.ContratoResponse;
import com.loboalquileres.dto.response.CuotaResponse;
import com.loboalquileres.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from:noreply@loboalquileres.com}")
    private String from;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    private static final DateTimeFormatter FMT_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // -------------------------------------------------------------------------

    @Override
    public void enviarContratoCreado(ContratoResponse contrato, String emailInquilino) {
        if (!emailEnabled || emailInquilino == null || emailInquilino.isBlank()) return;

        String asunto = "Contrato de alquiler " + contrato.numeroContrato() + " — Lobo Alquileres";

        String cuerpo = String.format("""
            Estimado/a %s,

            Le informamos que su contrato de alquiler ha sido registrado exitosamente.

            ─── Detalle del contrato ───────────────────────────────
            Número de contrato : %s
            Inmueble           : %s
            Vigencia           : %s  →  %s
            Monto mensual      : %s %s
            Depósito           : %s mes(es)
            Vencimiento cuota  : día %d de cada mes

            Ante cualquier consulta, comuníquese con su martillero: %s.

            Lobo Alquileres — Gestión de Propiedades
            """,
            contrato.inquilinoNombreCompleto(),
            contrato.numeroContrato(),
            contrato.inmuebleDireccion(),
            contrato.fechaInicio(),
            contrato.fechaFin(),
            contrato.monedaContrato(),
            contrato.montoAlquilerInicial(),
            contrato.depositoMeses(),
            contrato.diaVencimientoCuota(),
            contrato.martilleroNombreCompleto()
        );

        enviar(emailInquilino, asunto, cuerpo);
    }

    @Override
    public void enviarLiquidacionMensual(CuotaResponse cuota, String emailInquilino) {
        if (!emailEnabled || emailInquilino == null || emailInquilino.isBlank()) return;

        String periodo = cuota.fechaVencimiento().format(DateTimeFormatter.ofPattern("MM/yyyy"));
        String asunto  = "Liquidación " + periodo + " — Contrato " + cuota.numeroContrato();

        BigDecimal tasa = cuota.montoTasaMunicipal() != null ? cuota.montoTasaMunicipal() : BigDecimal.ZERO;
        BigDecimal luz  = cuota.montoLuz()           != null ? cuota.montoLuz()           : BigDecimal.ZERO;
        BigDecimal total = cuota.montoLiquidacion()  != null ? cuota.montoLiquidacion()   : cuota.montoTotal();

        String cuerpo = String.format("""
            Estimado/a inquilino/a,

            Le enviamos el detalle de su liquidación mensual correspondiente al período %s:

            ─── Desglose de liquidación ─────────────────────────────
            Alquiler base      : %s %,.0f
            Tasa municipal     : %s %,.0f
            Luz                : %s %,.0f
            ─────────────────────────────────────────────────────────
            TOTAL A PAGAR      : %s %,.0f
            ─────────────────────────────────────────────────────────

            Vencimiento        : %s
            Contrato           : %s

            Lobo Alquileres — Gestión de Propiedades
            """,
            periodo,
            cuota.monedaContrato(), cuota.montoTotal(),
            cuota.monedaContrato(), tasa,
            cuota.monedaContrato(), luz,
            cuota.monedaContrato(), total,
            cuota.fechaVencimiento().format(FMT_FECHA),
            cuota.numeroContrato()
        );

        enviar(emailInquilino, asunto, cuerpo);
    }

    // -------------------------------------------------------------------------

    private void enviar(String destinatario, String asunto, String cuerpo) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(destinatario);
            msg.setSubject(asunto);
            msg.setText(cuerpo);
            mailSender.send(msg);
            log.info("Email enviado a {} — {}", destinatario, asunto);
        } catch (MailException e) {
            log.error("No se pudo enviar el email a {}: {}", destinatario, e.getMessage());
        }
    }
}
