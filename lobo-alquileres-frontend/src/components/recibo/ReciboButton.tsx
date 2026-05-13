import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ReciboPDF } from "./ReciboPDF";
import { personasApi } from "@/api/personas";
import { inmuebleApi } from "@/api/inmuebles";
import { contratosApi } from "@/api/contratos";
import { tenantsApi } from "@/api/tenants";
import type { CuotaResponse } from "@/types";

interface Props {
  cuota: CuotaResponse;
}

/**
 * Botón que genera y descarga el recibo PDF de una cuota pagada.
 * Solo debería renderizarse cuando cuota.estado === "PAGADA" | "PAGADA_PARCIAL".
 */
export function ReciboButton({ cuota }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      // 1. Obtener el contrato para acceder a los IDs relacionados
      const contrato = await contratosApi.buscarPorId(cuota.contratoId);

      // 2. Obtener inmueble, inquilino, tenant y (si tiene) garante en paralelo
      const [inmueble, inquilino, tenant] = await Promise.all([
        inmuebleApi.buscarPorId(contrato.inmuebleId),
        personasApi.buscarPorId(contrato.inquilinoId),
        tenantsApi.getPerfil().catch(() => null),  // opcional: no bloquear si falla
      ]);

      // 3. Obtener el dueño desde el inmueble
      const dueno = await personasApi.buscarPorId(inmueble.duenoId);

      // 4. Generar el blob
      const blob = await pdf(
        <ReciboPDF
          cuota={cuota}
          contrato={contrato}
          inquilino={inquilino}
          dueno={dueno}
          inmueble={inmueble}
          tenant={tenant}
        />
      ).toBlob();

      // 5. Disparar descarga
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `Recibo-${contrato.numeroContrato}-C${String(cuota.numeroCuota).padStart(3, "0")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Recibo descargado.");
    } catch (err) {
      console.error("Error al generar recibo:", err);
      toast.error("No se pudo generar el recibo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleDownload}
      disabled={loading}
      title="Descargar recibo PDF"
      className="gap-1.5 h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileText className="h-3.5 w-3.5" />
      )}
      Recibo
    </Button>
  );
}
