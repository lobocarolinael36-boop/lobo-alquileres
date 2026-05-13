package com.loboalquileres.exception;

// Se lanza cuando una operación viola una regla de negocio del dominio.
// Ejemplos: inquilino sin rol INQUILINO, fecha_fin antes que fecha_inicio.
// El GlobalExceptionHandler la mapea a HTTP 422 Unprocessable Entity.
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String mensaje) {
        super(mensaje);
    }
}
