import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Building2, Plus, PowerOff, Power, Trash2, KeyRound,
  Eye, EyeOff, Loader2, ShieldCheck, CalendarDays,
  CheckCircle2, Clock, DollarSign, History, X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  tenantsApi,
  type TenantRequest,
  type TenantResponse,
  type PagoSuscripcionRequest,
  type PagoSuscripcionResponse,
} from "@/api/tenants";

// ── Schemas ───────────────────────────────────────────────────────────────────

const nuevoTenantSchema = z.object({
  nombre:        z.string().min(2, "Mínimo 2 caracteres").max(200),
  slug:          z.string()
                   .min(3).max(50)
                   .regex(/^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$/, "Solo minúsculas, números y guiones"),
  email:         z.string().email("Email inválido").optional().or(z.literal("")),
  adminUsername: z.string().min(3).max(50),
  adminPassword: z.string().min(8, "Mínimo 8 caracteres"),
  plan:          z.enum(["BASICO", "PROFESIONAL", "ENTERPRISE"]),
  fechaVencimiento: z.string().optional(),
  observaciones: z.string().optional(),
});

const cambiarPasswordSchema = z.object({
  nuevaPassword: z.string().min(8, "Mínimo 8 caracteres"),
});

const pagoSchema = z.object({
  tipoPago:     z.enum(["MENSUAL", "ANUAL"]),
  mesPago:      z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato inválido"),
  monto:        z.coerce.number().min(0, "El monto no puede ser negativo"),
  metodo:       z.string().min(1, "Seleccioná un método"),
  fechaPago:    z.string().optional(),
  observaciones: z.string().optional(),
});

type NuevoTenantForm     = z.infer<typeof nuevoTenantSchema>;
type CambiarPasswordForm = z.infer<typeof cambiarPasswordSchema>;
type PagoForm            = z.infer<typeof pagoSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function mesActual() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMes(mes: string) {
  const [anio, m] = mes.split("-");
  const nombres = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${nombres[parseInt(m) - 1]} ${anio}`;
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return activo
    ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">Activo</Badge>
    : <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">Inactivo</Badge>;
}

function PagoBadge({ pagaMesActual, fechaUltimoPago }: { pagaMesActual: boolean; fechaUltimoPago: string | null }) {
  if (pagaMesActual) {
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-700">Al día</span>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium text-amber-600">Pendiente</span>
      </div>
      {fechaUltimoPago && (
        <p className="text-xs text-muted-foreground mt-0.5">
          Último: {new Date(fechaUltimoPago).toLocaleDateString("es-AR")}
        </p>
      )}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const qc = useQueryClient();

  const [dialogNuevo,    setDialogNuevo]    = useState(false);
  const [dialogPassword, setDialogPassword] = useState<TenantResponse | null>(null);
  const [dialogEliminar, setDialogEliminar] = useState<TenantResponse | null>(null);
  const [dialogPago,     setDialogPago]     = useState<TenantResponse | null>(null);
  const [dialogHistorial,setDialogHistorial]= useState<TenantResponse | null>(null);
  const [showPassword,    setShowPassword]    = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["admin", "tenants"],
    queryFn: tenantsApi.listar,
  });

  const { data: historialPagos = [], isFetching: cargandoHistorial } = useQuery({
    queryKey: ["admin", "pagos", dialogHistorial?.id],
    queryFn: () => tenantsApi.listarPagos(dialogHistorial!.id),
    enabled: !!dialogHistorial,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const crearMut = useMutation({
    mutationFn: tenantsApi.crear,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      setDialogNuevo(false);
      toast.success("Inmobiliaria creada correctamente.");
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? "Error al crear la inmobiliaria."),
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => tenantsApi.toggleActivo(id),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast.success(`Inmobiliaria ${updated.activo ? "activada" : "desactivada"}.`);
    },
    onError: () => toast.error("Error al cambiar el estado."),
  });

  const passwordMut = useMutation({
    mutationFn: ({ id, pass }: { id: string; pass: string }) =>
      tenantsApi.cambiarPassword(id, pass),
    onSuccess: () => {
      setDialogPassword(null);
      toast.success("Contraseña actualizada.");
    },
    onError: () => toast.error("Error al cambiar la contraseña."),
  });

  const eliminarMut = useMutation({
    mutationFn: (id: string) => tenantsApi.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      setDialogEliminar(null);
      toast.success("Inmobiliaria eliminada.");
    },
    onError: () => toast.error("Error al eliminar la inmobiliaria."),
  });

  const pagarMut = useMutation({
    mutationFn: ({ id, req }: { id: string; req: PagoSuscripcionRequest }) =>
      tenantsApi.registrarPago(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      qc.invalidateQueries({ queryKey: ["admin", "pagos"] });
      setDialogPago(null);
      toast.success("Pago registrado correctamente.");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error ?? "Error al registrar el pago."),
  });

  const eliminarPagoMut = useMutation({
    mutationFn: ({ tenantId, pagoId }: { tenantId: string; pagoId: string }) =>
      tenantsApi.eliminarPago(tenantId, pagoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      qc.invalidateQueries({ queryKey: ["admin", "pagos", dialogHistorial?.id] });
      toast.success("Pago eliminado.");
    },
    onError: () => toast.error("Error al eliminar el pago."),
  });

  // ── Forms ─────────────────────────────────────────────────────────────────

  const nuevoForm = useForm<NuevoTenantForm>({
    resolver: zodResolver(nuevoTenantSchema),
    defaultValues: { plan: "BASICO" },
  });

  const passForm = useForm<CambiarPasswordForm>({
    resolver: zodResolver(cambiarPasswordSchema),
  });

  const pagoForm = useForm<PagoForm>({
    resolver: zodResolver(pagoSchema),
    defaultValues: { tipoPago: "MENSUAL", mesPago: mesActual(), monto: 0, metodo: "" },
  });

  const tipoPagoActual = pagoForm.watch("tipoPago");

  const onCrear = (data: NuevoTenantForm) => {
    const req: TenantRequest = {
      ...data,
      email: data.email || undefined,
      fechaVencimiento: data.fechaVencimiento || undefined,
    };
    crearMut.mutate(req);
  };

  const onCambiarPassword = (data: CambiarPasswordForm) => {
    if (!dialogPassword) return;
    passwordMut.mutate({ id: dialogPassword.id, pass: data.nuevaPassword });
  };

  const onRegistrarPago = (data: PagoForm) => {
    if (!dialogPago) return;
    pagarMut.mutate({
      id: dialogPago.id,
      req: {
        tipoPago: data.tipoPago,
        mesPago: data.mesPago,
        monto: data.monto,
        metodo: data.metodo || undefined,
        fechaPago: data.fechaPago || undefined,
        observaciones: data.observaciones || undefined,
      },
    });
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const pagaronEsteMes = tenants.filter(t => t.pagaMesActual).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
            <ShieldCheck className="h-5 w-5 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-carbon">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground">
              Gestioná las inmobiliarias clientes del sistema
            </p>
          </div>
        </div>
        <Button onClick={() => { nuevoForm.reset({ plan: "BASICO" }); setDialogNuevo(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva inmobiliaria
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total clientes",      value: tenants.length,                        color: "text-carbon" },
          { label: "Activos",             value: tenants.filter(t => t.activo).length,   color: "text-emerald-600" },
          { label: "Inactivos",           value: tenants.filter(t => !t.activo).length,  color: "text-red-600" },
          { label: "Pagaron este mes",    value: pagaronEsteMes,                         color: pagaronEsteMes === tenants.length && tenants.length > 0 ? "text-emerald-600" : "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Inmobiliaria</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Pago {formatMes(mesActual())}</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No hay inmobiliarias registradas todavía.
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-carbon">{t.nombre}</p>
                      <p className="text-xs text-muted-foreground font-mono">{t.schemaName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{t.adminUsername}</p>
                      {t.email && <p className="text-xs text-muted-foreground">{t.email}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    {t.fechaVencimiento ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(t.fechaVencimiento).toLocaleDateString("es-AR")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin vencimiento</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <PagoBadge
                      pagaMesActual={t.pagaMesActual}
                      fechaUltimoPago={t.fechaUltimoPago}
                    />
                  </TableCell>
                  <TableCell>
                    <EstadoBadge activo={t.activo} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">

                      {/* Registrar pago */}
                      <Button
                        size="icon" variant="ghost"
                        title="Registrar pago mensual"
                        onClick={() => {
                          pagoForm.reset({ mesPago: mesActual(), monto: 0, metodo: "" });
                          setDialogPago(t);
                        }}
                        disabled={t.pagaMesActual}
                        className={t.pagaMesActual ? "opacity-40" : ""}
                      >
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                      </Button>

                      {/* Historial de pagos */}
                      <Button
                        size="icon" variant="ghost"
                        title="Ver historial de pagos"
                        onClick={() => setDialogHistorial(t)}
                      >
                        <History className="h-4 w-4 text-blue-500" />
                      </Button>

                      {/* Cambiar contraseña */}
                      <Button
                        size="icon" variant="ghost"
                        title="Cambiar contraseña"
                        onClick={() => { passForm.reset(); setDialogPassword(t); }}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>

                      {/* Activar / Desactivar */}
                      <Button
                        size="icon"
                        variant={t.activo ? "ghost" : "outline"}
                        title={t.activo ? "Desactivar acceso" : "Activar acceso"}
                        onClick={() => toggleMut.mutate(t.id)}
                        disabled={toggleMut.isPending}
                      >
                        {t.activo
                          ? <PowerOff className="h-4 w-4 text-red-500" />
                          : <Power    className="h-4 w-4 text-emerald-500" />
                        }
                      </Button>

                      {/* Eliminar */}
                      <Button
                        size="icon" variant="ghost"
                        title="Eliminar inmobiliaria"
                        onClick={() => setDialogEliminar(t)}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Dialog: Nueva inmobiliaria ────────────────────────────────────── */}
      <Dialog open={dialogNuevo} onOpenChange={setDialogNuevo}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva inmobiliaria</DialogTitle>
            <DialogDescription>
              Se creará un schema de base de datos aislado y un usuario administrador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={nuevoForm.handleSubmit(onCrear)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nombre <span className="text-destructive">*</span></Label>
              <Input placeholder="Ej: Remax Centro" {...nuevoForm.register("nombre")} />
              {nuevoForm.formState.errors.nombre && (
                <p className="text-xs text-destructive">{nuevoForm.formState.errors.nombre.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Slug (identificador único) <span className="text-destructive">*</span></Label>
              <Input
                placeholder="ej: remax-centro"
                {...nuevoForm.register("slug")}
                onChange={(e) => nuevoForm.setValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
              <p className="text-xs text-muted-foreground">
                Schema: <code className="bg-muted px-1 rounded">tenant_{nuevoForm.watch("slug") || "slug"}</code>
              </p>
              {nuevoForm.formState.errors.slug && (
                <p className="text-xs text-destructive">{nuevoForm.formState.errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Email de contacto</Label>
              <Input type="email" placeholder="info@inmobiliaria.com" {...nuevoForm.register("email")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Usuario admin <span className="text-destructive">*</span></Label>
                <Input placeholder="admin_remax" {...nuevoForm.register("adminUsername")} />
                {nuevoForm.formState.errors.adminUsername && (
                  <p className="text-xs text-destructive">{nuevoForm.formState.errors.adminUsername.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Contraseña admin <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    {...nuevoForm.register("adminPassword")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {nuevoForm.formState.errors.adminPassword && (
                  <p className="text-xs text-destructive">{nuevoForm.formState.errors.adminPassword.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plan</Label>
                <select {...nuevoForm.register("plan")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="BASICO">Básico</option>
                  <option value="PROFESIONAL">Profesional</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de vencimiento</Label>
                <Input type="date" {...nuevoForm.register("fechaVencimiento")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Observaciones</Label>
              <Input placeholder="Notas internas..." {...nuevoForm.register("observaciones")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogNuevo(false)}>Cancelar</Button>
              <Button type="submit" disabled={crearMut.isPending}>
                {crearMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear inmobiliaria
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Registrar pago ────────────────────────────────────────── */}
      <Dialog open={!!dialogPago} onOpenChange={(o) => !o && setDialogPago(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              Pago mensual de <strong>{dialogPago?.nombre}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={pagoForm.handleSubmit(onRegistrarPago)} className="space-y-4 pt-2">

            {/* Toggle Mensual / Anual */}
            <div className="space-y-1.5">
              <Label>Tipo de pago</Label>
              <div className="flex rounded-lg border overflow-hidden">
                {(["MENSUAL", "ANUAL"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => pagoForm.setValue("tipoPago", tipo)}
                    className={[
                      "flex-1 py-2 text-sm font-medium transition-colors",
                      tipoPagoActual === tipo
                        ? "bg-teal-700 text-white"
                        : "bg-background text-muted-foreground hover:bg-muted",
                    ].join(" ")}
                  >
                    {tipo === "MENSUAL" ? "Mensual" : "Anual (12 meses)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  {tipoPagoActual === "ANUAL" ? "Mes de inicio" : "Mes"}
                  {" "}<span className="text-destructive">*</span>
                </Label>
                <Input type="month" {...pagoForm.register("mesPago")} />
                {tipoPagoActual === "ANUAL" && (
                  <p className="text-xs text-muted-foreground">Cubre 12 meses desde este mes</p>
                )}
                {pagoForm.formState.errors.mesPago && (
                  <p className="text-xs text-destructive">{pagoForm.formState.errors.mesPago.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>
                  {tipoPagoActual === "ANUAL" ? "Monto total anual ($)" : "Monto ($)"}
                  {" "}<span className="text-destructive">*</span>
                </Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" {...pagoForm.register("monto")} />
                {tipoPagoActual === "ANUAL" && pagoForm.watch("monto") > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ${(pagoForm.watch("monto") / 12).toFixed(2)}/mes
                  </p>
                )}
                {pagoForm.formState.errors.monto && (
                  <p className="text-xs text-destructive">{pagoForm.formState.errors.monto.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Método de pago <span className="text-destructive">*</span></Label>
              <select {...pagoForm.register("metodo")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="">Seleccioná...</option>
                <option value="Transferencia bancaria">Transferencia bancaria</option>
                <option value="Efectivo">Efectivo</option>
                <option value="MercadoPago">MercadoPago</option>
                <option value="Débito automático">Débito automático</option>
                <option value="Otro">Otro</option>
              </select>
              {pagoForm.formState.errors.metodo && (
                <p className="text-xs text-destructive">{pagoForm.formState.errors.metodo.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Fecha de pago</Label>
              <Input type="date" {...pagoForm.register("fechaPago")} />
            </div>

            <div className="space-y-1.5">
              <Label>Observaciones</Label>
              <Input placeholder="Ej: transferencia nro 123456..." {...pagoForm.register("observaciones")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogPago(null)}>Cancelar</Button>
              <Button type="submit" disabled={pagarMut.isPending}>
                {pagarMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Registrar pago
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Historial de pagos ────────────────────────────────────── */}
      <Dialog open={!!dialogHistorial} onOpenChange={(o) => !o && setDialogHistorial(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historial de pagos — {dialogHistorial?.nombre}
            </DialogTitle>
          </DialogHeader>

          {cargandoHistorial ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : historialPagos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin pagos registrados todavía.
            </p>
          ) : (() => {
            // Agrupar: anuales comparten grupoId, mensuales son individuales
            const filas: { key: string; pagos: PagoSuscripcionResponse[] }[] = [];
            const gruposVistos = new Set<string>();
            for (const p of historialPagos) {
              if (p.grupoId) {
                if (!gruposVistos.has(p.grupoId)) {
                  gruposVistos.add(p.grupoId);
                  filas.push({
                    key: p.grupoId,
                    pagos: historialPagos.filter(x => x.grupoId === p.grupoId),
                  });
                }
              } else {
                filas.push({ key: p.id, pagos: [p] });
              }
            }
            return (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Fecha pago</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filas.map(({ key, pagos: grupo }) => {
                      const esAnual = grupo.length > 1;
                      const primero = grupo[0];
                      const ultimo  = grupo[grupo.length - 1];
                      const total   = grupo.reduce((s, x) => s + x.monto, 0);
                      return (
                        <TableRow key={key}>
                          <TableCell>
                            {esAnual ? (
                              <div>
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 mb-0.5">
                                  Anual
                                </Badge>
                                <p className="text-sm font-medium">
                                  {formatMes(primero.mesPago)} – {formatMes(ultimo.mesPago)}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm font-medium">{formatMes(primero.mesPago)}</p>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {primero.metodo ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(primero.fechaPago).toLocaleDateString("es-AR")}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon" variant="ghost"
                              title={esAnual ? "Eliminar pago anual completo" : "Eliminar pago"}
                              onClick={() => eliminarPagoMut.mutate({
                                tenantId: dialogHistorial!.id,
                                pagoId: primero.id,
                              })}
                              disabled={eliminarPagoMut.isPending}
                            >
                              <X className="h-3.5 w-3.5 text-red-400" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Cambiar contraseña ────────────────────────────────────── */}
      <Dialog open={!!dialogPassword} onOpenChange={(o) => !o && setDialogPassword(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              Nueva contraseña para el admin de <strong>{dialogPassword?.nombre}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={passForm.handleSubmit(onCambiarPassword)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nueva contraseña <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  {...passForm.register("nuevaPassword")}
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passForm.formState.errors.nuevaPassword && (
                <p className="text-xs text-destructive">{passForm.formState.errors.nuevaPassword.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogPassword(null)}>Cancelar</Button>
              <Button type="submit" disabled={passwordMut.isPending}>
                {passwordMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog: Confirmar eliminar ──────────────────────────────── */}
      <AlertDialog open={!!dialogEliminar} onOpenChange={(o) => !o && setDialogEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar inmobiliaria?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán el registro y el usuario admin de{" "}
              <strong>{dialogEliminar?.nombre}</strong>. Los datos del schema{" "}
              <code className="bg-muted px-1 rounded">{dialogEliminar?.schemaName}</code>{" "}
              se mantienen en la base de datos para posible recovery.
              <br /><br />
              Esta acción <strong>no se puede deshacer</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => dialogEliminar && eliminarMut.mutate(dialogEliminar.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
