package com.loboalquileres.entity;

import com.loboalquileres.enums.EstadoCuota;
import com.loboalquileres.enums.MetodoPago;
import com.loboalquileres.enums.TipoIndiceInflacion;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "cuotas",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_cuota_contrato_numero",
        columnNames = {"contrato_id", "numero_cuota"}
    )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cuota {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // CascadeType no está aquí — está en el lado Contrato si lo necesitáramos.
    // La Cuota pertenece al Contrato; si el Contrato se elimina, las Cuotas
    // se eliminan por el ON DELETE CASCADE del SQL (no por JPA).
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contrato_id", nullable = false)
    private Contrato contrato;

    @Column(name = "numero_cuota", nullable = false)
    private Integer numeroCuota;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(name = "fecha_pago")
    private OffsetDateTime fechaPago;

    // Descomposición del monto — BigDecimal obligatorio en todos los campos financieros
    @Column(name = "monto_base", precision = 15, scale = 2, nullable = false)
    private BigDecimal montoBase;

    @Column(name = "monto_ajuste", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal montoAjuste = BigDecimal.ZERO;

    @Column(name = "monto_total", precision = 15, scale = 2, nullable = false)
    private BigDecimal montoTotal;

    @Column(name = "monto_pagado", precision = 15, scale = 2)
    private BigDecimal montoPagado;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", columnDefinition = "estado_cuota", nullable = false)
    @Builder.Default
    private EstadoCuota estado = EstadoCuota.PENDIENTE;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago", columnDefinition = "metodo_pago")
    private MetodoPago metodoPago;

    @Column(name = "numero_comprobante", length = 100)
    private String numeroComprobante;

    // Trazabilidad del índice aplicado — crítico para auditoría
    @Enumerated(EnumType.STRING)
    @Column(name = "indice_aplicado_tipo", columnDefinition = "tipo_indice_inflacion")
    private TipoIndiceInflacion indiceAplicadoTipo;

    @Column(name = "indice_aplicado_pct", precision = 8, scale = 4)
    private BigDecimal indiceAplicadoPct;

    @Column(name = "comision_monto", precision = 15, scale = 2)
    private BigDecimal comisionMonto;

    @Column(name = "comision_pagada", nullable = false)
    @Builder.Default
    private boolean comisionPagada = false;

    // -- Desglose de liquidación mensual -------------------------------------

    @Column(name = "monto_tasa_municipal", precision = 12, scale = 2)
    private BigDecimal montoTasaMunicipal;

    @Column(name = "monto_agua", precision = 12, scale = 2)
    private BigDecimal montoAgua;

    @Column(name = "monto_expensas", precision = 12, scale = 2)
    private BigDecimal montoExpensas;

    @Column(name = "monto_luz", precision = 12, scale = 2)
    private BigDecimal montoLuz;

    @Column(name = "nro_cuenta_luz", length = 20)
    private String nroCuentaLuz;

    /** Total a cobrar: montoTotal + tasaMunicipal + agua + expensas + luz. Calculado al cargar gastos. */
    @Column(name = "monto_liquidacion", precision = 12, scale = 2)
    private BigDecimal montoLiquidacion;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    // -- Métodos de dominio ---------------------------------------------------

    public boolean estaPagada() {
        return estado == EstadoCuota.PAGADA;
    }

    public boolean estaVencida() {
        return estado == EstadoCuota.VENCIDA
            || (estado == EstadoCuota.PENDIENTE && fechaVencimiento.isBefore(LocalDate.now()));
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Cuota other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
