package com.loboalquileres.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.Map;
import java.util.stream.Collectors;

// @RestControllerAdvice intercepta excepciones de todos los controllers.
// Usamos ProblemDetail (RFC 9457) — el estándar moderno para errores HTTP en APIs REST.
// Spring Boot 3+ lo soporta nativamente sin dependencias extra.
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setType(URI.create("/errors/not-found"));
        pd.setTitle("Recurso no encontrado");
        return pd;
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ProblemDetail handleBusinessRule(BusinessRuleException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        pd.setType(URI.create("/errors/business-rule"));
        pd.setTitle("Regla de negocio violada");
        return pd;
    }

    @ExceptionHandler(ContratoConflictException.class)
    public ProblemDetail handleContratoConflict(ContratoConflictException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        pd.setType(URI.create("/errors/contrato-conflict"));
        pd.setTitle("Conflicto de contratos");
        return pd;
    }

    // Errores de validación de Bean Validation (@NotNull, @Positive, etc.)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errores = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Valor inválido",
                (a, b) -> a  // si hay dos errores en el mismo campo, quedarse con el primero
            ));

        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST,
            "La solicitud contiene campos inválidos. Revisá el campo 'errores'."
        );
        pd.setType(URI.create("/errors/validation"));
        pd.setTitle("Error de validación");
        pd.setProperty("errores", errores);
        return pd;
    }

    // Credenciales incorrectas o usuario inexistente al intentar login
    // (BadCredentialsException, UsernameNotFoundException, etc. son AuthenticationException)
    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthentication(AuthenticationException ex) {
        // Intencionalmente genérico: no revelar si el usuario existe o no
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
            HttpStatus.UNAUTHORIZED,
            "Credenciales incorrectas. Verificá usuario y contraseña."
        );
        pd.setType(URI.create("/errors/unauthorized"));
        pd.setTitle("No autorizado");
        return pd;
    }

    // Rol insuficiente para acceder al recurso (@PreAuthorize falló)
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
            HttpStatus.FORBIDDEN,
            "No tenés permiso para realizar esta acción."
        );
        pd.setType(URI.create("/errors/forbidden"));
        pd.setTitle("Acceso denegado");
        return pd;
    }

    // Captura genérica — nunca expone stacktrace al cliente
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        log.error("Error inesperado: {}", ex.getMessage(), ex);
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Ocurrió un error inesperado. Por favor, contactá al soporte."
        );
        pd.setType(URI.create("/errors/internal"));
        pd.setTitle("Error interno del servidor");
        return pd;
    }
}
