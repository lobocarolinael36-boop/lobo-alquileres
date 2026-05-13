package com.loboalquileres.repository;

import com.loboalquileres.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    // UserDetailsService carga al usuario por username al validar el JWT
    Optional<Usuario> findByUsernameAndActivoTrue(String username);

    boolean existsByUsernameOrEmail(String username, String email);

    List<Usuario> findAllByTenantSchemaOrderByCreatedAtDesc(String tenantSchema);

    boolean existsByTenantSchema(String tenantSchema);
}
