package com.loboalquileres.entity;

import com.loboalquileres.enums.EstadoInmueble;
import com.loboalquileres.enums.Moneda;
import com.loboalquileres.enums.TipoInmueble;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "inmuebles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Inmueble {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // -------------------------------------------------------------------------
    // Relación Inmueble → Persona (dueño)
    //
    // FetchType.LAZY (explícito): aunque es el default de JPA para @ManyToOne,
    // Hibernate lo ignora y usa EAGER por defecto. SIEMPRE escribirlo explícito.
    //
    // ¿Por qué LAZY? Cuando listamos 50 inmuebles para el dashboard, NO
    // necesitamos los datos completos del dueño de cada uno. Con LAZY, Hibernate
    // no hace el JOIN — solo carga el dueño si accedemos a inmueble.getDueno().
    // Con EAGER cargaríamos 50 personas innecesariamente.
    //
    // No hay CascadeType aquí: el ciclo de vida de una Persona es independiente
    // del ciclo de vida del Inmueble. Eliminar un inmueble nunca debe eliminar
    // a su dueño.
    // -------------------------------------------------------------------------
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dueno_id", nullable = false)
    private Persona dueno;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", columnDefinition = "tipo_inmueble", nullable = false)
    private TipoInmueble tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", columnDefinition = "estado_inmueble", nullable = false)
    @Builder.Default
    private EstadoInmueble estado = EstadoInmueble.DISPONIBLE;

    // -- Dirección del inmueble -----------------------------------------------

    @Column(name = "calle", length = 200, nullable = false)
    private String calle;

    @Column(name = "numero_puerta", length = 20)
    private String numeroPuerta;

    @Column(name = "piso", length = 10)
    private String piso;

    @Column(name = "departamento_unidad", length = 20)
    private String departamentoUnidad;

    @Column(name = "ciudad", length = 100, nullable = false)
    @Builder.Default
    private String ciudad = "Buenos Aires";

    @Column(name = "provincia", length = 100, nullable = false)
    @Builder.Default
    private String provincia = "Buenos Aires";

    @Column(name = "codigo_postal", length = 10)
    private String codigoPostal;

    // -- Características físicas ----------------------------------------------

    // Integer para SMALLINT: más ergonómico que Short en Java (no requiere casts).
    // JDBC maneja la conversión automáticamente.
    @Column(name = "superficie_cubierta", precision = 10, scale = 2)
    private BigDecimal superficieCubierta;

    @Column(name = "superficie_total", precision = 10, scale = 2)
    private BigDecimal superficieTotal;

    @Column(name = "ambientes")
    private Integer ambientes;

    @Column(name = "dormitorios")
    private Integer dormitorios;

    @Column(name = "banos")
    private Integer banos;

    @Column(name = "antiguedad_anios")
    private Integer antiguedadAnios;

    @Column(name = "tiene_cochera", nullable = false)
    @Builder.Default
    private boolean tieneCochera = false;

    @Column(name = "tiene_baulera", nullable = false)
    @Builder.Default
    private boolean tieneBaulera = false;

    @Column(name = "tiene_amenities", nullable = false)
    @Builder.Default
    private boolean tieneAmenities = false;

    // -- Valuación financiera -------------------------------------------------
    // BigDecimal OBLIGATORIO. Nunca Double ni Float para montos de dinero.
    // precision=15, scale=2 mapea a NUMERIC(15,2) en PostgreSQL.

    @Column(name = "valor_tasacion", precision = 15, scale = 2)
    private BigDecimal valorTasacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "moneda_tasacion", columnDefinition = "moneda")
    @Builder.Default
    private Moneda monedaTasacion = Moneda.USD;

    // -- Partida municipal y prorrateo de gastos ------------------------------

    @Column(name = "nro_partida", length = 30)
    private String nroPartida;

    /** % (0-100) del gasto de servicios que paga este inquilino.
     *  Útil en edificios con un solo medidor compartido (ej: 25% si son 4 dptos). */
    @Column(name = "porcentaje_gasto", precision = 5, scale = 2)
    private BigDecimal porcentajeGasto;

    // -- Descriptivo ----------------------------------------------------------

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    // -- Métodos de dominio ---------------------------------------------------

    public String getDireccionCompleta() {
        StringBuilder sb = new StringBuilder(calle);
        if (numeroPuerta != null) sb.append(" ").append(numeroPuerta);
        if (piso != null) sb.append(", Piso ").append(piso);
        if (departamentoUnidad != null) sb.append(" Dpto. ").append(departamentoUnidad);
        sb.append(", ").append(ciudad);
        return sb.toString();
    }

    public boolean estaDisponible() {
        return activo && estado == EstadoInmueble.DISPONIBLE;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Inmueble other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
