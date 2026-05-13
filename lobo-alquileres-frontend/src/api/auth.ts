import apiClient from "./client";

// ── Tipos que mapean el contrato del backend ──────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  username: string;
  rol: string;                  // "SUPERADMIN" | "ADMIN" | "MARTILLERO" | "AGENTE"
  tenantSchema: string | null;  // null para SUPERADMIN
}

// ── Llamadas al endpoint de autenticación ─────────────────────────────────────

export const authApi = {
  /**
   * POST /api/v1/auth/login
   * Devuelve el JWT y los datos del usuario para guardar en el store.
   */
  login: (credentials: LoginRequest) =>
    apiClient
      .post<LoginResponse>("/api/v1/auth/login", credentials)
      .then((res) => res.data),
};
