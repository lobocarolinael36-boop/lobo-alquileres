import { useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { contratosApi } from "@/api/contratos";
import { personasApi } from "@/api/personas";
import { inmuebleApi } from "@/api/inmuebles";
import type { ContratoRequest, ContratoResponse } from "@/types";
import {
  TIPO_AJUSTE_LABELS,
  PERIODICIDAD_LABELS,
} from "@/types";
import { cn } from "@/lib/utils";

// ── Validación ────────────────────────────────────────────────────────────────

const schema = z.object({
  inmuebleId:           z.string().uuid("Seleccioná un inmueble"),
  inquilinoId:          z.string().uuid("Seleccioná un inquilino"),
  garanteId:            z.string().optional(),
  martilleroId:         z.string().uuid("Seleccioná un martillero / corredor"),
  fechaInicio:          z.string().min(1, "La fecha de inicio es obligatoria"),
  fechaFin:             z.string().min(1, "La fecha de fin es obligatoria"),
  diaVencimientoCuota:  z.coerce.number().min(1, "Mínimo 1").max(28, "Máximo 28"),
  montoAlquilerInicial: z.coerce.number().positive("El monto es obligatorio"),
  monedaContrato:       z.enum(["ARS", "USD"]),
  tipoAjuste:           z.enum(["IPC", "ICL", "FIJO_PORCENTAJE", "NINGUNO"]),
  periodicidadAjuste:   z.enum(["MENSUAL", "TRIMESTRAL", "CUATRIMESTRAL", "SEMESTRAL", "ANUAL"]),
  porcentajeAjusteFijo: z.coerce.number().positive("El porcentaje debe ser mayor a 0").optional()
                          .or(z.literal("")),
  comisionPorcentaje:   z.coerce.number().min(0, "Mínimo 0").max(100, "Máximo 100"),
  depositoMeses:        z.coerce.number().min(1, "Mínimo 1 mes").max(6, "Máximo 6 meses"),
  clausulasAdicionales: z.string().optional(),
  observaciones:        z.string().optional(),
})
.refine(
  (d) => !d.fechaInicio || !d.fechaFin || d.fechaFin > d.fechaInicio,
  { message: "La fecha de fin debe ser posterior al inicio", path: ["fechaFin"] }
)
.refine(
  (d) => d.tipoAjuste !== "FIJO_PORCENTAJE" ||
          (d.porcentajeAjusteFijo !== "" && Number(d.porcentajeAjusteFijo) > 0),
  { message: "El porcentaje es obligatorio cuando el ajuste es fijo", path: ["porcentajeAjusteFijo"] }
);

type FormData = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface ContratoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato?: ContratoResponse;
}

// ── Helper: campo de formulario ───────────────────────────────────────────────

function FormField({
  label, error, required, hint, children,
}: {
  label: string; error?: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-carbon">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />{hint}
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ContratoForm({ open, onOpenChange, contrato }: ContratoFormProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(contrato);

  // ── Datos para los selects ──────────────────────────────────────────────
  const { data: inmuebles = [], isLoading: loadingInmuebles } = useQuery({
    queryKey: ["inmuebles"],
    queryFn: inmuebleApi.listarActivos,
    enabled: open,
  });

  const { data: inquilinos = [], isLoading: loadingInquilinos } = useQuery({
    queryKey: ["personas", "INQUILINO"],
    queryFn: () => personasApi.porRol("INQUILINO"),
    enabled: open,
  });

  const { data: garantes = [], isLoading: loadingGarantes } = useQuery({
    queryKey: ["personas", "GARANTE"],
    queryFn: () => personasApi.porRol("GARANTE"),
    enabled: open,
  });

  const { data: martilleros = [], isLoading: loadingMartilleros } = useQuery({
    queryKey: ["personas", "MARTILLERO"],
    queryFn: () => personasApi.porRol("MARTILLERO"),
    enabled: open,
  });

  const {
    register, handleSubmit, control, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      monedaContrato:      "ARS",
      tipoAjuste:          "ICL",
      periodicidadAjuste:  "ANUAL",
      diaVencimientoCuota: 10,
      comisionPorcentaje:  5,
      depositoMeses:       1,
    },
  });

  // Observar tipo de ajuste para mostrar el campo de porcentaje condicionalmente
  const tipoAjuste  = watch("tipoAjuste");
  const fechaInicio = watch("fechaInicio");

  // Calcula fechaFin sumando N meses a fechaInicio y lo pone en el campo
  const aplicarDuracion = useCallback((meses: number) => {
    if (!fechaInicio) return;
    const d = new Date(fechaInicio + "T00:00:00");
    d.setMonth(d.getMonth() + meses);
    setValue("fechaFin", d.toISOString().split("T")[0], { shouldValidate: true });
  }, [fechaInicio, setValue]);

  // Pre-llenar en modo edición
  useEffect(() => {
    if (open && contrato) {
      reset({
        inmuebleId:           contrato.inmuebleId,
        inquilinoId:          contrato.inquilinoId,
        garanteId:            contrato.garanteId ?? "",
        martilleroId:         contrato.martilleroId,
        fechaInicio:          contrato.fechaInicio,
        fechaFin:             contrato.fechaFin,
        diaVencimientoCuota:  contrato.diaVencimientoCuota,
        montoAlquilerInicial: contrato.montoAlquilerInicial,
        monedaContrato:       contrato.monedaContrato,
        tipoAjuste:           contrato.tipoAjuste,
        periodicidadAjuste:   contrato.periodicidadAjuste,
        porcentajeAjusteFijo: contrato.porcentajeAjusteFijo ?? "",
        comisionPorcentaje:   contrato.comisionPorcentaje ?? 5,
        depositoMeses:        contrato.depositoMeses,
        clausulasAdicionales: contrato.clausulasAdicionales ?? "",
        observaciones:        contrato.observaciones ?? "",
      });
    } else if (open && !contrato) {
      reset({
        monedaContrato: "ARS",
        tipoAjuste: "ICL",
        periodicidadAjuste: "ANUAL",
        diaVencimientoCuota: 10,
        comisionPorcentaje: 5,
        depositoMeses: 1,
      });
    }
  }, [open, contrato, reset]);

  // ── Mutaciones ──────────────────────────────────────────────────────────

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["contratos"] });
    queryClient.invalidateQueries({ queryKey: ["inmuebles"] });
    toast.success(
      isEdit
        ? "Contrato actualizado."
        : "Contrato creado. Las cuotas fueron generadas automáticamente."
    );
    onOpenChange(false);
  };

  const createMutation = useMutation({
    mutationFn: (req: ContratoRequest) => contratosApi.crear(req),
    onSuccess,
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg ?? "No se pudo crear el contrato. Verificá los datos e intentá de nuevo.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (req: ContratoRequest) => contratosApi.actualizar(contrato!.id, req),
    onSuccess,
    onError: () => toast.error("No se pudo actualizar el contrato."),
  });

  // ── Submit ─────────────────────────────────────────────────────────────

  const onSubmit = (data: FormData) => {
    const request: ContratoRequest = {
      inmuebleId:           data.inmuebleId,
      inquilinoId:          data.inquilinoId,
      garanteId:            data.garanteId || undefined,
      martilleroId:         data.martilleroId,
      fechaInicio:          data.fechaInicio,
      fechaFin:             data.fechaFin,
      diaVencimientoCuota:  Number(data.diaVencimientoCuota),
      montoAlquilerInicial: Number(data.montoAlquilerInicial),
      monedaContrato:       data.monedaContrato,
      tipoAjuste:           data.tipoAjuste,
      periodicidadAjuste:   data.periodicidadAjuste,
      porcentajeAjusteFijo: data.tipoAjuste === "FIJO_PORCENTAJE" && data.porcentajeAjusteFijo
        ? Number(data.porcentajeAjusteFijo)
        : undefined,
      comisionPorcentaje:   Number(data.comisionPorcentaje),
      depositoMeses:        Number(data.depositoMeses),
      clausulasAdicionales: data.clausulasAdicionales || undefined,
      observaciones:        data.observaciones || undefined,
    };

    isEdit ? updateMutation.mutate(request) : createMutation.mutate(request);
  };

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending;

  const Section = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="space-y-1 pt-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      <Separator />
    </div>
  );

  // Solo inmuebles DISPONIBLES (o el actual del contrato en edición)
  const inmueblesDisponibles = inmuebles.filter(
    (i) => i.estado === "DISPONIBLE" || i.id === contrato?.inmuebleId
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar contrato" : "Nuevo contrato"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modificá los términos del contrato."
              : "Completá los datos para registrar el contrato. Las cuotas se generan automáticamente."}
          </SheetDescription>
        </SheetHeader>

        <form
          id="contrato-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* ─── Sección 1: Partes ─────────────────────────────────── */}
          <Section title="Partes del contrato" />

          {/* Inmueble */}
          <FormField label="Inmueble" error={errors.inmuebleId?.message} required>
            <Controller
              name="inmuebleId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={loadingInmuebles}
                >
                  <SelectTrigger className={cn(errors.inmuebleId && "border-destructive")}>
                    <SelectValue
                      placeholder={loadingInmuebles ? "Cargando..." : "Seleccioná un inmueble disponible"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {inmueblesDisponibles.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No hay inmuebles disponibles
                      </SelectItem>
                    ) : (
                      inmueblesDisponibles.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.direccionCompleta}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {/* Inquilino */}
          <FormField label="Inquilino" error={errors.inquilinoId?.message} required>
            <Controller
              name="inquilinoId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={loadingInquilinos}
                >
                  <SelectTrigger className={cn(errors.inquilinoId && "border-destructive")}>
                    <SelectValue placeholder={loadingInquilinos ? "Cargando..." : "Seleccioná el inquilino"} />
                  </SelectTrigger>
                  <SelectContent>
                    {inquilinos.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No hay inquilinos registrados
                      </SelectItem>
                    ) : (
                      inquilinos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombreCompleto} — {p.tipoDocumento} {p.numeroDocumento}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {/* Martillero / Corredor — requerido */}
          <FormField label="Martillero / Corredor" error={errors.martilleroId?.message} required>
            <Controller
              name="martilleroId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={loadingMartilleros}
                >
                  <SelectTrigger className={cn(errors.martilleroId && "border-destructive")}>
                    <SelectValue placeholder={loadingMartilleros ? "Cargando..." : "Seleccioná el martillero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {martilleros.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No hay martilleros registrados
                      </SelectItem>
                    ) : (
                      martilleros.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombreCompleto}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {/* Garante (opcional) */}
          <FormField label="Garante" hint="Opcional">
            <Controller
              name="garanteId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}
                  disabled={loadingGarantes}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin garante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin garante</SelectItem>
                    {garantes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombreCompleto} — {p.tipoDocumento} {p.numeroDocumento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {/* ─── Sección 2: Vigencia ───────────────────────────────── */}
          <Section title="Vigencia" />

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha de inicio" error={errors.fechaInicio?.message} required>
              <Input
                type="date"
                {...register("fechaInicio")}
                className={cn(errors.fechaInicio && "border-destructive")}
              />
            </FormField>
            <FormField label="Fecha de fin" error={errors.fechaFin?.message} required>
              <Input
                type="date"
                {...register("fechaFin")}
                className={cn(errors.fechaFin && "border-destructive")}
              />
            </FormField>

            {/* Duración rápida — solo si hay fecha de inicio */}
            <div className="col-span-2 -mt-1">
              <p className="text-xs text-muted-foreground mb-1.5">Duración rápida:</p>
              <div className="flex gap-2 flex-wrap">
                {[12, 24, 36].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => aplicarDuracion(m)}
                    disabled={!fechaInicio}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      fechaInicio
                        ? "border-[#1A4F59]/30 text-[#1A4F59] hover:bg-[#1A4F59] hover:text-white"
                        : "border-border text-muted-foreground cursor-not-allowed opacity-50",
                    ].join(" ")}
                  >
                    {m} meses
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <FormField
                label="Día de vencimiento de cuota"
                error={errors.diaVencimientoCuota?.message}
                hint="Día del mes en que vence cada cuota (1 a 28)"
                required
              >
                <Input
                  type="number"
                  min="1"
                  max="28"
                  {...register("diaVencimientoCuota")}
                  className={cn("w-24 font-mono", errors.diaVencimientoCuota && "border-destructive")}
                />
              </FormField>
            </div>
          </div>

          {/* ─── Sección 3: Económico ─────────────────────────────── */}
          <Section title="Condiciones económicas" />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Monto inicial de la cuota"
              error={errors.montoAlquilerInicial?.message}
              required
            >
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="150000"
                {...register("montoAlquilerInicial")}
                className={cn("font-mono", errors.montoAlquilerInicial && "border-destructive")}
              />
            </FormField>

            <FormField label="Moneda">
              <Controller
                name="monedaContrato"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS — Pesos</SelectItem>
                      <SelectItem value="USD">USD — Dólares</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label="Depósito de garantía"
              error={errors.depositoMeses?.message}
              hint="Cantidad de meses (1 a 6)"
              required
            >
              <Input
                type="number"
                min="1"
                max="6"
                step="1"
                placeholder="1"
                {...register("depositoMeses")}
                className={cn("w-24 font-mono", errors.depositoMeses && "border-destructive")}
              />
            </FormField>

            <FormField
              label="Comisión (%)"
              error={errors.comisionPorcentaje?.message}
              hint="Porcentaje del martillero (0–100)"
              required
            >
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="5"
                {...register("comisionPorcentaje")}
                className={cn("font-mono", errors.comisionPorcentaje && "border-destructive")}
              />
            </FormField>
          </div>

          {/* ─── Sección 4: Ajuste ────────────────────────────────── */}
          <Section
            title="Ajuste del alquiler"
            subtitle="Define cómo se actualizará el monto de la cuota a lo largo del tiempo."
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Índice de ajuste" error={errors.tipoAjuste?.message} required>
                <Controller
                  name="tipoAjuste"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(TIPO_AJUSTE_LABELS) as [keyof typeof TIPO_AJUSTE_LABELS, string][]).map(
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

            {/* Periodicidad — solo si hay ajuste */}
            {tipoAjuste !== "NINGUNO" && (
              <div className="col-span-2">
                <FormField label="Periodicidad del ajuste" error={errors.periodicidadAjuste?.message} required>
                  <Controller
                    name="periodicidadAjuste"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(PERIODICIDAD_LABELS) as [keyof typeof PERIODICIDAD_LABELS, string][]).map(
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
            )}

            {/* Porcentaje fijo — solo si tipoAjuste es FIJO_PORCENTAJE */}
            {tipoAjuste === "FIJO_PORCENTAJE" && (
              <div className="col-span-2">
                <FormField
                  label="Porcentaje de ajuste fijo"
                  error={errors.porcentajeAjusteFijo?.message}
                  hint="Porcentaje de aumento por período (ej: 10 = 10%)"
                  required
                >
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="10"
                    {...register("porcentajeAjusteFijo")}
                    className={cn("w-32 font-mono", errors.porcentajeAjusteFijo && "border-destructive")}
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* ─── Sección 5: Cláusulas y observaciones ─────────────── */}
          <Section title="Cláusulas y observaciones" />

          <FormField label="Cláusulas adicionales">
            <Textarea
              placeholder="Cláusulas especiales, acuerdos adicionales del contrato..."
              rows={3}
              {...register("clausulasAdicionales")}
            />
          </FormField>

          <FormField label="Observaciones internas">
            <Textarea
              placeholder="Notas internas del equipo (no aparecen en el contrato)..."
              rows={2}
              {...register("observaciones")}
            />
          </FormField>
        </form>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="contrato-form" variant="cta" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear contrato"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
