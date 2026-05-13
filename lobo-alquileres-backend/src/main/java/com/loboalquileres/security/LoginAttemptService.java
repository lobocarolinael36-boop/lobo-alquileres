package com.loboalquileres.security;

import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Protección básica contra ataques de fuerza bruta en el endpoint de login.
 *
 * Reglas:
 *  - Después de 5 intentos fallidos el usuario queda bloqueado 15 minutos.
 *  - Un login exitoso reinicia el contador.
 *  - El bloqueo es por username (no por IP, para evitar bloqueos colaterales).
 */
@Service
public class LoginAttemptService {

    private static final int  MAX_INTENTOS  = 5;
    private static final long BLOQUEO_MS    = 15L * 60 * 1_000; // 15 minutos

    private final ConcurrentHashMap<String, Intento> intentos = new ConcurrentHashMap<>();

    public void loginExitoso(String username) {
        intentos.remove(username);
    }

    public void loginFallido(String username) {
        intentos.merge(username, new Intento(), (existing, nuevo) -> {
            existing.incrementar();
            return existing;
        });
    }

    public boolean estaBloqueado(String username) {
        Intento intento = intentos.get(username);
        if (intento == null) return false;
        if (intento.getCantidad() < MAX_INTENTOS) return false;
        // Si ya pasó el tiempo de bloqueo, limpiar y dejar intentar de nuevo
        if (System.currentTimeMillis() - intento.getUltimoIntento() > BLOQUEO_MS) {
            intentos.remove(username);
            return false;
        }
        return true;
    }

    public int intentosRestantes(String username) {
        Intento intento = intentos.get(username);
        if (intento == null) return MAX_INTENTOS;
        return Math.max(0, MAX_INTENTOS - intento.getCantidad());
    }

    // ── Inner class ───────────────────────────────────────────────────────────

    private static class Intento {
        private int cantidad = 1;
        private long ultimoIntento = System.currentTimeMillis();

        void incrementar() {
            cantidad++;
            ultimoIntento = System.currentTimeMillis();
        }

        int getCantidad()      { return cantidad; }
        long getUltimoIntento(){ return ultimoIntento; }
    }
}
