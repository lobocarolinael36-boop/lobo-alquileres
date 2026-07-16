package com.loboalquileres.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(schema = "public", name = "pagos_suscripcion",
    uniqueConstraints = @UniqueConstraint(name = "uq_pago_tenant_mes", columnNames = {"tenant_id", "mes_pago"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PagoSuscripcion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    /** Formato "YYYY-MM", ej: "2026-07" */
    @Column(name = "mes_pago", nullable = false, length = 7)
    private String mesPago;

    @Column(name = "monto", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal monto = BigDecimal.ZERO;

    @Column(name = "metodo", length = 80)
    private String metodo;

    @Column(name = "fecha_pago", nullable = false)
    @Builder.Default
    private LocalDate fechaPago = LocalDate.now();

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    /** "MENSUAL" o "ANUAL". Los pagos anuales generan 12 registros con el mismo grupoId. */
    @Column(name = "tipo_pago", nullable = false, length = 10)
    @Builder.Default
    private String tipoPago = "MENSUAL";

    /** UUID compartido por los 12 registros de un pago anual. Null para pagos mensuales. */
    @Column(name = "grupo_id")
    private UUID grupoId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
