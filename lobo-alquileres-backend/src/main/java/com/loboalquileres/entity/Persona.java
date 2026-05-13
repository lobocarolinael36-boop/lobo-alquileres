package com.loboalquileres.entity;

import com.loboalquileres.enums.RolPersona;
import com.loboalquileres.enums.TipoDocumentoIdentidad;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(
    name = "personas",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_persona_documento",
        columnNames = {"tipo_documento", "numero_documento"}
    )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Persona {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // columnDefinition mapea al tipo PostgreSQL custom. Sin esto, Hibernate
    // esperaría "varchar" y fallaría al validar contra "tipo_documento_identidad".
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_documento", columnDefinition = "tipo_documento_identidad", nullable = false)
    private TipoDocumentoIdentidad tipoDocumento;

    @Column(name = "numero_documento", length = 20, nullable = false)
    private String numeroDocumento;

    @Column(name = "nombre", length = 100, nullable = false)
    private String nombre;

    @Column(name = "apellido", length = 100, nullable = false)
    private String apellido;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "telefono_principal", length = 30)
    private String telefonoPrincipal;

    @Column(name = "telefono_alternativo", length = 30)
    private String telefonoAlternativo;

    @Column(name = "calle", length = 200)
    private String calle;

    @Column(name = "numero_puerta", length = 20)
    private String numeroPuerta;

    @Column(name = "piso", length = 10)
    private String piso;

    @Column(name = "departamento_unidad", length = 20)
    private String departamentoUnidad;

    @Column(name = "ciudad", length = 100)
    private String ciudad;

    @Column(name = "provincia", length = 100)
    private String provincia;

    @Column(name = "codigo_postal", length = 10)
    private String codigoPostal;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Builder.Default
    @Column(name = "activo", nullable = false)
    private boolean activo = true;

    // -------------------------------------------------------------------------
    // ROLES — @ElementCollection es la forma correcta de mapear una tabla de
    // valores simples asociados a una entidad (persona_roles). No usamos una
    // entidad separada PersonaRol porque los roles no tienen identidad propia
    // ni necesitan ser consultados de forma independiente.
    //
    // FetchType.EAGER: los roles son parte fundamental de la identidad de la
    // persona. Cada vez que cargamos una Persona necesitamos saber qué puede
    // hacer en el sistema. Con EAGER Hibernate los trae en la misma query.
    // -------------------------------------------------------------------------
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "persona_roles",
        joinColumns = @JoinColumn(name = "persona_id")
    )
    @Column(name = "rol", columnDefinition = "rol_persona")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<RolPersona> roles = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    // -------------------------------------------------------------------------
    // equals/hashCode basado SOLO en id — patrón recomendado por Hibernate para
    // entidades JPA. La razón: un @Data o @EqualsAndHashCode de Lombok generaría
    // equals comparando TODOS los campos, lo cual:
    //   1. Dispara lazy loading de relaciones al comparar → N+1 queries ocultas.
    //   2. Causa bucles infinitos si dos entidades se referencian mutuamente.
    //   3. Rompe colecciones (Set/HashMap) cuando el ID cambia al persistir.
    //
    // hashCode() retorna getClass().hashCode() (constante): permite que una
    // entidad sin ID (nueva, antes del persist) viva en un Set sin problema.
    // -------------------------------------------------------------------------
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Persona other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    // Métodos de dominio — encapsulan lógica de negocio simple directamente en
    // la entidad, evitando duplicar estas verificaciones en múltiples servicios.
    public boolean tieneRol(RolPersona rol) {
        return roles.contains(rol);
    }

    public String getNombreCompleto() {
        return apellido + ", " + nombre;
    }
}
