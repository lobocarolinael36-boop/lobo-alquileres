import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2, Plus, Search, Pencil, Trash2, RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { InmuebleForm } from "@/components/inmuebles/InmuebleForm";

import { inmuebleApi } from "@/api/inmuebles";
import {
  type InmuebleResponse,
  type EstadoInmueble,
  TIPO_INMUEBLE_LABELS,
  ESTADO_INMUEBLE_LABELS,
} from "@/types";

// ── Configuración de filtros de estado ────────────────────────────────────────

const FILTROS: { value: EstadoInmueble | ""; label: string }[] = [
  { value: "",             label: "Todos" },
  { value: "DISPONIBLE",  label: "Disponibles" },
  { value: "ALQUILADO",   label: "Alquilados" },
  { value: "RESERVADO",   label: "Reservados" },
  { value: "EN_REPARACION", label: "En reparación" },
  { value: "INACTIVO",    label: "Inactivos" },
];

// ── Helpers de visualización ──────────────────────────────────────────────────

type BadgeVariant = "disponible"|"alquilado"|"reservado"|"reparacion"|"inactivo";

const ESTADO_BADGE: Record<EstadoInmueble, BadgeVariant> = {
  DISPONIBLE:    "disponible",
  ALQUILADO:     "alquilado",
  RESERVADO:     "reservado",
  EN_REPARACION: "reparacion",
  INACTIVO:      "inactivo",
};

function formatMonto(valor: number | null, moneda: string | null): string {
  if (!valor) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

// ── Fila de skeleton para loading ────────────────────────────────────────────

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

export default function InmueblesPage() {
  const queryClient = useQueryClient();

  // Estado del UI
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<InmuebleResponse | undefined>(undefined);
  const [filtroEstado, setFiltroEstado] = useState<EstadoInmueble | "">("");
  const [search, setSearch] = useState("");

  // ── Query ─────────────────────────────────────────────────────────────────
  const { data: inmuebles = [], isLoading, isError, refetch } = useQuery<InmuebleResponse[]>({
    queryKey: ["inmuebles"],
    queryFn: inmuebleApi.listarActivos,
  });

  // ── Mutation: desactivar ─────────────────────────────────────────────────
  const desactivarMutation = useMutation({
    mutationFn: inmuebleApi.desactivar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inmuebles"] });
      toast.success("Inmueble desactivado.");
    },
    onError: () => toast.error("No se pudo desactivar el inmueble. ¿Tiene un contrato activo?"),
  });

  // ── Filtrado en memoria ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return inmuebles
      .filter((i) => !filtroEstado || i.estado === filtroEstado)
      .filter((i) =>
        !q ||
        i.direccionCompleta.toLowerCase().includes(q) ||
        i.duenoNombreCompleto.toLowerCase().includes(q) ||
        TIPO_INMUEBLE_LABELS[i.tipo].toLowerCase().includes(q)
      );
  }, [inmuebles, filtroEstado, search]);

  // ── Conteos para los filtros ─────────────────────────────────────────────
  const counts = useMemo(() => {
    const map: Record<string, number> = { "": inmuebles.length };
    inmuebles.forEach((i) => {
      map[i.estado] = (map[i.estado] ?? 0) + 1;
    });
    return map;
  }, [inmuebles]);

  // ── Acciones ─────────────────────────────────────────────────────────────
  const handleNuevo = () => { setSelected(undefined); setFormOpen(true); };
  const handleEditar = (i: InmuebleResponse) => { setSelected(i); setFormOpen(true); };
  const handleDesactivar = (id: string) => {
    if (confirm("¿Desactivar este inmueble? Solo podés hacerlo si no tiene contratos activos.")) {
      desactivarMutation.mutate(id);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#333333" }}>Inmuebles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Cargando..." : `${inmuebles.length} inmuebles en el portfolio`}
          </p>
        </div>
        <Button onClick={handleNuevo} variant="cta" size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Nuevo inmueble
        </Button>
      </div>

      {/* ── Filtros de estado ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(({ value, label }) => {
          const isActive = filtroEstado === value;
          const count = counts[value] ?? 0;
          return (
            <button
              key={value}
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
          placeholder="Buscar por dirección, dueño o tipo..."
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
              <p className="text-muted-foreground font-medium">Error al cargar los inmuebles.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Reintentar
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Dirección</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Dueño</TableHead>
                  <TableHead className="text-right">Superficie</TableHead>
                  <TableHead className="text-right">Tasación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Building2 className="h-12 w-12 text-muted-foreground/40" />
                        <div className="text-center">
                          <p className="font-medium text-muted-foreground">
                            {search || filtroEstado
                              ? "No hay inmuebles que coincidan con el filtro."
                              : "Todavía no hay inmuebles cargados."}
                          </p>
                          {!search && !filtroEstado && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Hacé clic en <strong>Nuevo inmueble</strong> para empezar.
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((inmueble) => (
                    <TableRow key={inmueble.id} className="group">
                      <TableCell className="max-w-[220px]">
                        <p className="font-medium truncate" style={{ color: "#333333" }}>
                          {inmueble.direccionCompleta}
                        </p>
                        {inmueble.ciudad && (
                          <p className="text-xs text-muted-foreground">{inmueble.ciudad}</p>
                        )}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {TIPO_INMUEBLE_LABELS[inmueble.tipo]}
                      </TableCell>

                      <TableCell>
                        <Badge variant={ESTADO_BADGE[inmueble.estado]}>
                          {ESTADO_INMUEBLE_LABELS[inmueble.estado]}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm max-w-[150px] truncate">
                        {inmueble.duenoNombreCompleto}
                      </TableCell>

                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {inmueble.superficieCubierta
                          ? `${inmueble.superficieCubierta} m²`
                          : "—"}
                      </TableCell>

                      <TableCell className="text-right font-mono text-sm">
                        {formatMonto(inmueble.valorTasacion, inmueble.monedaTasacion)}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditar(inmueble)}
                            title="Editar"
                            className="h-8 w-8 text-muted-foreground hover:text-[#1A4F59]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDesactivar(inmueble.id)}
                            disabled={desactivarMutation.isPending}
                            title="Desactivar"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* ── Form (slide-over) ─────────────────────────────────────── */}
      <InmuebleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        inmueble={selected}
      />
    </div>
  );
}
