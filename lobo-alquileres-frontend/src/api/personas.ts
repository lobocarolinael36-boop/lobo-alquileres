import apiClient from "./client";
import type { PersonaRequest, PersonaResponse, RolPersona } from "@/types";

const BASE = "/api/v1/personas";

export const personasApi = {
  /** GET /api/v1/personas — todos los activos */
  listarActivas: (): Promise<PersonaResponse[]> =>
    apiClient.get<PersonaResponse[]>(BASE).then((r) => r.data),

  /** GET /api/v1/personas/:id */
  buscarPorId: (id: string): Promise<PersonaResponse> =>
    apiClient.get<PersonaResponse>(`${BASE}/${id}`).then((r) => r.data),

  /** GET /api/v1/personas/buscar?q=... — autocomplete por nombre/apellido */
  buscar: (q: string): Promise<PersonaResponse[]> =>
    apiClient.get<PersonaResponse[]>(`${BASE}/buscar`, { params: { q } }).then((r) => r.data),

  /** GET /api/v1/personas/por-rol/:rol — dueños, inquilinos, etc. */
  porRol: (rol: RolPersona): Promise<PersonaResponse[]> =>
    apiClient.get<PersonaResponse[]>(`${BASE}/por-rol/${rol}`).then((r) => r.data),

  /** POST /api/v1/personas — requiere ADMIN o MARTILLERO */
  crear: (request: PersonaRequest): Promise<PersonaResponse> =>
    apiClient.post<PersonaResponse>(BASE, request).then((r) => r.data),

  /** PUT /api/v1/personas/:id — requiere ADMIN o MARTILLERO */
  actualizar: (id: string, request: PersonaRequest): Promise<PersonaResponse> =>
    apiClient.put<PersonaResponse>(`${BASE}/${id}`, request).then((r) => r.data),

  /** DELETE /api/v1/personas/:id — soft delete, requiere ADMIN */
  desactivar: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`).then(() => undefined),
};
