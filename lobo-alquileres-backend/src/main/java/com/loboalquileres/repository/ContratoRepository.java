package com.loboalquileres.repository;

import com.loboalquileres.entity.Contrato;
import com.loboalquileres.enums.EstadoContrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContratoRepository extends JpaRepository<Contrato, UUID> {

    // Búsqueda por número legible (para el buscador principal de la app).
    Optional<Contrato> findByNumeroContrato(String numeroContrato);

    // Todos los contratos de un inmueble (historial de alquileres).
    List<Contrato> findByInmuebleIdOrderByFechaInicioDesc(UUID inmuebleId);

    // Todos los contratos de un inquilino.
    List<Contrato> findByInquilinoIdOrderByFechaInicioDesc(UUID inquilinoId);

    // Contratos por estado (el más frecuente: solo ACTIVOS para el dashboard).
    List<Contrato> findByEstado(EstadoContrato estado);

    // Todos los contratos sin filtro — para la pantalla principal con filtros en memoria.
    List<Contrato> findAllByOrderByCreatedAtDesc();

    // -------------------------------------------------------------------------
    // MOTOR DE INFLACIÓN — query más crítica del sistema.
    //
    // Busca contratos activos cuyo próximo ajuste ya venció o vence en los
    // próximos días. El scheduler (@Scheduled) del AjusteInflacionService
    // llama esto diariamente para generar alertas al martillero.
    //
    // El índice parcial idx_contratos_proximo_ajuste que creamos en la DB
    // hace esta query extremadamente eficiente: solo lee contratos ACTIVOS.
    // -------------------------------------------------------------------------
    @Query("""
        SELECT c FROM Contrato c
        WHERE c.estado = com.loboalquileres.enums.EstadoContrato.ACTIVO
        AND c.proximoAjusteFecha IS NOT NULL
        AND c.proximoAjusteFecha <= :fecha
        ORDER BY c.proximoAjusteFecha ASC
        """)
    List<Contrato> findConAjustePendienteHasta(@Param("fecha") LocalDate fecha);

    // -------------------------------------------------------------------------
    // Evita solapamiento de contratos en el mismo inmueble.
    // Se llama en ContratoService antes de crear un nuevo contrato.
    //
    // La lógica de solapamiento de intervalos: dos rangos [A,B] y [C,D] se
    // solapan cuando A <= D AND B >= C.
    // -------------------------------------------------------------------------
    @Query("""
        SELECT COUNT(c) > 0 FROM Contrato c
        WHERE c.inmueble.id = :inmuebleId
        AND c.estado = com.loboalquileres.enums.EstadoContrato.ACTIVO
        AND c.fechaInicio <= :fechaFin
        AND c.fechaFin >= :fechaInicio
        """)
    boolean existeContratoActivoSolapado(
        @Param("inmuebleId") UUID inmuebleId,
        @Param("fechaInicio") LocalDate fechaInicio,
        @Param("fechaFin") LocalDate fechaFin
    );

    // -------------------------------------------------------------------------
    // Generación del número de contrato correlativo.
    // Se usa en ContratoService para generar el siguiente número (ej: CTR-2024-0042).
    // Extrae el máximo número del año actual desde los contratos existentes.
    // -------------------------------------------------------------------------
    @Query("""
        SELECT COUNT(c) FROM Contrato c
        WHERE YEAR(c.createdAt) = :anio
        """)
    long contarPorAnio(@Param("anio") int anio);

    // Contratos próximos a vencer (para alertas preventivas al martillero).
    @Query("""
        SELECT c FROM Contrato c
        WHERE c.estado = com.loboalquileres.enums.EstadoContrato.ACTIVO
        AND c.fechaFin BETWEEN :desde AND :hasta
        ORDER BY c.fechaFin ASC
        """)
    List<Contrato> findProximosAVencer(
        @Param("desde") LocalDate desde,
        @Param("hasta") LocalDate hasta
    );

    // KPIs del dashboard.
    long countByEstado(EstadoContrato estado);
}
