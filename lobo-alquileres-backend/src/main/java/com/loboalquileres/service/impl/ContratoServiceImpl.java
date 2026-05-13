package com.loboalquileres.service.impl;

import com.loboalquileres.dto.request.ContratoRequest;
import com.loboalquileres.dto.response.ContratoResponse;
import com.loboalquileres.dto.response.CuotaResponse;
import com.loboalquileres.entity.Contrato;
import com.loboalquileres.entity.Cuota;
import com.loboalquileres.entity.Inmueble;
import com.loboalquileres.entity.Persona;
import com.loboalquileres.enums.*;
import com.loboalquileres.exception.BusinessRuleException;
import com.loboalquileres.exception.ContratoConflictException;
import com.loboalquileres.exception.ResourceNotFoundException;
import com.loboalquileres.mapper.ContratoMapper;
import com.loboalquileres.mapper.CuotaMapper;
import com.loboalquileres.repository.ContratoRepository;
import com.loboalquileres.service.EmailService;
import com.loboalquileres.repository.CuotaRepository;
import com.loboalquileres.repository.InmuebleRepository;
import com.loboalquileres.repository.PersonaRepository;
import com.loboalquileres.service.ContratoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContratoServiceImpl implements ContratoService {

    private final ContratoRepository contratoRepository;
    private final CuotaRepository cuotaRepository;
    private final InmuebleRepository inmuebleRepository;
    private final PersonaRepository personaRepository;
    private final EmailService emailService;

    // ==========================================================================
    // CREAR CONTRATO — operación más compleja del sistema.
    //
    // Flujo completo en una sola transacción:
    //   1. Validar que las entidades referenciadas existen
    //   2. Validar reglas de negocio (roles, fechas, solapamiento)
    //   3. Persistir el Contrato
    //   4. Generar y persistir todas las Cuotas
    //   5. Actualizar el estado del Inmueble a ALQUILADO
    //
    // @Transactional garantiza que si cualquier paso falla, se hace rollback
    // de toda la operación. El Contrato nunca queda sin cuotas ni el Inmueble
    // marcado como ALQUILADO sin un contrato asociado.
    // ==========================================================================
    @Override
    @Transactional
    public ContratoResponse crear(ContratoRequest request) {

        // -- 1. Resolución de entidades ----------------------------------------
        Inmueble inmueble = inmuebleRepository.findById(request.inmuebleId())
            .orElseThrow(() -> new ResourceNotFoundException("Inmueble", request.inmuebleId()));

        Persona inquilino = personaRepository.findById(request.inquilinoId())
            .orElseThrow(() -> new ResourceNotFoundException("Persona (Inquilino)", request.inquilinoId()));

        Persona garante = request.garanteId() != null
            ? personaRepository.findById(request.garanteId())
                .orElseThrow(() -> new ResourceNotFoundException("Persona (Garante)", request.garanteId()))
            : null;

        Persona martillero = personaRepository.findById(request.martilleroId())
            .orElseThrow(() -> new ResourceNotFoundException("Persona (Martillero)", request.martilleroId()));

        // -- 2. Validaciones de negocio ----------------------------------------
        validarRoles(inquilino, garante, martillero);
        validarFechas(request.fechaInicio(), request.fechaFin());
        validarAjusteFijo(request.tipoAjuste(), request.porcentajeAjusteFijo());
        validarDisponibilidadInmueble(inmueble, request.fechaInicio(), request.fechaFin());

        // -- 3. Construir y persistir el Contrato -------------------------------
        LocalDate proximoAjuste = calcularProximoAjuste(request.fechaInicio(), request.periodicidadAjuste(), request.tipoAjuste());

        Contrato contrato = Contrato.builder()
            .numeroContrato(generarNumeroContrato())
            .inmueble(inmueble)
            .inquilino(inquilino)
            .garante(garante)
            .martillero(martillero)
            .fechaInicio(request.fechaInicio())
            .fechaFin(request.fechaFin())
            .montoAlquilerInicial(request.montoAlquilerInicial())
            .monedaContrato(request.monedaContrato())
            .tipoAjuste(request.tipoAjuste())
            .periodicidadAjuste(request.periodicidadAjuste())
            .porcentajeAjusteFijo(request.porcentajeAjusteFijo())
            .proximoAjusteFecha(proximoAjuste)
            .comisionPorcentaje(request.comisionPorcentaje())
            .depositoMeses(request.depositoMeses())
            .depositoMonto(request.montoAlquilerInicial().multiply(new BigDecimal(request.depositoMeses())))
            .diaVencimientoCuota(request.diaVencimientoCuota())
            .estado(EstadoContrato.ACTIVO)
            .clausulasAdicionales(request.clausulasAdicionales())
            .observaciones(request.observaciones())
            .build();

        contrato = contratoRepository.save(contrato);

        // -- 4. Generar cuotas --------------------------------------------------
        List<Cuota> cuotas = generarCuotas(contrato);
        cuotaRepository.saveAll(cuotas);

        // -- 5. Marcar inmueble como alquilado ----------------------------------
        inmueble.setEstado(EstadoInmueble.ALQUILADO);
        inmuebleRepository.save(inmueble);

        ContratoResponse response = ContratoMapper.toResponse(contrato, cuotas);

        // Notificar al inquilino por email (si tiene email y el servicio está habilitado)
        if (inquilino.getEmail() != null) {
            emailService.enviarContratoCreado(response, inquilino.getEmail());
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public ContratoResponse buscarPorId(UUID id) {
        Contrato contrato = buscarEntidadPorId(id);
        List<Cuota> cuotas = cuotaRepository.findByContratoIdOrderByNumeroCuota(id);
        return ContratoMapper.toResponse(contrato, cuotas);
    }

    @Override
    @Transactional(readOnly = true)
    public ContratoResponse buscarPorNumero(String numeroContrato) {
        Contrato contrato = contratoRepository.findByNumeroContrato(numeroContrato)
            .orElseThrow(() -> new ResourceNotFoundException("Contrato", "número: " + numeroContrato));
        List<Cuota> cuotas = cuotaRepository.findByContratoIdOrderByNumeroCuota(contrato.getId());
        return ContratoMapper.toResponse(contrato, cuotas);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContratoResponse> listarActivos() {
        return contratoRepository.findByEstado(EstadoContrato.ACTIVO).stream()
            .map(c -> ContratoMapper.toResponse(
                c,
                cuotaRepository.findByContratoIdOrderByNumeroCuota(c.getId())
            ))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContratoResponse> listarTodos() {
        return contratoRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(c -> ContratoMapper.toResponse(
                c,
                cuotaRepository.findByContratoIdOrderByNumeroCuota(c.getId())
            ))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContratoResponse> listarPorInmueble(UUID inmuebleId) {
        return contratoRepository.findByInmuebleIdOrderByFechaInicioDesc(inmuebleId).stream()
            .map(c -> ContratoMapper.toResponse(
                c,
                cuotaRepository.findByContratoIdOrderByNumeroCuota(c.getId())
            ))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContratoResponse> listarPorInquilino(UUID inquilinoId) {
        return contratoRepository.findByInquilinoIdOrderByFechaInicioDesc(inquilinoId).stream()
            .map(c -> ContratoMapper.toResponse(
                c,
                cuotaRepository.findByContratoIdOrderByNumeroCuota(c.getId())
            ))
            .toList();
    }

    @Override
    @Transactional
    public ContratoResponse rescindir(UUID id, String observaciones) {
        Contrato contrato = buscarEntidadPorId(id);

        if (!contrato.estaActivo()) {
            throw new BusinessRuleException(
                "El contrato " + contrato.getNumeroContrato() + " no está activo. Estado actual: " + contrato.getEstado()
            );
        }

        // Verificar si tiene cuotas impagas — decisión de negocio: no bloquear,
        // pero podría agregarse este check si el cliente lo requiere.
        contrato.setEstado(EstadoContrato.RESCINDIDO);
        if (observaciones != null) {
            contrato.setObservaciones(observaciones);
        }
        contratoRepository.save(contrato);

        // Liberar el inmueble
        contrato.getInmueble().setEstado(EstadoInmueble.DISPONIBLE);
        inmuebleRepository.save(contrato.getInmueble());

        List<Cuota> cuotas = cuotaRepository.findByContratoIdOrderByNumeroCuota(id);
        return ContratoMapper.toResponse(contrato, cuotas);
    }

    @Override
    @Transactional
    public ContratoResponse devolver(UUID id) {
        Contrato contrato = buscarEntidadPorId(id);

        if (contrato.isDepositoDevuelto()) {
            throw new BusinessRuleException(
                "El depósito del contrato " + contrato.getNumeroContrato() + " ya fue devuelto."
            );
        }

        contrato.setDepositoDevuelto(true);
        contrato.setDepositoFechaDevolucion(LocalDate.now());
        contratoRepository.save(contrato);

        List<Cuota> cuotas = cuotaRepository.findByContratoIdOrderByNumeroCuota(id);
        return ContratoMapper.toResponse(contrato, cuotas);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContratoResponse> buscarConAjustePendiente(LocalDate hasta) {
        return contratoRepository.findConAjustePendienteHasta(hasta).stream()
            .map(c -> ContratoMapper.toResponse(
                c,
                cuotaRepository.findByContratoIdOrderByNumeroCuota(c.getId())
            ))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CuotaResponse> listarCuotas(UUID contratoId) {
        buscarEntidadPorId(contratoId); // verifica que el contrato existe
        return cuotaRepository.findByContratoIdOrderByNumeroCuota(contratoId).stream()
            .map(CuotaMapper::toResponse)
            .toList();
    }

    // ==========================================================================
    // MÉTODOS PRIVADOS — lógica de negocio interna
    // ==========================================================================

    /**
     * Genera el número de contrato correlativo anual.
     * Formato: CTR-{AÑO}-{SECUENCIA_4_DÍGITOS}  →  CTR-2025-0001
     *
     * Nota: hay una condición de carrera teórica si dos contratos se crean
     * exactamente al mismo tiempo. En un sistema de uso concurrente bajo (una
     * sola inmobiliaria) no es un problema. Si escala, reemplazar por una
     * SEQUENCE de PostgreSQL.
     */
    private String generarNumeroContrato() {
        int anio = Year.now().getValue();
        long siguiente = contratoRepository.contarPorAnio(anio) + 1;
        return String.format("CTR-%d-%04d", anio, siguiente);
    }

    /**
     * Genera una Cuota por cada mes del período del contrato.
     *
     * Iteración: avanza de mes en mes desde el primer día de fechaInicio
     * hasta el primer día del último mes (fechaFin).
     * El día de vencimiento se ajusta al último día del mes si es menor
     * (ej: vence el 31 en febrero → vence el 28/29).
     */
    private List<Cuota> generarCuotas(Contrato contrato) {
        List<Cuota> cuotas = new ArrayList<>();

        // Normalizamos a primer día del mes para la iteración
        LocalDate periodoActual = contrato.getFechaInicio().withDayOfMonth(1);
        LocalDate periodoFin    = contrato.getFechaFin().withDayOfMonth(1);
        int numeroCuota = 1;

        while (!periodoActual.isAfter(periodoFin)) {
            // Ajustar el día de vencimiento al límite del mes
            int diaEfectivo = Math.min(
                contrato.getDiaVencimientoCuota(),
                periodoActual.lengthOfMonth()
            );
            LocalDate fechaVencimiento = periodoActual.withDayOfMonth(diaEfectivo);

            BigDecimal montoBase  = contrato.getMontoAlquilerInicial();
            BigDecimal montoAjuste = BigDecimal.ZERO;
            BigDecimal montoTotal  = montoBase;  // sin ajuste inicial
            BigDecimal comision    = contrato.calcularComisionSobre(montoTotal);

            cuotas.add(Cuota.builder()
                .contrato(contrato)
                .numeroCuota(numeroCuota)
                .fechaVencimiento(fechaVencimiento)
                .montoBase(montoBase)
                .montoAjuste(montoAjuste)
                .montoTotal(montoTotal)
                .estado(EstadoCuota.PENDIENTE)
                .comisionMonto(comision)
                .comisionPagada(false)
                .build()
            );

            numeroCuota++;
            periodoActual = periodoActual.plusMonths(1);
        }

        return cuotas;
    }

    /**
     * Calcula la fecha del próximo ajuste por inflación.
     * Si el tipo de ajuste es NINGUNO, retorna null (sin ajuste programado).
     */
    private LocalDate calcularProximoAjuste(
            LocalDate fechaInicio,
            PeriodicidadAjuste periodicidad,
            TipoAjuste tipoAjuste) {

        if (tipoAjuste == TipoAjuste.NINGUNO) {
            return null;
        }

        return switch (periodicidad) {
            case MENSUAL       -> fechaInicio.plusMonths(1);
            case TRIMESTRAL    -> fechaInicio.plusMonths(3);
            case CUATRIMESTRAL -> fechaInicio.plusMonths(4);
            case SEMESTRAL     -> fechaInicio.plusMonths(6);
            case ANUAL         -> fechaInicio.plusMonths(12);
        };
    }

    // -- Validaciones ----------------------------------------------------------

    private void validarRoles(Persona inquilino, Persona garante, Persona martillero) {
        if (!inquilino.tieneRol(RolPersona.INQUILINO)) {
            throw new BusinessRuleException(
                "'" + inquilino.getNombreCompleto() + "' no tiene el rol INQUILINO. Asignalo desde su perfil."
            );
        }
        if (!martillero.tieneRol(RolPersona.MARTILLERO)) {
            throw new BusinessRuleException(
                "'" + martillero.getNombreCompleto() + "' no tiene el rol MARTILLERO. Asignalo desde su perfil."
            );
        }
        if (garante != null && !garante.tieneRol(RolPersona.GARANTE)) {
            throw new BusinessRuleException(
                "'" + garante.getNombreCompleto() + "' no tiene el rol GARANTE. Asignalo desde su perfil."
            );
        }
    }

    private void validarFechas(LocalDate inicio, LocalDate fin) {
        if (!fin.isAfter(inicio)) {
            throw new BusinessRuleException(
                "La fecha de fin (" + fin + ") debe ser posterior a la fecha de inicio (" + inicio + ")."
            );
        }
        // Nota: no se restringe la fecha de inicio para permitir el ingreso de contratos
        // históricos ya vigentes al momento de implementar el sistema.
    }

    private void validarAjusteFijo(TipoAjuste tipo, BigDecimal porcentaje) {
        if (tipo == TipoAjuste.FIJO_PORCENTAJE && porcentaje == null) {
            throw new BusinessRuleException(
                "Cuando el tipo de ajuste es FIJO_PORCENTAJE, el porcentaje de ajuste es obligatorio."
            );
        }
    }

    private void validarDisponibilidadInmueble(Inmueble inmueble, LocalDate inicio, LocalDate fin) {
        if (!inmueble.isActivo()) {
            throw new BusinessRuleException(
                "El inmueble '" + inmueble.getDireccionCompleta() + "' está inactivo."
            );
        }
        if (contratoRepository.existeContratoActivoSolapado(inmueble.getId(), inicio, fin)) {
            throw new ContratoConflictException(inmueble.getDireccionCompleta(), inicio, fin);
        }
    }

    private Contrato buscarEntidadPorId(UUID id) {
        return contratoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Contrato", id));
    }
}
