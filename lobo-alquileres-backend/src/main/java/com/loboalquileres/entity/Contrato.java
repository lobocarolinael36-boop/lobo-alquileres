package com.loboalquileres.entity;

import com.loboalquileres.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "contratos")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Número legible generado por la app (ej: "CTR-2024-0001").
    // La lógica de generación vive en ContratoService, no en la entidad.
    @Column(name = "numero_contrato", length = 20, unique = true, nullable = false)
    private String numeroContrato;

    // -------------------------------------------------------------------------
    // RELACIONES — cuatro @ManyToOne, todas LAZY, ninguna con Cascade.
    //
    // ¿Por qué no hay Cascade en NINGUNA?
    // Un Contrato referencia entidades que existen independientemente. Si se
    // elimina un contrato, el Inmueble sigue existiendo, el Inquilino sigue
    // existiendo, el Martillero sigue existiendo. El Cascade solo tiene sentido
    // cuando el hijo no puede vivir sin el padre (como Cuota → Contrato, que
    // veremos en la entidad Cuota con CascadeType.ALL).
    //
    // ¿Por qué garante es optional=true?
    // El SQL define garante_id como nullable. En JPA, optional=false genera un
    // JOIN INNER; optional=true genera un LEFT JOIN. Si garante fuera
    // optional=false y el valor es null, Hibernate lanzaría una excepción al
    // cargar el contrato.
    // -------------------------------------------------------------------------

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inmueble_id", nullable = false)
    private Inmueble inmueble;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inquilino_id", nullable = false)
    private Persona inquilino;

    // El garante es opcional (no todo contrato lo requiere)
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "garante_id", nullable = true)
    private Persona garante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "martillero_id", nullable = false)
    private Persona martillero;

    // -- Vigencia -------------------------------------------------------------

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    // -- Monto y moneda -------------------------------------------------------
    // BigDecimal OBLIGATORIO. El CHECK de la DB garantiza que sea > 0, pero la
    // validación se refuerza también en el Service con @Positive de Bean Validation.

    @Column(name = "monto_alquiler_inicial", precision = 15, scale = 2, nullable = false)
    private BigDecimal montoAlquilerInicial;

    @Enumerated(EnumType.STRING)
    @Column(name = "moneda_contrato", columnDefinition = "moneda", nullable = false)
    @Builder.Default
    private Moneda monedaContrato = Moneda.ARS;

    // -- Motor de ajuste por inflación ----------------------------------------

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_ajuste", columnDefinition = "tipo_ajuste", nullable = false)
    @Builder.Default
    private TipoAjuste tipoAjuste = TipoAjuste.ICL;

    @Enumerated(EnumType.STRING)
    @Column(name = "periodicidad_ajuste", columnDefinition = "periodicidad_ajuste", nullable = false)
    @Builder.Default
    private PeriodicidadAjuste periodicidadAjuste = PeriodicidadAjuste.CUATRIMESTRAL;

    // Solo se usa cuando tipoAjuste == FIJO_PORCENTAJE.
    // El CHECK de la DB lo garantiza, pero AjusteInflacionService también lo valida.
    @Column(name = "porcentaje_ajuste_fijo", precision = 6, scale = 3)
    private BigDecimal porcentajeAjusteFijo;

    // Fecha del próximo ajuste programado. El motor de inflación la consulta
    // diariamente para saber qué contratos necesitan notificación.
    @Column(name = "proximo_ajuste_fecha")
    private LocalDate proximoAjusteFecha;

    // -- Comisión -------------------------------------------------------------

    @Column(name = "comision_porcentaje", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal comisionPorcentaje = new BigDecimal("10.00");

    // -- Depósito -------------------------------------------------------------

    @Column(name = "deposito_meses", nullable = false)
    @Builder.Default
    private Integer depositoMeses = 1;

    @Column(name = "deposito_monto", precision = 15, scale = 2)
    private BigDecimal depositoMonto;

    @Column(name = "deposito_devuelto", nullable = false)
    @Builder.Default
    private boolean depositoDevuelto = false;

    @Column(name = "deposito_fecha_devolucion")
    private LocalDate depositoFechaDevolucion;

    // -- Configuración de cuotas ----------------------------------------------

    @Column(name = "dia_vencimiento_cuota", nullable = false)
    @Builder.Default
    private Integer diaVencimientoCuota = 10;

    // -- Estado y texto libre -------------------------------------------------

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", columnDefinition = "estado_contrato", nullable = false)
    @Builder.Default
    private EstadoContrato estado = EstadoContrato.ACTIVO;

    @Column(name = "clausulas_adicionales", columnDefinition = "TEXT")
    private String clausulasAdicionales;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    // -- Métodos de dominio ---------------------------------------------------

    public boolean estaActivo() {
        return estado == EstadoContrato.ACTIVO;
    }

    public boolean tieneGarante() {
        return garante != null;
    }

    /**
     * Calcula el monto de comisión del martillero para un monto de cuota dado.
     * La lógica vive en la entidad porque es una regla de negocio intrínseca
     * al contrato (el porcentaje es parte de sus datos).
     */
    public BigDecimal calcularComisionSobre(BigDecimal montoCuota) {
        return montoCuota
            .multiply(comisionPorcentaje)
            .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Contrato other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
