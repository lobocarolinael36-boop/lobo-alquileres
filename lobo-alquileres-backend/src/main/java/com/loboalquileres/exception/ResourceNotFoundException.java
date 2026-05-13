package com.loboalquileres.exception;

import java.util.UUID;

// Extiende RuntimeException para que Spring gestione el rollback automático
// y no sea necesario declararla en la firma del método (checked exceptions).
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String recurso, UUID id) {
        super(recurso + " no encontrado/a con ID: " + id);
    }

    public ResourceNotFoundException(String recurso, String criterio) {
        super(recurso + " no encontrado/a: " + criterio);
    }
}
