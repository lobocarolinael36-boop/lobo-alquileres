package com.loboalquileres.multitenancy;

/**
 * Almacena el schema del tenant activo para el hilo de ejecución actual.
 * Se setea en JwtAuthenticationFilter y se limpia al finalizar el request.
 *
 * NULL = superadmin o contexto público (schema "public").
 */
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT_SCHEMA = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(String schema) {
        CURRENT_SCHEMA.set(schema);
    }

    public static String get() {
        return CURRENT_SCHEMA.get();
    }

    public static void clear() {
        CURRENT_SCHEMA.remove();
    }
}
