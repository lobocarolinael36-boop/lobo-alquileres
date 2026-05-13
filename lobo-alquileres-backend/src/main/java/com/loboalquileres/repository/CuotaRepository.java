package com.loboalquileres.repository;

import com.loboalquileres.entity.Cuota;
import com.loboalquileres.enums.EstadoCuota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CuotaRepository extends JpaRepository<Cuota, UUID> {

    // Lista completa de cuotas de un contrato ordenada — para la pantalla de detalle
    List<Cuota> findByContratoIdOrderByNumeroCuota(UUID contratoId);

    // Busca la cuota exacta de un contrato por su número — para registrar un pago
    Optional<Cuota> findByContratoIdAndNumeroCuota(UUID contratoId, Integer numeroCuota);

    // Cuotas pendientes que ya vencieron — para el job diario que actualiza estados
    @Query("""
        SELECT c FROM Cuota c
        WHERE c.estado = com.loboalquileres.enums.EstadoCuota.PENDIENTE
        AND c.fechaVencimiento < :hoy
        """)
    List<Cuota> findPendientesVencidas(@Param("hoy") LocalDate hoy);

    // KPI del dashboard: cuotas vencidas sin cobrar
    long countByEstado(EstadoCuota estado);

    // Cuotas próximas a vencer en N días — para la lista de alertas del martillero
    @Query("""
        SELECT c FROM Cuota c
        WHERE c.estado = com.loboalquileres.enums.EstadoCuota.PENDIENTE
        AND c.fechaVencimiento BETWEEN :desde AND :hasta
        ORDER BY c.fechaVencimiento ASC
        """)
    List<Cuota> findProximasAVencer(
        @Param("desde") LocalDate desde,
        @Param("hasta") LocalDate hasta
    );

    // Verifica si el contrato tiene al menos una cuota impaga — antes de rescindirlo
    boolean existsByContratoIdAndEstadoIn(UUID contratoId, List<EstadoCuota> estados);

    // -------------------------------------------------------------------------
    // Panel de cuotas por mes — JOIN FETCH garantiza que el Contrato esté cargado
    // cuando el CuotaMapper accede a c.getContrato().getMonedaContrato() etc.
    // -------------------------------------------------------------------------
    @Query("""
        SELECT c FROM Cuota c
        JOIN FETCH c.contrato
        WHERE c.fechaVencimiento BETWEEN :inicio AND :fin
        ORDER BY c.fechaVencimiento ASC, c.contrato.numeroContrato ASC
        """)
    List<Cuota> findByFechaVencimientoBetweenWithContrato(
        @Param("inicio") LocalDate inicio,
        @Param("fin")    LocalDate fin
    );
}
