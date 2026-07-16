import apiClient from "./client";

const BASE       = "/api/v1/admin/tenants";
const PERFIL_URL = "/api/v1/perfil";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface TenantResponse {
  id: string;
  nombre: string;
  slug: string;
  schemaName: string;
  email: string | null;
  activo: boolean;
  plan: string;
  fechaVencimiento: string | null;
  adminUsername: string;
  observaciones: string | null;
  // Datos de contacto para encabezado de recibos
  telefono: string | null;
  domicilio: string | null;
  cuit: string | null;
  website: string | null;
  createdAt: string;
  // Pagos de suscripción
  pagaMesActual: boolean;
  fechaUltimoPago: string | null;
}

export interface PagoSuscripcionResponse {
  id: string;
  mesPago: string;
  monto: number;
  metodo: string | null;
  fechaPago: string;
  observaciones: string | null;
  createdAt: string;
  tipoPago: "MENSUAL" | "ANUAL";
  grupoId: string | null;
}

export interface PagoSuscripcionRequest {
  mesPago?: string;
  tipoPago?: "MENSUAL" | "ANUAL";
  monto: number;
  metodo?: string;
  fechaPago?: string;
  observaciones?: string;
}

export interface TenantRequest {
  nombre: string;
  slug: string;
  email?: string;
  adminUsername: string;
  adminPassword: string;
  plan: string;
  fechaVencimiento?: string;
  observaciones?: string;
  // Datos de contacto (opcionales)
  telefono?: string;
  domicilio?: string;
  cuit?: string;
  website?: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const tenantsApi = {
  listar: (): Promise<TenantResponse[]> =>
    apiClient.get<TenantResponse[]>(BASE).then((r) => r.data),

  crear: (req: TenantRequest): Promise<TenantResponse> =>
    apiClient.post<TenantResponse>(BASE, req).then((r) => r.data),

  toggleActivo: (id: string): Promise<TenantResponse> =>
    apiClient.patch<TenantResponse>(`${BASE}/${id}/toggle-activo`).then((r) => r.data),

  cambiarPassword: (id: string, nuevaPassword: string): Promise<void> =>
    apiClient.patch(`${BASE}/${id}/password`, { nuevaPassword }).then(() => {}),

  eliminar: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`).then(() => {}),

  listarPagos: (id: string): Promise<PagoSuscripcionResponse[]> =>
    apiClient.get<PagoSuscripcionResponse[]>(`${BASE}/${id}/pagos`).then((r) => r.data),

  registrarPago: (id: string, req: PagoSuscripcionRequest): Promise<PagoSuscripcionResponse> =>
    apiClient.post<PagoSuscripcionResponse>(`${BASE}/${id}/pagos`, req).then((r) => r.data),

  eliminarPago: (id: string, pagoId: string): Promise<void> =>
    apiClient.delete(`${BASE}/${id}/pagos/${pagoId}`).then(() => {}),

  /** GET /api/v1/perfil — datos de la inmobiliaria activa (para encabezado de recibos) */
  getPerfil: (): Promise<TenantResponse> =>
    apiClient.get<TenantResponse>(PERFIL_URL).then((r) => r.data),
};
