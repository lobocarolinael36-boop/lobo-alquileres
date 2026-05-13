package com.loboalquileres.exception;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

// Excepción especializada para el caso de contratos solapados en el mismo inmueble.
// Separada de BusinessRuleException para que el frontend pueda distinguirla
// y mostrar un mensaje de error específico con el detalle del conflicto.
public class ContratoConflictException extends RuntimeException {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public ContratoConflictException(String direccionInmueble, LocalDate fechaInicio, LocalDate fechaFin) {
        super(String.format(
            "El inmueble '%s' ya tiene un contrato activo que se solapa con el período %s - %s.",
            direccionInmueble,
            fechaInicio.format(FMT),
            fechaFin.format(FMT)
        ));
    }
}
