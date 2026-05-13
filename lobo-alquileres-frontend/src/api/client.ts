import axios from "axios";
import { useAuthStore } from "@/store/authStore";

/**
 * Instancia central de Axios para todos los llamados al backend.
 *
 * - baseURL apunta al Spring Boot local (puerto 8080).
 * - Interceptor de REQUEST: adjunta "Authorization: Bearer <token>" si existe.
 * - Interceptor de RESPONSE: si recibe 401 con sesión activa (token expirado),
 *   limpia el store y redirige al login automáticamente.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ── REQUEST: inyectar JWT ─────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // getState() lee Zustand sin crear suscripción — seguro en un interceptor
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE: manejar token expirado ─────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Solo redirigir si ya había sesión (token expirado en mid-session).
      // Si el token es null, estamos en el endpoint de login → no redirigir.
      if (useAuthStore.getState().token) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
