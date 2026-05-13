import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  CreditCard, RotateCcw, CheckCircle2, Clock, AlertTriangle, DollarSign, Loader2,
  Receipt,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

import { cuotasApi } from "@/api/cuotas";
import { ReciboButton } from "@/components/recibo/ReciboButton";
import {
  type CuotaResponse,
  type EstadoCuota,
  type GastoCuotaRequest,
  type PagoRequest,
  ESTADO_CUOTA_LABELS,
  METODO_PAGO_LABELS,
} from "@/types";

// ── Filtros de estado ─────────────────────────────────────────────────────────

const FILTROS: { value: EstadoCuota | ""; label: string }[] = [
  { value: "",               label: "Todas" },
  { value: "PENDIENTE",     label: "Pendientes" },
  { value: "VENCIDA",       label: "Vencidas" },
  { value: "PAGADA",        label: "Pagadas" },
  { value: "PAGADA_PARCIAL", label: "Pago parcial" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Formatea "YYYY-MM-DD" → "DD/MM/YYYY" */
function formatFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Formatea una fecha ISO (LocalDate o OffsetDateTime) a "DD/MM/YYYY".
 * El backend devuelve fechaPago como OffsetDateTime ("2026-05-08T00:00:00Z").
 */
function formatFechaPago(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

/**
 * Deriva el período de la cuota a partir de la fecha de vencimiento.
 * El backend no expone un campo "periodo"; se calcula desde fechaVencimiento.
 */
function formatPeriodo(fechaVencimiento: string): string {
  const [y, m] = fechaVencimiento.split("-").map(Number);
  return new Date(y, m - 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

function formatMonto(monto: number, moneda: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "ARS",
    maximumFractionDigits: 0,
  }).format(monto);
}

function mesPorDefecto(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

// ── Badge variant por estado de cuota ─────────────────────────────────────────

type CuotaBadgeVariant = "disponible" | "alquilado" | "reservado" | "reparacion" | "inactivo" | "pagada" | "vencida" | "parcial" | "pendiente";

const ESTADO_CUOTA_BADGE: Record<EstadoCuota, CuotaBadgeVariant> = {
  PENDIENTE:      "pendiente",
  PAGADA:         "pagada",
  VENCIDA:        "vencida",
  PAGADA_PARCIAL: "parcial",
};

// ── Esquema del formulario de pago ────────────────────────────────────────────

const pagoSchema = z.object({
  fechaPago:          z.string().min(1, "La fecha es obligatoria"),
  metodoPago:         z.enum(["EFECTIVO", "TRANSFERENCIA", "CHEQUE", "DEPOSITO_BANCARIO"]),
  montoPagado:        z.coerce.number().positive("El monto debe ser positivo"),
  numeroComprobante:  z.string().optional(),
  observaciones:      z.string().optional(),
});

type PagoFormData = z.infer<typeof pagoSchema>;

// ── Dialog de pago ────────────────────────────────────────────────────────────

function PagoDialog({
  cuota,
  open,
  onOpenChange,
}: {
  cuota: CuotaResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register, handleSubmit, control, reset,
    formState: { errors, isSubmitting },
  } = useForm<PagoFormData>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      fechaPago:  new Date().toISOString().slice(0, 10),
      metodoPago: "EFECTIVO",
    },
  });

  // Pre-llenar monto con el total de la cuota al abrir el dialog
  useEffect(() => {
    if (open && cuota) {
      reset({
        fechaPago:   new Date().toISOString().slice(0, 10),
        metodoPago:  "EFECTIVO",
        montoPagado: cuota.montoTotal,
      });
    }
  }, [open, cuota, reset]);

  const pagarMutation = useMutation({
    mutationFn: (req: PagoRequest) => cuotasApi.pagar(cuota!.id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuotas"] });
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Pago registrado correctamente.");
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudo registrar el pago."),
  });

  const onSubmit = (data: PagoFormData) => {
    pagarMutation.mutate({
      fechaPago:         data.fechaPago,
      metodoPago:        data.metodoPago,
      montoPagado:       Number(data.montoPagado),
      numeroComprobante: data.numeroComprobante || undefined,
      observaciones:     data.observaciones || undefined,
    });
  };

  const isPending = isSubmitting || pagarMutation.isPending;

  if (!cuota) return null;

  const moneda = cuota.monedaContrato ?? "ARS";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Cuota {cuota.numeroCuota} — {formatPeriodo(cuota.fechaVencimiento)}
            <span className="block mt-1 font-medium text-foreground">
              {cuota.numeroContrato} · Monto total: {formatMonto(cuota.montoTotal, moneda)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form id="pago-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Fecha */}
          <div className="space-y-1.5">
            <Label>Fecha de pago <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              {...register("fechaPago")}
              className={errors.fechaPago ? "border-destructive" : ""}
            />
            {errors.fechaPago && (
              <p className="text-xs text-destructive">{errors.fechaPago.message}</p>
            )}
          </div>

          {/* Método */}
          <div className="space-y-1.5">
            <Label>Método de pago <span className="text-destructive">*</span></Label>
            <Controller
              name="metodoPago"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(METODO_PAGO_LABELS) as [keyof typeof METODO_PAGO_LABELS, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Monto */}
          <div className="space-y-1.5">
            <Label>Monto pagado <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              {...register("montoPagado")}
              className={`font-mono ${errors.montoPagado ? "border-destructive" : ""}`}
            />
            {errors.montoPagado && (
              <p className="text-xs text-destructive">{errors.montoPagado.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Monto esperado: {formatMonto(cuota.montoTotal, moneda)}
            </p>
          </div>

          {/* Comprobante */}
          <div className="space-y-1.5">
            <Label>Nro. de comprobante</Label>
            <Input
              placeholder="Nro. transferencia, cheque, recibo..."
              {...register("numeroComprobante")}
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-1.5">
            <Label>Observaciones</Label>
            <Textarea
              placeholder="Notas adicionales..."
              rows={2}
              {...register("observaciones")}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" form="pago-form" variant="cta" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Esquema del formulario de gastos ─────────────────────────────────────────

const gastosSchema = z.object({
  montoTasaMunicipal: z.coerce.number().min(0, "Debe ser ≥ 0").optional().or(z.literal("")),
  montoAgua:          z.coerce.number().min(0, "Debe ser ≥ 0").optional().or(z.literal("")),
  montoExpensas:      z.coerce.number().min(0, "Debe ser ≥ 0").optional().or(z.literal("")),
  montoLuz:           z.coerce.number().min(0, "Debe ser ≥ 0").optional().or(z.literal("")),
  nroCuentaLuz:       z.string().max(20).optional(),
});

type GastosFormData = z.infer<typeof gastosSchema>;

// ── Dialog de gastos ──────────────────────────────────────────────────────────

function GastosDialog({
  cuota,
  open,
  onOpenChange,
}: {
  cuota: CuotaResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<GastosFormData>({ resolver: zodResolver(gastosSchema) });

  useEffect(() => {
    if (open && cuota) {
      reset({
        montoTasaMunicipal: cuota.montoTasaMunicipal ?? "",
        montoAgua:          cuota.montoAgua ?? "",
        montoExpensas:      cuota.montoExpensas ?? "",
        montoLuz:           cuota.montoLuz ?? "",
        nroCuentaLuz:       cuota.nroCuentaLuz ?? "",
      });
    }
  }, [open, cuota, reset]);

  const gastosMutation = useMutation({
    mutationFn: (req: GastoCuotaRequest) => cuotasApi.actualizarGastos(cuota!.id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuotas"] });
      toast.success("Gastos actualizados.");
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudieron guardar los gastos."),
  });

  const onSubmit = (data: GastosFormData) => {
    gastosMutation.mutate({
      montoTasaMunicipal: data.montoTasaMunicipal !== "" ? Number(data.montoTasaMunicipal) : undefined,
      montoAgua:          data.montoAgua          !== "" ? Number(data.montoAgua)          : undefined,
      montoExpensas:      data.montoExpensas       !== "" ? Number(data.montoExpensas)      : undefined,
      montoLuz:           data.montoLuz            !== "" ? Number(data.montoLuz)           : undefined,
      nroCuentaLuz:       data.nroCuentaLuz || undefined,
    });
  };

  if (!cuota) return null;

  const moneda   = cuota.monedaContrato ?? "ARS";
  const tasa     = cuota.montoTasaMunicipal ?? 0;
  const agua     = cuota.montoAgua ?? 0;
  const expensas = cuota.montoExpensas ?? 0;
  const luz      = cuota.montoLuz ?? 0;
  const total    = cuota.montoTotal + tasa + agua + expensas + luz;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cargar gastos del mes</DialogTitle>
          <DialogDescription>
            Cuota {cuota.numeroCuota} — {formatPeriodo(cuota.fechaVencimiento)}
            <span className="block mt-0.5 font-medium text-foreground">{cuota.numeroContrato}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Resumen de liquidación actual */}
        <div className="rounded-md border bg-muted/30 p-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Alquiler base</span>
            <span className="font-mono font-medium">{formatMonto(cuota.montoTotal, moneda)}</span>
          </div>
          {tasa > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tasa municipal / ABL</span>
              <span className="font-mono">{formatMonto(tasa, moneda)}</span>
            </div>
          )}
          {agua > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agua (AYSA)</span>
              <span className="font-mono">{formatMonto(agua, moneda)}</span>
            </div>
          )}
          {expensas > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expensas</span>
              <span className="font-mono">{formatMonto(expensas, moneda)}</span>
            </div>
          )}
          {luz > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Luz (EDENOR)</span>
              <span className="font-mono">{formatMonto(luz, moneda)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1.5 mt-1">
            <span className="font-semibold">Total a cobrar</span>
            <span className="font-mono font-bold text-[#1A4F59]">{formatMonto(total, moneda)}</span>
          </div>
        </div>

        <form id="gastos-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tasa municipal / ABL</Label>
              <Input
                type="number" min="0" step="0.01" placeholder="0"
                {...register("montoTasaMunicipal")}
                className={`font-mono ${errors.montoTasaMunicipal ? "border-destructive" : ""}`}
              />
              {errors.montoTasaMunicipal && (
                <p className="text-xs text-destructive">{errors.montoTasaMunicipal.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Agua (AYSA)</Label>
              <Input
                type="number" min="0" step="0.01" placeholder="0"
                {...register("montoAgua")}
                className={`font-mono ${errors.montoAgua ? "border-destructive" : ""}`}
              />
              {errors.montoAgua && (
                <p className="text-xs text-destructive">{errors.montoAgua.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Expensas</Label>
              <Input
                type="number" min="0" step="0.01" placeholder="0"
                {...register("montoExpensas")}
                className={`font-mono ${errors.montoExpensas ? "border-destructive" : ""}`}
              />
              {errors.montoExpensas && (
                <p className="text-xs text-destructive">{errors.montoExpensas.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Luz (EDENOR)</Label>
              <Input
                type="number" min="0" step="0.01" placeholder="0"
                {...register("montoLuz")}
                className={`font-mono ${errors.montoLuz ? "border-destructive" : ""}`}
              />
              {errors.montoLuz && (
                <p className="text-xs text-destructive">{errors.montoLuz.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nro. cuenta luz <span className="text-muted-foreground text-xs font-normal">(Edenor / distribuidora)</span></Label>
            <Input
              placeholder="12345678901"
              maxLength={20}
              {...register("nroCuentaLuz")}
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || gastosMutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="gastos-form" variant="cta" disabled={isSubmitting || gastosMutation.isPending}>
            {(isSubmitting || gastosMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar gastos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-bold truncate" style={{ color: "#333333" }}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-5 w-full" /></TableCell>
      ))}
    </TableRow>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function CuotasPage() {
  const [mes, setMes] = useState(mesPorDefecto);
  const [filtroEstado, setFiltroEstado] = useState<EstadoCuota | "">("");
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [gastosDialogOpen, setGastosDialogOpen] = useState(false);
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<CuotaResponse | null>(null);

  // ── Query ─────────────────────────────────────────────────────────────────
  const { data: cuotas = [], isLoading, isError, refetch } = useQuery<CuotaResponse[]>({
    queryKey: ["cuotas", mes],
    queryFn: () => cuotasApi.porMes(mes),
    staleTime: 10_000,
  });

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const filtered = useMemo(
    () => cuotas.filter((c) => !filtroEstado || c.estado === filtroEstado),
    [cuotas, filtroEstado]
  );

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const monedaPrincipal = cuotas[0]?.monedaContrato ?? "ARS";
    const cobrado   = cuotas.filter((c) => c.estado === "PAGADA").reduce((s, c) => s + c.montoTotal, 0);
    const pendiente = cuotas.filter((c) => c.estado === "PENDIENTE").reduce((s, c) => s + c.montoTotal, 0);
    const vencidas  = cuotas.filter((c) => c.estado === "VENCIDA").length;
    return { total: cuotas.length, cobrado, pendiente, vencidas, monedaPrincipal };
  }, [cuotas]);

  // ── Acciones ─────────────────────────────────────────────────────────────
  const handleCobrar = (cuota: CuotaResponse) => {
    setCuotaSeleccionada(cuota);
    setPagoDialogOpen(true);
  };

  const handleGastos = (cuota: CuotaResponse) => {
    setCuotaSeleccionada(cuota);
    setGastosDialogOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      {/* ── Header + selector de mes ────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#333333" }}>Cuotas y cobros</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Panel de vencimientos y registro de pagos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="mes-selector" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Ver mes:
          </label>
          <Input
            id="mes-selector"
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-44 font-mono"
          />
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total cuotas del mes"
          value={String(kpis.total)}
          sub={isLoading ? "Cargando..." : undefined}
          icon={CreditCard}
          color="bg-[#EFF7F8] text-[#1A4F59]"
        />
        <KpiCard
          label="Cobrado"
          value={formatMonto(kpis.cobrado, kpis.monedaPrincipal)}
          sub={`${cuotas.filter((c) => c.estado === "PAGADA").length} cuotas`}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="Pendiente de cobro"
          value={formatMonto(kpis.pendiente, kpis.monedaPrincipal)}
          sub={`${cuotas.filter((c) => c.estado === "PENDIENTE").length} cuotas`}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
        />
        <KpiCard
          label="Cuotas vencidas"
          value={String(kpis.vencidas)}
          sub={kpis.vencidas > 0 ? "Requieren atención" : "Al día"}
          icon={AlertTriangle}
          color={kpis.vencidas > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}
        />
      </div>

      {/* ── Filtros de estado ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(({ value, label }) => {
          const isActive = filtroEstado === value;
          const count = value === ""
            ? cuotas.length
            : cuotas.filter((c) => c.estado === value).length;
          return (
            <button
              key={value || "all"}
              onClick={() => setFiltroEstado(value)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5",
                "text-sm font-medium transition-all",
                isActive
                  ? "border-[#1A4F59] bg-[#1A4F59] text-white shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-[#1A4F59]/40 hover:text-[#1A4F59]",
              ].join(" ")}
            >
              {label}
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-muted-foreground font-medium">Error al cargar las cuotas.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Reintentar
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Contrato</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Cuota #</TableHead>
                  <TableHead className="text-right">Monto total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <CreditCard className="h-12 w-12 text-muted-foreground/40" />
                        <div className="text-center">
                          <p className="font-medium text-muted-foreground">
                            {filtroEstado
                              ? "No hay cuotas con ese estado este mes."
                              : "No hay cuotas para este mes."}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Probá seleccionar otro mes o crear contratos primero.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((cuota) => {
                    const puedeCobrarse = cuota.estado === "PENDIENTE" || cuota.estado === "VENCIDA" || cuota.estado === "PAGADA_PARCIAL";
                    const estaVencida   = cuota.estado === "VENCIDA";
                    const moneda        = cuota.monedaContrato ?? "ARS";

                    return (
                      <TableRow
                        key={cuota.id}
                        className={estaVencida ? "bg-red-50/50 hover:bg-red-50" : ""}
                      >
                        {/* Contrato */}
                        <TableCell>
                          <p className="font-mono text-sm font-medium" style={{ color: "#333333" }}>
                            {cuota.numeroContrato}
                          </p>
                        </TableCell>

                        {/* Período — derivado de fechaVencimiento */}
                        <TableCell className="text-sm">
                          {formatPeriodo(cuota.fechaVencimiento)}
                        </TableCell>

                        {/* Vencimiento */}
                        <TableCell>
                          <span className={`text-sm ${estaVencida ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            {formatFecha(cuota.fechaVencimiento)}
                          </span>
                        </TableCell>

                        {/* Nro cuota */}
                        <TableCell className="text-sm text-muted-foreground">
                          #{cuota.numeroCuota}
                        </TableCell>

                        {/* Monto */}
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {cuota.montoLiquidacion != null ? (
                            <>
                              <span className="text-[#1A4F59]">{formatMonto(cuota.montoLiquidacion, moneda)}</span>
                              <p className="text-xs text-muted-foreground font-normal">
                                alq. {formatMonto(cuota.montoTotal, moneda)}
                              </p>
                            </>
                          ) : (
                            <>
                              {formatMonto(cuota.montoTotal, moneda)}
                              {cuota.montoAjuste > 0 && (
                                <p className="text-xs text-muted-foreground font-normal">
                                  base + {formatMonto(cuota.montoAjuste, moneda)}
                                </p>
                              )}
                            </>
                          )}
                        </TableCell>

                        {/* Estado */}
                        <TableCell>
                          <Badge variant={ESTADO_CUOTA_BADGE[cuota.estado]}>
                            {ESTADO_CUOTA_LABELS[cuota.estado]}
                          </Badge>
                          {cuota.fechaPago && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Pago: {formatFechaPago(cuota.fechaPago)}
                            </p>
                          )}
                        </TableCell>

                        {/* Acción */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botón gastos — siempre visible */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGastos(cuota)}
                              className="gap-1.5 h-8 text-muted-foreground hover:text-[#1A4F59]"
                              title="Cargar gastos del mes"
                            >
                              <Receipt className="h-3.5 w-3.5" />
                              Gastos
                            </Button>

                            {puedeCobrarse ? (
                              <Button
                                size="sm"
                                variant="cta"
                                onClick={() => handleCobrar(cuota)}
                                className="gap-1.5 h-8"
                              >
                                <DollarSign className="h-3.5 w-3.5" />
                                Cobrar
                              </Button>
                            ) : (
                              <>
                                {/* Recibo PDF solo para cuotas pagadas */}
                                <ReciboButton cuota={cuota} />
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog de pago ────────────────────────────────────────── */}
      <PagoDialog
        cuota={cuotaSeleccionada}
        open={pagoDialogOpen}
        onOpenChange={setPagoDialogOpen}
      />

      {/* ── Dialog de gastos ──────────────────────────────────────── */}
      <GastosDialog
        cuota={cuotaSeleccionada}
        open={gastosDialogOpen}
        onOpenChange={setGastosDialogOpen}
      />
    </div>
  );
}
