package com.loboalquileres.repository;

import com.loboalquileres.entity.Inmueble;
import com.loboalquileres.enums.EstadoInmueble;
import com.loboalquileres.enums.TipoInmueble;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InmuebleRepository extends JpaRepository<Inmueble, UUID> {

    // Todos los inmuebles de un dueño (para la pantalla de perfil del propietario).
    List<Inmueble> findByDuenoIdAndActivoTrue(UUID duenoId);

    // Filtro por estado (para el dashboard: cuántos disponibles, cuántos alquilados).
    List<Inmueble> findByEstadoAndActivoTrue(EstadoInmueble estado);

    // Filtro combinado para búsquedas avanzadas.
    List<Inmueble> findByTipoAndEstadoAndActivoTrue(TipoInmueble tipo, EstadoInmueble estado);

    // Búsqueda textual por dirección (autocomplete al crear contrato).
    @Query("""
        SELECT i FROM Inmueble i
        WHERE i.activo = true
        AND (
            LOWER(i.calle) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR LOWER(i.ciudad) LIKE LOWER(CONCAT('%', :texto, '%'))
        )
        ORDER BY i.ciudad, i.calle
        """)
    List<Inmueble> buscarPorDireccion(@Param("texto") String texto);

    // -------------------------------------------------------------------------
    // Verifica si un inmueble tiene algún contrato activo.
    // Crítico para: evitar crear dos contratos activos sobre el mismo inmueble.
    //
    // Nótese que consultamos la tabla "contratos" desde JPQL usando la entidad
    // Contrato, NO con SQL nativo. Esto mantiene el código independiente del
    // nombre real de las tablas en la DB.
    // -------------------------------------------------------------------------
    @Query("""
        SELECT COUNT(c) > 0 FROM Contrato c
        WHERE c.inmueble.id = :inmuebleId
        AND c.estado = com.loboalquileres.enums.EstadoContrato.ACTIVO
        """)
    boolean tieneContratoActivo(@Param("inmuebleId") UUID inmuebleId);

    // KPI del dashboard: cuenta inmuebles por estado para los cards de resumen.
    @Query("""
        SELECT i.estado, COUNT(i) FROM Inmueble i
        WHERE i.activo = true
        GROUP BY i.estado
        """)
    List<Object[]> contarPorEstado();
}
