import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Forma del estado ──────────────────────────────────────────────────────────

interface AuthState {
  token: string | null;
  username: string | null;
  rol: string | null;
  tenantSchema: string | null;
  isAuthenticated: boolean;

  // Acciones
  login: (token: string, username: string, rol: string, tenantSchema?: string | null) => void;
  logout: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

/**
 * Store de autenticación con persistencia en localStorage.
 *
 * - `persist` guarda automáticamente el estado bajo la key "lobo-auth".
 * - Al recargar la página, Zustand rehidrata el token y el usuario.
 * - `getState()` es consumido por el interceptor de Axios (sin suscripción).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      rol: null,
      tenantSchema: null,
      isAuthenticated: false,

      login: (token, username, rol, tenantSchema = null) =>
        set({ token, username, rol, tenantSchema: tenantSchema ?? null, isAuthenticated: true }),

      logout: () =>
        set({ token: null, username: null, rol: null, tenantSchema: null, isAuthenticated: false }),
    }),
    {
      name: "lobo-auth", // key en localStorage
    }
  )
);
