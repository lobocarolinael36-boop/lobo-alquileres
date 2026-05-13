import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users, Plus, Search, Pencil, Trash2, RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PersonaForm } from "@/components/personas/PersonaForm";

import { personasApi } from "@/api/personas";
import {
  type PersonaResponse,
  type RolPersona,
  ROL_PERSONA_LABELS,
  TIPO_DOC_LABELS,
} from "@/types";

// ── Filtros de rol ─────────────────────────────────────────────────────────────

const FILTROS: { value: RolPersona | ""; label: string }[] = [
  { value: "",            label: "Todas" },
  { value: "DUENO",      label: "Dueños" },
  { value: "INQUILINO",  label: "Inquilinos" },
  { value: "GARANTE",    label: "Garantes" },
  { value: "MARTILLERO", label: "Martilleros" },
];

// ── Badge por rol ──────────────────────────────────────────────────────────────

const ROL_COLORS: Record<RolPersona, string> = {
  DUENO:      "bg-blue-50 text-blue-700 border border-blue-200",
  INQUILINO:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  GARANTE:    "bg-amber-50 text-amber-700 border border-amber-200",
  MARTILLERO: "bg-purple-50 text-purple-700 border border-purple-200",
};

function RolBadge({ rol }: { rol: RolPersona }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROL_COLORS[rol]}`}>
      {ROL_PERSONA_LABELS[rol]}
    </span>
  );
}

// ── Skeleton de carga ──────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-5 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function PersonasPage() {
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<PersonaResponse | undefined>(undefined);
  const [filtroRol, setFiltroRol] = useState<RolPersona | "">("");
  const [search, setSearch] = useState("");

  // ── Query ─────────────────────────────────────────────────────────────────
  const { data: personas = [], isLoading, isError, refetch } = useQuery<PersonaResponse[]>({
    queryKey: ["personas"],
    queryFn: personasApi.listarActivas,
  });

  // ── Mutation: desactivar ─────────────────────────────────────────────────
  const desactivarMutation = useMutation({
    mutationFn: personasApi.desactivar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
      toast.success("Persona desactivada del sistema.");
    },
    onError: () => toast.error("No se pudo desactivar. ¿Tiene contratos activos?"),
  });

  // ── Filtrado en memoria ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return personas
      .filter((p) => !filtroRol || p.roles.includes(filtroRol))
      .filter((p) =>
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.apellido.toLowerCase().includes(q) ||
        p.nombreCompleto.toLowerCase().includes(q) ||
        p.numeroDocumento.toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q)
      );
  }, [personas, filtroRol, search]);

  // ── Conteos para los filtros ─────────────────────────────────────────────
  const counts = useMemo(() => {
    const map: Record<string, number> = { "": personas.length };
    personas.forEach((p) =>
      p.roles.forEach((r) => {
        map[r] = (map[r] ?? 0) + 1;
      })
    );
    return map;
  }, [personas]);

  // ── Acciones ─────────────────────────────────────────────────────────────
  const handleNuevo = () => { setSelected(undefined); setFormOpen(true); };
  const handleEditar = (p: PersonaResponse) => { setSelected(p); setFormOpen(true); };
  const handleDesactivar = (id: string, nombre: string) => {
    if (confirm(`¿Desactivar a ${nombre}? Solo podés hacerlo si no tiene contratos activos.`)) {
      desactivarMutation.mutate(id);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#333333" }}>Personas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Cargando..." : `${personas.length} personas en el sistema`}
          </p>
        </div>
        <Button onClick={handleNuevo} variant="cta" size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Nueva persona
        </Button>
      </div>

      {/* ── Filtros de rol ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(({ value, label }) => {
          const isActive = filtroRol === value;
          const count = counts[value] ?? 0;
          return (
            <button
              key={value || "all"}
              onClick={() => setFiltroRol(value)}
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
          placeholder="Buscar por nombre, apellido o documento..."
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
              <p className="text-muted-foreground font-medium">Error al cargar las personas.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Reintentar
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Users className="h-12 w-12 text-muted-foreground/40" />
                        <div className="text-center">
                          <p className="font-medium text-muted-foreground">
                            {search || filtroRol
                              ? "No hay personas que coincidan con el filtro."
                              : "Todavía no hay personas registradas."}
                          </p>
                          {!search && !filtroRol && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Hacé clic en <strong>Nueva persona</strong> para empezar.
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((persona) => (
                    <TableRow key={persona.id} className="group">
                      {/* Nombre */}
                      <TableCell>
                        <p className="font-medium" style={{ color: "#333333" }}>
                          {persona.apellido}, {persona.nombre}
                        </p>
                        {persona.ciudad && (
                          <p className="text-xs text-muted-foreground">{persona.ciudad}</p>
                        )}
                      </TableCell>

                      {/* Documento */}
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        <span className="text-xs font-medium text-foreground mr-1">
                          {TIPO_DOC_LABELS[persona.tipoDocumento]}
                        </span>
                        {persona.numeroDocumento}
                      </TableCell>

                      {/* Roles */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {persona.roles.map((rol) => (
                            <RolBadge key={rol} rol={rol} />
                          ))}
                        </div>
                      </TableCell>

                      {/* Teléfono */}
                      <TableCell className="text-sm text-muted-foreground">
                        {persona.telefonoPrincipal ?? "—"}
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                        {persona.email ?? "—"}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditar(persona)}
                            title="Editar"
                            className="h-8 w-8 text-muted-foreground hover:text-[#1A4F59]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDesactivar(persona.id, `${persona.nombre} ${persona.apellido}`)}
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

      {/* ── Form slide-over ───────────────────────────────────────── */}
      <PersonaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        persona={selected}
      />
    </div>
  );
}
