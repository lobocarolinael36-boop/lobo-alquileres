import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText, Plus, Search, Pencil, XCircle, RotateCcw, CalendarDays,
} from "lucide-react";

import { ContratoPDFButton } from "@/components/contratos/ContratoPDFButton";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ContratoForm } from "@/components/contratos/ContratoForm";

import { contratosApi } from "@/api/contratos";
import {
  type ContratoResponse,
  type EstadoContrato,
  ESTADO_CONTRATO_LABELS,
  TIPO_AJUSTE_LABELS,
  PERIODICIDAD_LABELS,
} from "@/types";

// ── Filtros de estado ─────────────────────────────────────────────────────────

const FILTROS: { value: EstadoContrato | ""; label: string }[] = [
  { value: "",           label: "Todos" },
  { value: "ACTIVO",     label: "Activos" },
  { value: "PENDIENTE",  label: "Pendientes" },
  { value: "VENCIDO",    label: "Vencidos" },
  { value: "RESCINDIDO", label: "Rescindidos" },
];

// ── Badge por estado de contrato ──────────────────────────────────────────────

type EstadoBadgeVariant = "disponible" | "alquilado" | "reservado" | "reparacion" | "inactivo";

const ESTADO_BADGE: Record<EstadoContrato, EstadoBadgeVariant> = {
  ACTIVO:     "disponible",
  PENDIENTE:  "reservado",
  VENCIDO:    "reparacion",
  RESCINDIDO: "inactivo",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatMonto(monto: number, moneda: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "ARS",
    maximumFractionDigits: 0,
  }).format(monto);
}

function duracionMeses(inicio: string, fin: string): string {
  const [yi, mi] = inicio.split("-").map(Number);
  const [yf, mf] = fin.split("-").map(Number);
  const meses = (yf - yi) * 12 + (mf - mi);
  return meses === 12 ? "1 año" : meses === 24 ? "2 años" : `${meses} meses`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-5 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ContratosPage() {
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<ContratoResponse | undefined>(undefined);
  const [filtroEstado, setFiltroEstado] = useState<EstadoContrato | "">("");
  const [search, setSearch] = useState("");

  // ── Query ─────────────────────────────────────────────────────────────────
  const { data: contratos = [], isLoading, isError, refetch } = useQuery<ContratoResponse[]>({
    queryKey: ["contratos"],
    queryFn: contratosApi.listar,
  });

  // ── Mutation: rescindir ──────────────────────────────────────────────────
  const rescindirMutation = useMutation({
    mutationFn: contratosApi.rescindir,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["inmuebles"] });
      toast.success("Contrato rescindido.");
    },
    onError: () => toast.error("No se pudo rescindir el contrato."),
  });

  // ── Filtrado en memoria ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return contratos
      .filter((c) => !filtroEstado || c.estado === filtroEstado)
      .filter((c) =>
        !q ||
        c.numeroContrato.toLowerCase().includes(q) ||
        c.inmuebleDireccion.toLowerCase().includes(q) ||
        c.inquilinoNombreCompleto.toLowerCase().includes(q)
      );
  }, [contratos, filtroEstado, search]);

  // ── Conteos ──────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const map: Record<string, number> = { "": contratos.length };
    contratos.forEach((c) => { map[c.estado] = (map[c.estado] ?? 0) + 1; });
    return map;
  }, [contratos]);

  // ── Acciones ─────────────────────────────────────────────────────────────
  const handleNuevo = () => { setSelected(undefined); setFormOpen(true); };
  const handleEditar = (c: ContratoResponse) => { setSelected(c); setFormOpen(true); };
  const handleRescindir = (id: string, nro: string) => {
    if (confirm(`¿Rescindir el contrato ${nro}? Esta acción no se puede deshacer.`)) {
      rescindirMutation.mutate(id);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#333333" }}>Contratos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? "Cargando..."
              : `${counts["ACTIVO"] ?? 0} activos · ${contratos.length} total`}
          </p>
        </div>
        <Button onClick={handleNuevo} variant="cta" size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Nuevo contrato
        </Button>
      </div>

      {/* ── Filtros de estado ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(({ value, label }) => {
          const isActive = filtroEstado === value;
          const count = counts[value] ?? 0;
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

      {/* ── Buscador ──────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por número, dirección o inquilino..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-muted-foreground font-medium">Error al cargar los contratos.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Reintentar
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Contrato</TableHead>
                  <TableHead>Inmueble</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead className="text-right">Cuota base</TableHead>
                  <TableHead>Ajuste</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <FileText className="h-12 w-12 text-muted-foreground/40" />
                        <div className="text-center">
                          <p className="font-medium text-muted-foreground">
                            {search || filtroEstado
                              ? "No hay contratos que coincidan con el filtro."
                              : "Todavía no hay contratos registrados."}
                          </p>
                          {!search && !filtroEstado && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Hacé clic en <strong>Nuevo contrato</strong> para empezar.
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((contrato) => (
                    <TableRow key={contrato.id} className="group">
                      {/* Nro. contrato */}
                      <TableCell>
                        <p className="font-mono text-sm font-medium" style={{ color: "#333333" }}>
                          {contrato.numeroContrato}
                        </p>
                        {/* Progreso de cuotas */}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {contrato.cuotasPagadas}/{contrato.totalCuotas} cuotas
                          {contrato.cuotasVencidas > 0 && (
                            <span className="text-destructive ml-1">
                              · {contrato.cuotasVencidas} vencida{contrato.cuotasVencidas > 1 ? "s" : ""}
                            </span>
                          )}
                        </p>
                      </TableCell>

                      {/* Inmueble */}
                      <TableCell className="max-w-[180px]">
                        <p className="text-sm truncate">{contrato.inmuebleDireccion}</p>
                      </TableCell>

                      {/* Inquilino */}
                      <TableCell>
                        <p className="text-sm">{contrato.inquilinoNombreCompleto}</p>
                        {contrato.garanteNombreCompleto && (
                          <p className="text-xs text-muted-foreground">
                            Gar: {contrato.garanteNombreCompleto}
                          </p>
                        )}
                      </TableCell>

                      {/* Vigencia */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {formatFecha(contrato.fechaInicio)} – {formatFecha(contrato.fechaFin)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 pl-5">
                          {duracionMeses(contrato.fechaInicio, contrato.fechaFin)}
                        </p>
                      </TableCell>

                      {/* Cuota base */}
                      <TableCell className="text-right font-mono text-sm">
                        {formatMonto(contrato.montoAlquilerInicial, contrato.monedaContrato)}
                      </TableCell>

                      {/* Ajuste */}
                      <TableCell>
                        <p className="text-xs font-medium">
                          {contrato.tipoAjuste === "NINGUNO"
                            ? "Sin ajuste"
                            : contrato.tipoAjuste}
                        </p>
                        {contrato.tipoAjuste !== "NINGUNO" && (
                          <p className="text-xs text-muted-foreground">
                            {PERIODICIDAD_LABELS[contrato.periodicidadAjuste]}
                          </p>
                        )}
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        <Badge variant={ESTADO_BADGE[contrato.estado]}>
                          {ESTADO_CONTRATO_LABELS[contrato.estado]}
                        </Badge>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* PDF — disponible para todos los estados */}
                          <ContratoPDFButton contrato={contrato} />

                          {/* Editar y rescindir — solo contratos activos */}
                          {contrato.estado === "ACTIVO" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditar(contrato)}
                                title="Editar contrato"
                                className="h-8 w-8 text-muted-foreground hover:text-[#1A4F59]"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRescindir(contrato.id, contrato.numeroContrato)}
                                disabled={rescindirMutation.isPending}
                                title="Rescindir contrato"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Form slide-over ───────────────────────────────────────── */}
      <ContratoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        contrato={selected}
      />
    </div>
  );
}
