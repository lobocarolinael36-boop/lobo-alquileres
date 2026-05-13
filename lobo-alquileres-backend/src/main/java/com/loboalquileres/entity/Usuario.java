package com.loboalquileres.entity;

import com.loboalquileres.enums.RolUsuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(schema = "public", name = "usuarios")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Un usuario puede (pero no debe obligatoriamente) estar vinculado
    // a una Persona del sistema. Ej: el martillero que usa la app.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "persona_id")
    private Persona persona;

    @Column(name = "username", length = 50, unique = true, nullable = false)
    private String username;

    // BCrypt hash — nunca almacenar passwords en texto plano
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "email", length = 255, unique = true, nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", columnDefinition = "rol_usuario", nullable = false)
    @Builder.Default
    private RolUsuario rol = RolUsuario.AGENTE;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private boolean activo = true;

    /**
     * Schema PostgreSQL al que pertenece este usuario.
     * NULL → superadmin (no pertenece a ningún tenant).
     * "tenant_xyz" → usuario de la inmobiliaria con slug "xyz".
     */
    @Column(name = "tenant_schema", length = 50)
    private String tenantSchema;

    @Column(name = "ultimo_login")
    private OffsetDateTime ultimoLogin;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Usuario other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
