package com.loboalquileres.service.impl;

import com.loboalquileres.dto.request.InmuebleRequest;
import com.loboalquileres.dto.response.InmuebleResponse;
import com.loboalquileres.entity.Inmueble;
import com.loboalquileres.entity.Persona;
import com.loboalquileres.enums.EstadoInmueble;
import com.loboalquileres.enums.Moneda;
import com.loboalquileres.enums.RolPersona;
import com.loboalquileres.exception.BusinessRuleException;
import com.loboalquileres.exception.ResourceNotFoundException;
import com.loboalquileres.mapper.InmuebleMapper;
import com.loboalquileres.repository.InmuebleRepository;
import com.loboalquileres.repository.PersonaRepository;
import com.loboalquileres.service.InmuebleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InmuebleServiceImpl implements InmuebleService {

    private final InmuebleRepository inmuebleRepository;
    private final PersonaRepository personaRepository;

    @Override
    @Transactional
    public InmuebleResponse crear(InmuebleRequest request) {
        Persona dueno = personaRepository.findById(request.duenoId())
            .orElseThrow(() -> new ResourceNotFoundException("Persona (Dueño)", request.duenoId()));

        // Regla de negocio: solo se puede registrar un inmueble a nombre de un Dueño
        if (!dueno.tieneRol(RolPersona.DUENO)) {
            throw new BusinessRuleException(
                "La persona '" + dueno.getNombreCompleto()
                + "' no tiene el rol DUEÑO. Asignale el rol desde su perfil primero."
            );
        }

        Inmueble inmueble = Inmueble.builder()
            .dueno(dueno)
            .tipo(request.tipo())
            .estado(EstadoInmueble.DISPONIBLE)
            .calle(request.calle())
            .numeroPuerta(request.numeroPuerta())
            .piso(request.piso())
            .departamentoUnidad(request.departamentoUnidad())
            .ciudad(request.ciudad())
            .provincia(request.provincia())
            .codigoPostal(request.codigoPostal())
            .superficieCubierta(request.superficieCubierta())
            .superficieTotal(request.superficieTotal())
            .ambientes(request.ambientes())
            .dormitorios(request.dormitorios())
            .banos(request.banos())
            .antiguedadAnios(request.antiguedadAnios())
            .tieneCochera(request.tieneCochera())
            .tieneBaulera(request.tieneBaulera())
            .tieneAmenities(request.tieneAmenities())
            .valorTasacion(request.valorTasacion())
            .monedaTasacion(request.monedaTasacion() != null ? request.monedaTasacion() : Moneda.USD)
            .nroPartida(request.nroPartida())
            .porcentajeGasto(request.porcentajeGasto())
            .descripcion(request.descripcion())
            .observaciones(request.observaciones())
            .activo(true)
            .build();

        return InmuebleMapper.toResponse(inmuebleRepository.save(inmueble));
    }

    @Override
    @Transactional
    public InmuebleResponse actualizar(UUID id, InmuebleRequest request) {
        Inmueble inmueble = buscarEntidadPorId(id);

        // Si el dueño cambia, validar el nuevo dueño
        if (!inmueble.getDueno().getId().equals(request.duenoId())) {
            Persona nuevoDueno = personaRepository.findById(request.duenoId())
                .orElseThrow(() -> new ResourceNotFoundException("Persona (Dueño)", request.duenoId()));
            if (!nuevoDueno.tieneRol(RolPersona.DUENO)) {
                throw new BusinessRuleException(
                    "La persona '" + nuevoDueno.getNombreCompleto() + "' no tiene el rol DUEÑO."
                );
            }
            inmueble.setDueno(nuevoDueno);
        }

        inmueble.setTipo(request.tipo());
        inmueble.setCalle(request.calle());
        inmueble.setNumeroPuerta(request.numeroPuerta());
        inmueble.setPiso(request.piso());
        inmueble.setDepartamentoUnidad(request.departamentoUnidad());
        inmueble.setCiudad(request.ciudad());
        inmueble.setProvincia(request.provincia());
        inmueble.setCodigoPostal(request.codigoPostal());
        inmueble.setSuperficieCubierta(request.superficieCubierta());
        inmueble.setSuperficieTotal(request.superficieTotal());
        inmueble.setAmbientes(request.ambientes());
        inmueble.setDormitorios(request.dormitorios());
        inmueble.setBanos(request.banos());
        inmueble.setAntiguedadAnios(request.antiguedadAnios());
        inmueble.setTieneCochera(request.tieneCochera());
        inmueble.setTieneBaulera(request.tieneBaulera());
        inmueble.setTieneAmenities(request.tieneAmenities());
        inmueble.setValorTasacion(request.valorTasacion());
        inmueble.setMonedaTasacion(request.monedaTasacion() != null ? request.monedaTasacion() : Moneda.USD);
        inmueble.setNroPartida(request.nroPartida());
        inmueble.setPorcentajeGasto(request.porcentajeGasto());
        inmueble.setDescripcion(request.descripcion());
        inmueble.setObservaciones(request.observaciones());

        return InmuebleMapper.toResponse(inmuebleRepository.save(inmueble));
    }

    @Override
    @Transactional(readOnly = true)
    public InmuebleResponse buscarPorId(UUID id) {
        return InmuebleMapper.toResponse(buscarEntidadPorId(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<InmuebleResponse> listarActivos() {
        return inmuebleRepository.findAll().stream()
            .filter(Inmueble::isActivo)
            .map(InmuebleMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InmuebleResponse> listarPorDueno(UUID duenoId) {
        return inmuebleRepository.findByDuenoIdAndActivoTrue(duenoId).stream()
            .map(InmuebleMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InmuebleResponse> listarPorEstado(EstadoInmueble estado) {
        return inmuebleRepository.findByEstadoAndActivoTrue(estado).stream()
            .map(InmuebleMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InmuebleResponse> buscarPorDireccion(String texto) {
        return inmuebleRepository.buscarPorDireccion(texto).stream()
            .map(InmuebleMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional
    public void desactivar(UUID id) {
        Inmueble inmueble = buscarEntidadPorId(id);
        if (inmuebleRepository.tieneContratoActivo(id)) {
            throw new BusinessRuleException(
                "No se puede desactivar el inmueble '" + inmueble.getDireccionCompleta()
                + "' porque tiene un contrato activo."
            );
        }
        inmueble.setActivo(false);
        inmuebleRepository.save(inmueble);
    }

    private Inmueble buscarEntidadPorId(UUID id) {
        return inmuebleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Inmueble", id));
    }
}
