package com.loboalquileres.repository;

import com.loboalquileres.entity.Persona;
import com.loboalquileres.enums.RolPersona;
import com.loboalquileres.enums.TipoDocumentoIdentidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PersonaRepository extends JpaRepository<Persona, UUID> {

    // Búsqueda por documento único — para verificar duplicados al registrar.
    Optional<Persona> findByTipoDocumentoAndNumeroDocumento(
        TipoDocumentoIdentidad tipoDocumento,
        String numeroDocumento
    );

    // Verificación de existencia sin cargar la entidad (más eficiente para validaciones).
    boolean existsByTipoDocumentoAndNumeroDocumento(
        TipoDocumentoIdentidad tipoDocumento,
        String numeroDocumento
    );

    // Solo activas para los selects/dropdowns del frontend.
    List<Persona> findByActivoTrue();

    // Búsqueda por texto libre (nombre O apellido) — autocomplete del formulario de contrato.
    // La query está en el nombre del método: Spring Data deriva el SQL automáticamente.
    List<Persona> findByActivoTrueAndNombreContainingIgnoreCaseOrActivoTrueAndApellidoContainingIgnoreCase(
        String nombre,
        String apellido
    );

    // -------------------------------------------------------------------------
    // JPQL personalizado: encuentra personas activas por rol.
    //
    // ¿Por qué JPQL y no un método derivado?
    // Los roles están en un @ElementCollection (una colección dentro de Persona).
    // Para filtrar por un elemento de esa colección, Spring Data necesita un JOIN
    // que no puede derivar automáticamente del nombre del método.
    //
    // "JOIN p.roles r": hace el JOIN entre personas y persona_roles.
    // "WHERE r = :rol": filtra por el enum específico.
    // -------------------------------------------------------------------------
    @Query("SELECT p FROM Persona p JOIN p.roles r WHERE r = :rol AND p.activo = true ORDER BY p.apellido, p.nombre")
    List<Persona> findActivasByRol(@Param("rol") RolPersona rol);

    // Búsqueda por email (para login y validación de duplicados).
    Optional<Persona> findByEmail(String email);
}
