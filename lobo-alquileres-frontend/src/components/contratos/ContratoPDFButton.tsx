import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ContratoPDF } from "./ContratoPDF";
import { personasApi } from "@/api/personas";
import { inmuebleApi } from "@/api/inmuebles";
import type { ContratoResponse } from "@/types";

interface Props {
  contrato: ContratoResponse;
}

export function ContratoPDFButton({ contrato }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      // Traer inmueble + inquilino + garante (opcional) en paralelo
      const [inmueble, inquilino, garante] = await Promise.all([
        inmuebleApi.buscarPorId(contrato.inmuebleId),
        personasApi.buscarPorId(contrato.inquilinoId),
        contrato.garanteId
          ? personasApi.buscarPorId(contrato.garanteId)
          : Promise.resolve(null),
      ]);

      // Traer el dueño usando el id que trae el inmueble
      const dueno = await personasApi.buscarPorId(inmueble.duenoId);

      // Generar el blob del PDF
      const blob = await pdf(
        <ContratoPDF
          contrato={contrato}
          inquilino={inquilino}
          garante={garante}
          dueno={dueno}
          inmueble={inmueble}
        />
      ).toBlob();

      // Disparar la descarga
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${contrato.numeroContrato}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`PDF "${contrato.numeroContrato}" descargado.`);
    } catch (err) {
      console.error("Error al generar PDF:", err);
      toast.error("No se pudo generar el PDF del contrato.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDownload}
      disabled={loading}
      title="Descargar PDF del contrato"
      className="h-8 w-8 text-muted-foreground hover:text-[#1A4F59]"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
    </Button>
  );
}
