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

async function fetchDolarBlue(): Promise<number | undefined> {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/blue");
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.venta as number;
  } catch {
    return undefined;
  }
}

export function ReciboButton({ cuota }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const contrato = await contratosApi.buscarPorId(cuota.contratoId);

      const [inmueble, inquilino, tenant] = await Promise.all([
        inmuebleApi.buscarPorId(contrato.inmuebleId),
        personasApi.buscarPorId(contrato.inquilinoId),
        tenantsApi.getPerfil().catch(() => null),
      ]);

      const dueno = await personasApi.buscarPorId(inmueble.duenoId);

      // Fetchear tipo de cambio blue solo si el contrato es en USD
      const tipoCambioBlue = contrato.monedaContrato === "USD"
        ? await fetchDolarBlue()
        : undefined;

      const blob = await pdf(
        <ReciboPDF
          cuota={cuota}
          contrato={contrato}
          inquilino={inquilino}
          dueno={dueno}
          inmueble={inmueble}
          tenant={tenant}
          tipoCambioBlue={tipoCambioBlue}
        />
      ).toBlob();

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
