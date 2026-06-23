import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Building2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { LiquidacionPDF } from "./LiquidacionPDF";
import { personasApi } from "@/api/personas";
import { inmuebleApi } from "@/api/inmuebles";
import { contratosApi } from "@/api/contratos";
import { tenantsApi } from "@/api/tenants";
import type { CuotaResponse } from "@/types";

interface Props {
  cuota: CuotaResponse;
}

async function fetchDolarBlue(): Promise<number> {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/blue");
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.venta as number;
  } catch {
    return 0;
  }
}

export function LiquidacionButton({ cuota }: Props) {
  const [dialogOpen, setDialogOpen]         = useState(false);
  const [loading, setLoading]               = useState(false);
  const [generating, setGenerating]         = useState(false);
  const [comision, setComision]             = useState("10");
  const [tipoCambio, setTipoCambio]         = useState("");

  async function handleOpenDialog() {
    setLoading(true);
    try {
      const tc = await fetchDolarBlue();
      setTipoCambio(tc > 0 ? String(tc) : "");
    } finally {
      setLoading(false);
      setDialogOpen(true);
    }
  }

  async function handleGenerar() {
    const tc  = parseFloat(tipoCambio);
    const pct = parseFloat(comision);

    if (isNaN(tc) || tc <= 0) {
      toast.error("Ingresá un tipo de cambio válido.");
      return;
    }
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("La comisión debe ser entre 0 y 100.");
      return;
    }

    setGenerating(true);
    try {
      const contrato = await contratosApi.buscarPorId(cuota.contratoId);
      const [inmueble, tenant] = await Promise.all([
        inmuebleApi.buscarPorId(contrato.inmuebleId),
        tenantsApi.getPerfil().catch(() => null),
      ]);
      const dueno = await personasApi.buscarPorId(inmueble.duenoId);

      const blob = await pdf(
        <LiquidacionPDF
          cuota={cuota}
          contrato={contrato}
          dueno={dueno}
          inmueble={inmueble}
          tenant={tenant}
          tipoCambioBlue={tc}
          comisionPorcentaje={pct}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `Liquidacion-${contrato.numeroContrato}-C${String(cuota.numeroCuota).padStart(3, "0")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Liquidación descargada.");
      setDialogOpen(false);
    } catch (err) {
      console.error("Error al generar liquidación:", err);
      toast.error("No se pudo generar la liquidación.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleOpenDialog}
        disabled={loading}
        title="Liquidación al propietario"
        className="gap-1.5 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Building2 className="h-3.5 w-3.5" />
        )}
        Liquidación
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Liquidación al propietario</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                Tipo de cambio dólar blue
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={1}
                  value={tipoCambio}
                  onChange={e => setTipoCambio(e.target.value)}
                  placeholder="Ej: 1205"
                  className="font-mono"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">por USD</span>
              </div>
              <p className="text-xs text-muted-foreground">Valor obtenido del dólar blue. Podés modificarlo.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                Honorarios inmobiliaria
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={comision}
                  onChange={e => setComision(e.target.value)}
                  className="font-mono"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={generating}>
              Cancelar
            </Button>
            <Button variant="cta" onClick={handleGenerar} disabled={generating}>
              {generating && <Loader2 className="h-4 w-4 animate-spin" />}
              Generar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
