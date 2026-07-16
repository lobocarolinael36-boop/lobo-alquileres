package com.loboalquileres.repository;

import com.loboalquileres.entity.PagoSuscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PagoSuscripcionRepository extends JpaRepository<PagoSuscripcion, UUID> {

    List<PagoSuscripcion> findByTenantIdOrderByMesPagoDesc(UUID tenantId);

    boolean existsByTenantIdAndMesPago(UUID tenantId, String mesPago);

    Optional<PagoSuscripcion> findByTenantIdAndMesPago(UUID tenantId, String mesPago);
}
