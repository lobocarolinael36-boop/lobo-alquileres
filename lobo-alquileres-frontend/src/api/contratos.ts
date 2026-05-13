import apiClient from "./client";
import type { ContratoRequest, ContratoResponse } from "@/types";

const BASE = "/api/v1/contratos";

export const contratosApi = {
  /** GET /api/v1/contratos/todos — todos los contratos, todos los estados */
  listar: (): Promise<ContratoResponse[]> =>
    apiClient.get<ContratoResponse[]>(`${BASE}/todos`).then((r) => r.data),

  /** GET /api/v1/contratos/:id */
  buscarPorId: (id: string): Promise<ContratoResponse> =>
    apiClient.get<ContratoResponse>(`${BASE}/${id}`).then((r) => r.data),

  /** GET /api/v1/contratos/por-inmueble/:inmuebleId */
  porInmueble: (inmuebleId: string): Promise<ContratoResponse[]> =>
    apiClient.get<ContratoResponse[]>(`${BASE}/por-inmueble/${inmuebleId}`).then((r) => r.data),

  /** GET /api/v1/contratos/por-inquilino/:inquilinoId */
  porInquilino: (inquilinoId: string): Promise<ContratoResponse[]> =>
    apiClient.get<ContratoResponse[]>(`${BASE}/por-inquilino/${inquilinoId}`).then((r) => r.data),

  /** POST /api/v1/contratos — genera automáticamente las cuotas */
  crear: (req: ContratoRequest): Promise<ContratoResponse> =>
    apiClient.post<ContratoResponse>(BASE, req).then((r) => r.data),

  /** PUT /api/v1/contratos/:id */
  actualizar: (id: string, req: ContratoRequest): Promise<ContratoResponse> =>
    apiClient.put<ContratoResponse>(`${BASE}/${id}`, req).then((r) => r.data),

  /** PATCH /api/v1/contratos/:id/rescindir — rescisión del contrato */
  rescindir: (id: string): Promise<void> =>
    apiClient.patch(`${BASE}/${id}/rescindir`).then(() => undefined),
};
