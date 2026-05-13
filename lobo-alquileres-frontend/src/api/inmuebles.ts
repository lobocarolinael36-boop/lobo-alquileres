import apiClient from "./client";
import type { EstadoInmueble, InmuebleRequest, InmuebleResponse } from "@/types";

const BASE = "/api/v1/inmuebles";

export const inmuebleApi = {
  /** GET /api/v1/inmuebles — todos los activos */
  listarActivos: (): Promise<InmuebleResponse[]> =>
    apiClient.get<InmuebleResponse[]>(BASE).then((r) => r.data),

  /** GET /api/v1/inmuebles/:id */
  buscarPorId: (id: string): Promise<InmuebleResponse> =>
    apiClient.get<InmuebleResponse>(`${BASE}/${id}`).then((r) => r.data),

  /** GET /api/v1/inmuebles/buscar?q=... — autocomplete de dirección */
  buscar: (q: string): Promise<InmuebleResponse[]> =>
    apiClient.get<InmuebleResponse[]>(`${BASE}/buscar`, { params: { q } }).then((r) => r.data),

  /** GET /api/v1/inmuebles/por-estado/:estado */
  porEstado: (estado: EstadoInmueble): Promise<InmuebleResponse[]> =>
    apiClient.get<InmuebleResponse[]>(`${BASE}/por-estado/${estado}`).then((r) => r.data),

  /** GET /api/v1/inmuebles/por-dueno/:duenoId */
  porDueno: (duenoId: string): Promise<InmuebleResponse[]> =>
    apiClient.get<InmuebleResponse[]>(`${BASE}/por-dueno/${duenoId}`).then((r) => r.data),

  /** POST /api/v1/inmuebles — requiere ADMIN o MARTILLERO */
  crear: (request: InmuebleRequest): Promise<InmuebleResponse> =>
    apiClient.post<InmuebleResponse>(BASE, request).then((r) => r.data),

  /** PUT /api/v1/inmuebles/:id — requiere ADMIN o MARTILLERO */
  actualizar: (id: string, request: InmuebleRequest): Promise<InmuebleResponse> =>
    apiClient.put<InmuebleResponse>(`${BASE}/${id}`, request).then((r) => r.data),

  /** DELETE /api/v1/inmuebles/:id — soft delete, requiere ADMIN */
  desactivar: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`).then(() => undefined),
};
