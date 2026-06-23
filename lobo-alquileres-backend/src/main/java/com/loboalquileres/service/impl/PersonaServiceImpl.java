package com.loboalquileres.service.impl;

import com.loboalquileres.dto.request.PersonaRequest;
import com.loboalquileres.dto.response.PersonaResponse;
import com.loboalquileres.entity.Persona;
import com.loboalquileres.enums.RolPersona;
import com.loboalquileres.exception.BusinessRuleException;
import com.loboalquileres.exception.ResourceNotFoundException;
import com.loboalquileres.mapper.PersonaMapper;
import com.loboalquileres.repository.PersonaRepository;
import com.loboalquileres.service.PersonaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PersonaServiceImpl implements PersonaService {

    private final PersonaRepository personaRepository;

    @Override
    @Transactional
    public PersonaResponse crear(PersonaRequest request) {
        // Regla de negocio: no puede existir otra persona con el mismo documento
        if (personaRepository.existsByTipoDocumentoAndNumeroDocumento(
                request.tipoDocumento(), request.numeroDocumento())) {
            throw new BusinessRuleException(
                "Ya existe una persona registrada con " + request.tipoDocumento()
                + " Nro. " + request.numeroDocumento() + "."
            );
        }

        Persona persona = Persona.builder()
            .tipoDocumento(request.tipoDocumento())
            .numeroDocumento(request.numeroDocumento())
            .nombre(request.nombre())
            .apellido(request.apellido())
            .cuil(request.cuil())
            .email(request.email())
            .telefonoPrincipal(request.telefonoPrincipal())
            .telefonoAlternativo(request.telefonoAlternativo())
            .calle(request.calle())
            .numeroPuerta(request.numeroPuerta())
            .piso(request.piso())
            .departamentoUnidad(request.departamentoUnidad())
            .ciudad(request.ciudad())
            .provincia(request.provincia() != null ? request.provincia() : "Buenos Aires")
            .codigoPostal(request.codigoPostal())
            .fechaNacimiento(request.fechaNacimiento())
            .observaciones(request.observaciones())
            .activo(true)
            .roles(new HashSet<>(request.roles()))
            .build();

        return PersonaMapper.toResponse(personaRepository.save(persona));
    }

    @Override
    @Transactional
    public PersonaResponse actualizar(UUID id, PersonaRequest request) {
        Persona persona = buscarEntidadPorId(id);

        // Si el documento cambia, verificar que no colisione con otra persona
        boolean documentoCambio = !persona.getTipoDocumento().equals(request.tipoDocumento())
            || !persona.getNumeroDocumento().equals(request.numeroDocumento());

        if (documentoCambio && personaRepository.existsByTipoDocumentoAndNumeroDocumento(
                request.tipoDocumento(), request.numeroDocumento())) {
            throw new BusinessRuleException(
                "El documento " + request.tipoDocumento() + " " + request.numeroDocumento()
                + " ya pertenece a otra persona registrada."
            );
        }

        persona.setTipoDocumento(request.tipoDocumento());
        persona.setNumeroDocumento(request.numeroDocumento());
        persona.setNombre(request.nombre());
        persona.setApellido(request.apellido());
        persona.setCuil(request.cuil());
        persona.setEmail(request.email());
        persona.setTelefonoPrincipal(request.telefonoPrincipal());
        persona.setTelefonoAlternativo(request.telefonoAlternativo());
        persona.setCalle(request.calle());
        persona.setNumeroPuerta(request.numeroPuerta());
        persona.setPiso(request.piso());
        persona.setDepartamentoUnidad(request.departamentoUnidad());
        persona.setCiudad(request.ciudad());
        persona.setProvincia(request.provincia());
        persona.setCodigoPostal(request.codigoPostal());
        persona.setFechaNacimiento(request.fechaNacimiento());
        persona.setObservaciones(request.observaciones());
        persona.getRoles().clear();
        persona.getRoles().addAll(request.roles());

        return PersonaMapper.toResponse(personaRepository.save(persona));
    }

    @Override
    @Transactional(readOnly = true)
    public PersonaResponse buscarPorId(UUID id) {
        return PersonaMapper.toResponse(buscarEntidadPorId(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PersonaResponse> listarActivas() {
        return personaRepository.findByActivoTrue().stream()
            .map(PersonaMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PersonaResponse> buscarPorRol(RolPersona rol) {
        return personaRepository.findActivasByRol(rol).stream()
            .map(PersonaMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PersonaResponse> buscarPorNombre(String texto) {
        return personaRepository
            .findByActivoTrueAndNombreContainingIgnoreCaseOrActivoTrueAndApellidoContainingIgnoreCase(texto, texto)
            .stream()
            .map(PersonaMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional
    public void desactivar(UUID id) {
        Persona persona = buscarEntidadPorId(id);
        persona.setActivo(false);
        personaRepository.save(persona);
    }

    // Método interno reutilizable — no forma parte de la interfaz pública del servicio
    private Persona buscarEntidadPorId(UUID id) {
        return personaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Persona", id));
    }
}
