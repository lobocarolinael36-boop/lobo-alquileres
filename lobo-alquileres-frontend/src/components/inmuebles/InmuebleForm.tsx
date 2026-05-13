import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { inmuebleApi } from "@/api/inmuebles";
import { personasApi } from "@/api/personas";
import type { InmuebleRequest, InmuebleResponse } from "@/types";
import { TIPO_INMUEBLE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

// Helper: convierte el valor de un input numérico opcional a number | undefined
const toNum = (val: number | "" | undefined): number | undefined =>
  typeof val === "number" ? val : undefined;

// Detecta el municipio a partir del prefijo de 3 dígitos de la partida
const MUNICIPIOS: Record<string, { nombre: string; url?: string }> = {
  "007": { nombre: "Avellaneda" },
  "014": { nombre: "Bahía Blanca" },
  "015": { nombre: "Berazategui" },
  "018": { nombre: "Esteban Echeverría" },
  "270": { nombre: "Ezeiza" },
  "023": { nombre: "Florencio Varela" },
  "028": { nombre: "General Rodríguez" },
  "408": { nombre: "Hurlingham" },
  "410": { nombre: "Ituzaingó" },
  "412": { nombre: "José C. Paz" },
  "041": { nombre: "La Matanza" },
  "040": { nombre: "Lanús" },
  "042": { nombre: "Lomas de Zamora" },
  "045": { nombre: "General Pueyrredón (Mar del Plata)" },
  "414": { nombre: "Malvinas Argentinas" },
  "056": { nombre: "Merlo" },
  "059": { nombre: "Moreno" },
  "060": { nombre: "Morón" },
  "070": { nombre: "Pilar" },
  "089": { nombre: "Quilmes" },
  "105": { nombre: "San Fernando" },
  "107": { nombre: "San Isidro" },
  "044": { nombre: "General San Martín", url: "https://im-tasasmunicipales.sanmartin.gov.ar" },
  "416": { nombre: "San Miguel" },
  "113": { nombre: "Tigre" },
  "116": { nombre: "Tres de Febrero" },
  "118": { nombre: "Vicente López" },
};

function detectarMunicipio(nroPartida: string): { nombre: string; url?: string } | null {
  if (!nroPartida || nroPartida.length < 3) return null;
  const prefijo = nroPartida.substring(0, 3);
  return MUNICIPIOS[prefijo] ?? null;
}

// ── Validación ────────────────────────────────────────────────────────────────

const schema = z.object({
  duenoId:            z.string().uuid("Seleccioná un dueño"),
  tipo:               z.enum(["DEPARTAMENTO","CASA","LOCAL_COMERCIAL","OFICINA","COCHERA","TERRENO","GALPON","BODEGA"], { required_error: "Seleccioná un tipo" }),
  calle:              z.string().min(1, "La calle es obligatoria").max(200),
  numeroPuerta:       z.string().optional(),
  piso:               z.string().optional(),
  departamentoUnidad: z.string().optional(),
  ciudad:             z.string().min(1, "La ciudad es obligatoria"),
  provincia:          z.string().min(1, "La provincia es obligatoria"),
  codigoPostal:       z.string().optional(),
  nroPartida:         z.string().max(30).optional(),
  porcentajeGasto:    z.coerce.number().min(0, "Mínimo 0%").max(100, "Máximo 100%").optional().or(z.literal("")),
  superficieCubierta: z.coerce.number().positive("Debe ser positiva").optional().or(z.literal("")),
  superficieTotal:    z.coerce.number().positive("Debe ser positiva").optional().or(z.literal("")),
  ambientes:          z.coerce.number().min(1, "Mínimo 1").optional().or(z.literal("")),
  dormitorios:        z.coerce.number().min(0).optional().or(z.literal("")),
  banos:              z.coerce.number().min(1, "Mínimo 1").optional().or(z.literal("")),
  antiguedadAnios:    z.coerce.number().min(0).optional().or(z.literal("")),
  tieneCochera:       z.boolean(),
  tieneBaulera:       z.boolean(),
  tieneAmenities:     z.boolean(),
  valorTasacion:      z.coerce.number().positive("El valor de tasación es obligatorio"),
  monedaTasacion:     z.enum(["ARS", "USD"]),
  descripcion:        z.string().optional(),
  observaciones:      z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface InmuebleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inmueble?: InmuebleResponse;  // si se pasa, modo edición
}

// ── Helper ────────────────────────────────────────────────────────────────────

function FormField({
  label, error, required, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-carbon">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Componente ────────────────────────────────────────────────────────────────

export function InmuebleForm({ open, onOpenChange, inmueble }: InmuebleFormProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(inmueble);

  // Personas con rol DUEÑO — para el select de dueño
  const { data: duenos = [], isLoading: loadingDuenos } = useQuery({
    queryKey: ["personas", "DUENO"],
    queryFn: () => personasApi.porRol("DUENO"),
    enabled: open,
  });

  const {
    register, handleSubmit, control, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tieneCochera: false,
      tieneBaulera: false,
      tieneAmenities: false,
      monedaTasacion: "ARS",
    },
  });

  const nroPartidaWatch = watch("nroPartida");
  const municipioInfo = useMemo(() => detectarMunicipio(nroPartidaWatch ?? ""), [nroPartidaWatch]);

  // Pre-llenar el formulario al abrir en modo edición
  useEffect(() => {
    if (open && inmueble) {
      reset({
        duenoId:            inmueble.duenoId,
        tipo:               inmueble.tipo,
        calle:              inmueble.calle,
        numeroPuerta:       inmueble.numeroPuerta ?? "",
        piso:               inmueble.piso ?? "",
        departamentoUnidad: inmueble.departamentoUnidad ?? "",
        ciudad:             inmueble.ciudad,
        provincia:          inmueble.provincia,
        codigoPostal:       inmueble.codigoPostal ?? "",
        superficieCubierta: inmueble.superficieCubierta ?? "",
        superficieTotal:    inmueble.superficieTotal ?? "",
        ambientes:          inmueble.ambientes ?? "",
        dormitorios:        inmueble.dormitorios ?? "",
        banos:              inmueble.banos ?? "",
        antiguedadAnios:    inmueble.antiguedadAnios ?? "",
        tieneCochera:       inmueble.tieneCochera,
        tieneBaulera:       inmueble.tieneBaulera,
        tieneAmenities:     inmueble.tieneAmenities,
        valorTasacion:      inmueble.valorTasacion ?? 0,
        monedaTasacion:     inmueble.monedaTasacion ?? "ARS",
        nroPartida:         inmueble.nroPartida ?? "",
        porcentajeGasto:    inmueble.porcentajeGasto ?? "",
        descripcion:        inmueble.descripcion ?? "",
        observaciones:      inmueble.observaciones ?? "",
      });
    } else if (open && !inmueble) {
      reset({
        tieneCochera: false, tieneBaulera: false, tieneAmenities: false, monedaTasacion: "ARS",
      });
    }
  }, [open, inmueble, reset]);

  // ── Mutaciones ──────────────────────────────────────────────────────────────

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["inmuebles"] });
    toast.success(isEdit ? "Inmueble actualizado correctamente." : "Inmueble creado correctamente.");
    onOpenChange(false);
  };

  const createMutation = useMutation({
    mutationFn: (req: InmuebleRequest) => inmuebleApi.crear(req),
    onSuccess,
    onError: () => toast.error("No se pudo guardar el inmueble. Intentá de nuevo."),
  });

  const updateMutation = useMutation({
    mutationFn: (req: InmuebleRequest) => inmuebleApi.actualizar(inmueble!.id, req),
    onSuccess,
    onError: () => toast.error("No se pudo actualizar el inmueble."),
  });

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = (data: FormData) => {
    const request: InmuebleRequest = {
      duenoId:            data.duenoId,
      tipo:               data.tipo,
      calle:              data.calle,
      numeroPuerta:       data.numeroPuerta || undefined,
      piso:               data.piso || undefined,
      departamentoUnidad: data.departamentoUnidad || undefined,
      ciudad:             data.ciudad,
      provincia:          data.provincia,
      codigoPostal:       data.codigoPostal || undefined,
      superficieCubierta: toNum(data.superficieCubierta),
      superficieTotal:    toNum(data.superficieTotal),
      ambientes:          toNum(data.ambientes),
      dormitorios:        toNum(data.dormitorios),
      banos:              toNum(data.banos),
      antiguedadAnios:    toNum(data.antiguedadAnios),
      tieneCochera:       data.tieneCochera,
      tieneBaulera:       data.tieneBaulera,
      tieneAmenities:     data.tieneAmenities,
      valorTasacion:      Number(data.valorTasacion),
      monedaTasacion:     data.monedaTasacion,
      nroPartida:         data.nroPartida || undefined,
      porcentajeGasto:    toNum(data.porcentajeGasto),
      descripcion:        data.descripcion || undefined,
      observaciones:      data.observaciones || undefined,
    };

    isEdit ? updateMutation.mutate(request) : createMutation.mutate(request);
  };

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending;

  // ── Sección helper ─────────────────────────────────────────────────────────

  const Section = ({ title }: { title: string }) => (
    <div className="space-y-1 pt-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <Separator />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        {/* ── Header ────────────────────────────────────────────────── */}
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar inmueble" : "Nuevo inmueble"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Modificá los datos del inmueble." : "Completá los datos para registrar un nuevo inmueble en el portfolio."}
          </SheetDescription>
        </SheetHeader>

        {/* ── Body scrollable ───────────────────────────────────────── */}
        <form
          id="inmueble-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* ─── Sección 1: Identificación ─────────────────────────── */}
          <Section title="Identificación" />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Dueño del inmueble" error={errors.duenoId?.message} required>
                <Controller
                  name="duenoId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      disabled={loadingDuenos}
                    >
                      <SelectTrigger className={cn(errors.duenoId && "border-destructive")}>
                        <SelectValue placeholder={loadingDuenos ? "Cargando dueños..." : "Seleccioná un dueño"} />
                      </SelectTrigger>
                      <SelectContent>
                        {duenos.length === 0 && !loadingDuenos ? (
                          <SelectItem value="_none" disabled>
                            No hay dueños. Creá una Persona primero.
                          </SelectItem>
                        ) : (
                          duenos.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.nombreCompleto} — {d.tipoDocumento} {d.numeroDocumento}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>

            <div className="col-span-2">
              <FormField label="Tipo de inmueble" error={errors.tipo?.message} required>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger className={cn(errors.tipo && "border-destructive")}>
                        <SelectValue placeholder="Seleccioná el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(TIPO_INMUEBLE_LABELS) as [keyof typeof TIPO_INMUEBLE_LABELS, string][]).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>
          </div>

          {/* ─── Sección 2: Dirección ──────────────────────────────── */}
          <Section title="Dirección" />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Calle" error={errors.calle?.message} required>
                <Input placeholder="Av. Santa Fe" {...register("calle")} className={cn(errors.calle && "border-destructive")} />
              </FormField>
            </div>
            <FormField label="Número" error={errors.numeroPuerta?.message}>
              <Input placeholder="1234" {...register("numeroPuerta")} />
            </FormField>
            <FormField label="Piso">
              <Input placeholder="3" {...register("piso")} />
            </FormField>
            <FormField label="Unidad / Depto">
              <Input placeholder="A" {...register("departamentoUnidad")} />
            </FormField>
            <FormField label="Código postal">
              <Input placeholder="1425" {...register("codigoPostal")} />
            </FormField>
            <FormField label="Ciudad" error={errors.ciudad?.message} required>
              <Input placeholder="Buenos Aires" {...register("ciudad")} className={cn(errors.ciudad && "border-destructive")} />
            </FormField>
            <FormField label="Provincia" error={errors.provincia?.message} required>
              <Input placeholder="CABA" {...register("provincia")} className={cn(errors.provincia && "border-destructive")} />
            </FormField>
          </div>

          {/* ─── Sección 3: Características ───────────────────────── */}
          <Section title="Características" />

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Sup. cubierta (m²)" error={errors.superficieCubierta?.message}>
              <Input type="number" min="0" step="0.01" placeholder="65" {...register("superficieCubierta")} />
            </FormField>
            <FormField label="Sup. total (m²)" error={errors.superficieTotal?.message}>
              <Input type="number" min="0" step="0.01" placeholder="70" {...register("superficieTotal")} />
            </FormField>
            <FormField label="Antigüedad (años)">
              <Input type="number" min="0" placeholder="10" {...register("antiguedadAnios")} />
            </FormField>
            <FormField label="Ambientes" error={errors.ambientes?.message}>
              <Input type="number" min="1" placeholder="3" {...register("ambientes")} />
            </FormField>
            <FormField label="Dormitorios">
              <Input type="number" min="0" placeholder="2" {...register("dormitorios")} />
            </FormField>
            <FormField label="Baños">
              <Input type="number" min="0" placeholder="1" {...register("banos")} />
            </FormField>
          </div>

          {/* Checkboxes de amenidades */}
          <div className="flex gap-6">
            {(["tieneCochera", "tieneBaulera", "tieneAmenities"] as const).map((field) => (
              <Controller
                key={field}
                name={field}
                control={control}
                render={({ field: f }) => (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={f.value}
                      onCheckedChange={f.onChange}
                    />
                    <span className="text-sm font-medium">
                      {{ tieneCochera: "Cochera", tieneBaulera: "Baulera", tieneAmenities: "Amenities" }[field]}
                    </span>
                  </label>
                )}
              />
            ))}
          </div>

          {/* ─── Sección 4: Valuación ─────────────────────────────── */}
          <Section title="Valuación" />

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Valor de tasación" error={errors.valorTasacion?.message} required>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="150000"
                {...register("valorTasacion")}
                className={cn("font-mono", errors.valorTasacion && "border-destructive")}
              />
            </FormField>
            <FormField label="Moneda">
              <Controller
                name="monedaTasacion"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS — Pesos argentinos</SelectItem>
                      <SelectItem value="USD">USD — Dólares</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          {/* ─── Sección 5: Partida Municipal ─────────────────────── */}
          <Section title="Partida municipal e impuestos" />

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nro. de partida" error={errors.nroPartida?.message}>
              <Input
                placeholder="044-XXXXX-XXX"
                {...register("nroPartida")}
              />
            </FormField>
            <FormField label="% Gasto a cargo del inquilino" error={errors.porcentajeGasto?.message}>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="100"
                  {...register("porcentajeGasto")}
                  className="pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </FormField>
          </div>

          {/* Municipio detectado */}
          {municipioInfo && (
            <div className="rounded-md border border-[#1A4F59]/20 bg-[#EFF7F8] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1A4F59]">{municipioInfo.nombre}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Municipio detectado por el prefijo de la partida</p>
              </div>
              {municipioInfo.url && (
                <a
                  href={municipioInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-[#1A4F59] hover:underline"
                >
                  Consultar tasas
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground -mt-2">
            El % de gasto sirve para prorratear boletas compartidas entre varios departamentos (ej: 25% si el edificio tiene 4 unidades).
          </p>

          {/* ─── Sección 6: Notas ─────────────────────────────────── */}
          <Section title="Notas opcionales" />

          <FormField label="Descripción para el cliente">
            <Textarea
              placeholder="Departamento luminoso con vista al parque, piso de madera..."
              rows={3}
              {...register("descripcion")}
            />
          </FormField>
          <FormField label="Observaciones internas">
            <Textarea
              placeholder="Notas para el equipo interno..."
              rows={2}
              {...register("observaciones")}
            />
          </FormField>
        </form>

        {/* ── Footer sticky ─────────────────────────────────────────── */}
        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="inmueble-form" variant="cta" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear inmueble"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
