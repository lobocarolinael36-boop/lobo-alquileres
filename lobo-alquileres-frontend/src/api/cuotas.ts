import apiClient from "./client";
import type { CuotaResponse, GastoCuotaRequest, PagoRequest } from "@/types";

const BASE = "/api/v1/cuotas";

export const cuotasApi = {
  /** GET /api/v1/cuotas/por-mes?mes=YYYY-MM — cuotas del mes seleccionado */
  porMes: (mes: string): Promise<CuotaResponse[]> =>
    apiClient.get<CuotaResponse[]>(`${BASE}/por-mes`, { params: { mes } }).then((r) => r.data),

  /** GET /api/v1/cuotas/vencidas — cuotas impagas con fecha de vencimiento pasada */
  vencidas: (): Promise<CuotaResponse[]> =>
    apiClient.get<CuotaResponse[]>(`${BASE}/vencidas`).then((r) => r.data),

  /** GET /api/v1/cuotas/por-contrato/:contratoId */
  porContrato: (contratoId: string): Promise<CuotaResponse[]> =>
    apiClient.get<CuotaResponse[]>(`${BASE}/por-contrato/${contratoId}`).then((r) => r.data),

  /** POST /api/v1/cuotas/:id/pagar — registrar pago (total o parcial) */
  pagar: (id: string, req: PagoRequest): Promise<CuotaResponse> =>
    apiClient.post<CuotaResponse>(`${BASE}/${id}/pagar`, req).then((r) => r.data),

  /** PATCH /api/v1/cuotas/:id/gastos — cargar tasa municipal + luz */
  actualizarGastos: (id: string, req: GastoCuotaRequest): Promise<CuotaResponse> =>
    apiClient.patch<CuotaResponse>(`${BASE}/${id}/gastos`, req).then((r) => r.data),
};
