package com.loboalquileres.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Representa una inmobiliaria (tenant) que usa el SaaS.
 * Siempre vive en el schema "public", independientemente del contexto de tenant activo.
 */
@Entity
@Table(schema = "public", name = "tenants")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "nombre", nullable = false, length = 200)
    private String nombre;

    /** Identificador URL-safe, se usa como nombre del schema PostgreSQL: tenant_{slug} */
    @Column(name = "slug", unique = true, nullable = false, length = 50)
    private String slug;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private boolean activo = true;

    @Column(name = "plan", length = 50, nullable = false)
    @Builder.Default
    private String plan = "BASICO";

    /** Fecha hasta la que el tenant está habilitado (null = sin vencimiento configurado) */
    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    @Column(name = "observaciones")
    private String observaciones;

    // -- Datos de contacto para encabezado de recibos -------------------------

    /**
     * Nombre del schema calculado, se persiste para búsquedas rápidas.
     * El getter se define explícitamente abajo con fallback por slug.
     */
    @Getter(AccessLevel.NONE)
    @Column(name = "schema_name", length = 50)
    private String schemaName;

    @Column(name = "telefono", length = 30)
    private String telefono;

    @Column(name = "domicilio", length = 200)
    private String domicilio;

    @Column(name = "cuit", length = 20)
    private String cuit;

    @Column(name = "website", length = 200)
    private String website;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /**
     * Nombre del schema PostgreSQL para este tenant.
     * Devuelve el valor persistido si está disponible (post V6),
     * o lo calcula desde el slug como fallback para registros anteriores.
     */
    public String getSchemaName() {
        if (schemaName != null && !schemaName.isBlank()) return schemaName;
        return "tenant_" + slug.toLowerCase().replaceAll("[^a-z0-9]", "_");
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Tenant other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() { return getClass().hashCode(); }
}
