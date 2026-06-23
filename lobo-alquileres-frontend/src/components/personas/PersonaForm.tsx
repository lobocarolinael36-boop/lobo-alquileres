import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

import { personasApi } from "@/api/personas";
import type { PersonaRequest, PersonaResponse, RolPersona } from "@/types";
import { ROL_PERSONA_LABELS, TIPO_DOC_LABELS } from "@/types";
import { cn } from "@/lib/utils";

// ── Esquema de validación ─────────────────────────────────────────────────────

const schema = z.object({
  tipoDocumento:     z.enum(["DNI", "CUIL", "CUIT", "PASAPORTE", "LE"], { required_error: "Seleccioná un tipo" }),
  numeroDocumento:   z.string().min(7, "Mínimo 7 caracteres").max(20),
  nombre:            z.string().min(1, "El nombre es obligatorio").max(100),
  apellido:          z.string().min(1, "El apellido es obligatorio").max(100),
  cuil:              z.string().max(20).optional().or(z.literal("")),
  email:             z.string().email("Email inválido").optional().or(z.literal("")),
  telefonoPrincipal: z.string().max(30).optional().or(z.literal("")),
  telefonoAlternativo: z.string().max(30).optional().or(z.literal("")),
  fechaNacimiento:   z.string().optional().or(z.literal("")),
  // Domicilio
  calle:             z.string().max(200).optional().or(z.literal("")),
  numeroPuerta:      z.string().max(20).optional().or(z.literal("")),
  piso:              z.string().max(10).optional().or(z.literal("")),
  departamentoUnidad: z.string().max(20).optional().or(z.literal("")),
  ciudad:            z.string().max(100).optional().or(z.literal("")),
  provincia:         z.string().max(100).optional().or(z.literal("")),
  codigoPostal:      z.string().max(10).optional().or(z.literal("")),
  // Roles
  esDueno:      z.boolean(),
  esInquilino:  z.boolean(),
  esGarante:    z.boolean(),
  esMartillero: z.boolean(),
  // Notas
  observaciones: z.string().optional(),
}).refine(
  (d) => d.esDueno || d.esInquilino || d.esGarante || d.esMartillero,
  { message: "Seleccioná al menos un rol", path: ["esDueno"] }
);

type FormData = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface PersonaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona?: PersonaResponse;
}

// ── Helper: campo de formulario ───────────────────────────────────────────────

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

export function PersonaForm({ open, onOpenChange, persona }: PersonaFormProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(persona);

  const {
    register, handleSubmit, control, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipoDocumento: "DNI",
      esDueno: false, esInquilino: false, esGarante: false, esMartillero: false,
    },
  });

  // Pre-llenar en modo edición
  useEffect(() => {
    if (open && persona) {
      const roles = persona.roles;
      reset({
        tipoDocumento:      persona.tipoDocumento,
        numeroDocumento:    persona.numeroDocumento,
        nombre:             persona.nombre,
        apellido:           persona.apellido,
        cuil:               persona.cuil ?? "",
        email:              persona.email ?? "",
        telefonoPrincipal:  persona.telefonoPrincipal ?? "",
        telefonoAlternativo: persona.telefonoAlternativo ?? "",
        fechaNacimiento:    persona.fechaNacimiento ?? "",
        calle:              persona.calle ?? "",
        numeroPuerta:       persona.numeroPuerta ?? "",
        piso:               persona.piso ?? "",
        departamentoUnidad: persona.departamentoUnidad ?? "",
        ciudad:             persona.ciudad ?? "",
        provincia:          persona.provincia ?? "",
        codigoPostal:       persona.codigoPostal ?? "",
        esDueno:      roles.includes("DUENO"),
        esInquilino:  roles.includes("INQUILINO"),
        esGarante:    roles.includes("GARANTE"),
        esMartillero: roles.includes("MARTILLERO"),
        observaciones: persona.observaciones ?? "",
      });
    } else if (open && !persona) {
      reset({
        tipoDocumento: "DNI",
        esDueno: false, esInquilino: false, esGarante: false, esMartillero: false,
      });
    }
  }, [open, persona, reset]);

  // ── Mutaciones ──────────────────────────────────────────────────────────────

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["personas"] });
    toast.success(isEdit ? "Persona actualizada correctamente." : "Persona creada correctamente.");
    onOpenChange(false);
  };

  const createMutation = useMutation({
    mutationFn: (req: PersonaRequest) => personasApi.crear(req),
    onSuccess,
    onError: () => toast.error("No se pudo guardar la persona. ¿El número de documento ya existe?"),
  });

  const updateMutation = useMutation({
    mutationFn: (req: PersonaRequest) => personasApi.actualizar(persona!.id, req),
    onSuccess,
    onError: () => toast.error("No se pudo actualizar la persona."),
  });

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = (data: FormData) => {
    const roles: RolPersona[] = [];
    if (data.esDueno)      roles.push("DUENO");
    if (data.esInquilino)  roles.push("INQUILINO");
    if (data.esGarante)    roles.push("GARANTE");
    if (data.esMartillero) roles.push("MARTILLERO");

    const request: PersonaRequest = {
      tipoDocumento:    data.tipoDocumento,
      numeroDocumento:  data.numeroDocumento,
      nombre:           data.nombre,
      apellido:         data.apellido,
      cuil:             data.cuil || undefined,
      email:            data.email || undefined,
      telefonoPrincipal: data.telefonoPrincipal || undefined,
      telefonoAlternativo: data.telefonoAlternativo || undefined,
      fechaNacimiento:  data.fechaNacimiento || undefined,
      calle:            data.calle || undefined,
      numeroPuerta:     data.numeroPuerta || undefined,
      piso:             data.piso || undefined,
      departamentoUnidad: data.departamentoUnidad || undefined,
      ciudad:           data.ciudad || undefined,
      provincia:        data.provincia || undefined,
      codigoPostal:     data.codigoPostal || undefined,
      roles,
      observaciones:    data.observaciones || undefined,
    };

    isEdit ? updateMutation.mutate(request) : createMutation.mutate(request);
  };

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending;

  // Observar si hay error de roles (aparece en esDueno por el refine)
  const rolesError = errors.esDueno?.message;

  const Section = ({ title }: { title: string }) => (
    <div className="space-y-1 pt-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <Separator />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar persona" : "Nueva persona"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modificá los datos de la persona."
              : "Completá los datos para registrar una nueva persona en el sistema."}
          </SheetDescription>
        </SheetHeader>

        <form
          id="persona-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* ─── Sección 1: Documento ──────────────────────────────── */}
          <Section title="Documento" />

          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2">
              <FormField label="Tipo" error={errors.tipoDocumento?.message} required>
                <Controller
                  name="tipoDocumento"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={cn(errors.tipoDocumento && "border-destructive")}>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(TIPO_DOC_LABELS) as [keyof typeof TIPO_DOC_LABELS, string][]).map(
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
            <div className="col-span-3">
              <FormField label="Número" error={errors.numeroDocumento?.message} required>
                <Input
                  placeholder="20123456"
                  {...register("numeroDocumento")}
                  className={cn("font-mono", errors.numeroDocumento && "border-destructive")}
                />
              </FormField>
            </div>
          </div>

          {/* ─── Sección 2: Datos personales ───────────────────────── */}
          <Section title="Datos personales" />

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre" error={errors.nombre?.message} required>
              <Input
                placeholder="Juan"
                {...register("nombre")}
                className={cn(errors.nombre && "border-destructive")}
              />
            </FormField>
            <FormField label="Apellido" error={errors.apellido?.message} required>
              <Input
                placeholder="García"
                {...register("apellido")}
                className={cn(errors.apellido && "border-destructive")}
              />
            </FormField>
            <div className="col-span-2">
              <FormField label="Fecha de nacimiento">
                <Input type="date" {...register("fechaNacimiento")} />
              </FormField>
            </div>
          </div>

          {/* ─── Sección 3: Contacto ───────────────────────────────── */}
          <Section title="Contacto" />

          <div className="space-y-4">
            <FormField label="CUIL" error={errors.cuil?.message}>
              <Input
                placeholder="20-12345678-9"
                {...register("cuil")}
                className={cn("font-mono", errors.cuil && "border-destructive")}
              />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <Input
                type="email"
                placeholder="juan@email.com"
                {...register("email")}
                className={cn(errors.email && "border-destructive")}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Teléfono principal">
                <Input placeholder="11 2345-6789" {...register("telefonoPrincipal")} />
              </FormField>
              <FormField label="Teléfono alternativo">
                <Input placeholder="351 234-5678" {...register("telefonoAlternativo")} />
              </FormField>
            </div>
          </div>

          {/* ─── Sección 4: Domicilio ──────────────────────────────── */}
          <Section title="Domicilio" />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Calle">
                <Input placeholder="Av. Corrientes" {...register("calle")} />
              </FormField>
            </div>
            <FormField label="Número">
              <Input placeholder="1234" {...register("numeroPuerta")} />
            </FormField>
            <FormField label="Piso / Depto">
              <Input placeholder="3 A" {...register("piso")} />
            </FormField>
            <FormField label="Ciudad">
              <Input placeholder="Buenos Aires" {...register("ciudad")} />
            </FormField>
            <FormField label="Provincia">
              <Input placeholder="CABA" {...register("provincia")} />
            </FormField>
            <FormField label="Código postal">
              <Input placeholder="1043" {...register("codigoPostal")} />
            </FormField>
          </div>

          {/* ─── Sección 5: Roles ──────────────────────────────────── */}
          <Section title="Roles en el sistema" />

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { field: "esDueno",      rol: "DUENO" },
                  { field: "esInquilino",  rol: "INQUILINO" },
                  { field: "esGarante",    rol: "GARANTE" },
                  { field: "esMartillero", rol: "MARTILLERO" },
                ] as const
              ).map(({ field, rol }) => (
                <Controller
                  key={field}
                  name={field}
                  control={control}
                  render={({ field: f }) => (
                    <label
                      className={cn(
                        "flex items-center gap-3 cursor-pointer select-none",
                        "rounded-lg border px-4 py-3 transition-colors",
                        f.value
                          ? "border-[#1A4F59] bg-[#EFF7F8] text-[#1A4F59]"
                          : "border-border bg-background text-muted-foreground hover:border-[#1A4F59]/40"
                      )}
                    >
                      <Checkbox
                        checked={f.value}
                        onCheckedChange={f.onChange}
                        className="data-[state=checked]:bg-[#1A4F59] data-[state=checked]:border-[#1A4F59]"
                      />
                      <span className="text-sm font-medium">{ROL_PERSONA_LABELS[rol]}</span>
                    </label>
                  )}
                />
              ))}
            </div>
            {rolesError && (
              <p className="text-xs text-destructive">{rolesError}</p>
            )}
          </div>

          {/* ─── Sección 6: Observaciones ──────────────────────────── */}
          <Section title="Observaciones" />

          <FormField label="Notas internas">
            <Textarea
              placeholder="Información adicional relevante..."
              rows={3}
              {...register("observaciones")}
            />
          </FormField>
        </form>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="persona-form" variant="cta" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear persona"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
