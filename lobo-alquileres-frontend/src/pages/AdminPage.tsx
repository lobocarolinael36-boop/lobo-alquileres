import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Building2, Plus, PowerOff, Power, Trash2, KeyRound,
  Eye, EyeOff, Loader2, ShieldCheck, CalendarDays,
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

import { tenantsApi, type TenantRequest, type TenantResponse } from "@/api/tenants";

// ── Esquemas de validación ────────────────────────────────────────────────────

const nuevoTenantSchema = z.object({
  nombre:        z.string().min(2, "Mínimo 2 caracteres").max(200),
  slug:          z.string()
                   .min(3, "Mínimo 3 caracteres")
                   .max(50, "Máximo 50 caracteres")
                   .regex(/^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$/, "Solo minúsculas, números y guiones"),
  email:         z.string().email("Email inválido").optional().or(z.literal("")),
  adminUsername: z.string().min(3, "Mínimo 3 caracteres").max(50),
  adminPassword: z.string().min(8, "Mínimo 8 caracteres"),
  plan:          z.enum(["BASICO", "PROFESIONAL", "ENTERPRISE"]),
  fechaVencimiento: z.string().optional(),
  observaciones: z.string().optional(),
});

const cambiarPasswordSchema = z.object({
  nuevaPassword: z.string().min(8, "Mínimo 8 caracteres"),
});

type NuevoTenantForm     = z.infer<typeof nuevoTenantSchema>;
type CambiarPasswordForm = z.infer<typeof cambiarPasswordSchema>;

// ── Helper: badge de estado ───────────────────────────────────────────────────

function EstadoBadge({ activo }: { activo: boolean }) {
  return activo
    ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">Activo</Badge>
    : <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">Inactivo</Badge>;
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const qc = useQueryClient();

  const [dialogNuevo,      setDialogNuevo]      = useState(false);
  const [dialogPassword,   setDialogPassword]   = useState<TenantResponse | null>(null);
  const [dialogEliminar,   setDialogEliminar]   = useState<TenantResponse | null>(null);
  const [showPassword,     setShowPassword]     = useState(false);
  const [showNewPassword,  setShowNewPassword]  = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["admin", "tenants"],
    queryFn: tenantsApi.listar,
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

  // ── Forms ─────────────────────────────────────────────────────────────────

  const nuevoForm = useForm<NuevoTenantForm>({
    resolver: zodResolver(nuevoTenantSchema),
    defaultValues: { plan: "BASICO" },
  });

  const passForm = useForm<CambiarPasswordForm>({
    resolver: zodResolver(cambiarPasswordSchema),
  });

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
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total clientes",  value: tenants.length,                         color: "text-carbon" },
          { label: "Activos",         value: tenants.filter(t => t.activo).length,    color: "text-emerald-600" },
          { label: "Inactivos",       value: tenants.filter(t => !t.activo).length,   color: "text-red-600" },
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
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
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
                    <EstadoBadge activo={t.activo} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
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
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label>Nombre de la inmobiliaria <span className="text-destructive">*</span></Label>
              <Input placeholder="Ej: Remax Centro" {...nuevoForm.register("nombre")} />
              {nuevoForm.formState.errors.nombre && (
                <p className="text-xs text-destructive">{nuevoForm.formState.errors.nombre.message}</p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label>
                Slug (identificador único) <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="ej: remax-centro"
                {...nuevoForm.register("slug")}
                onChange={(e) => {
                  nuevoForm.setValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Se usará como nombre del schema: <code className="bg-muted px-1 rounded">tenant_{nuevoForm.watch("slug") || "slug"}</code>
              </p>
              {nuevoForm.formState.errors.slug && (
                <p className="text-xs text-destructive">{nuevoForm.formState.errors.slug.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label>Email de contacto</Label>
              <Input type="email" placeholder="info@inmobiliaria.com" {...nuevoForm.register("email")} />
            </div>

            {/* Admin username + password */}
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {nuevoForm.formState.errors.adminPassword && (
                  <p className="text-xs text-destructive">{nuevoForm.formState.errors.adminPassword.message}</p>
                )}
              </div>
            </div>

            {/* Plan + Vencimiento */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plan</Label>
                <select
                  {...nuevoForm.register("plan")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
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

            {/* Observaciones */}
            <div className="space-y-1.5">
              <Label>Observaciones</Label>
              <Input placeholder="Notas internas..." {...nuevoForm.register("observaciones")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogNuevo(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crearMut.isPending}>
                {crearMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear inmobiliaria
              </Button>
            </DialogFooter>
          </form>
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
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passForm.formState.errors.nuevaPassword && (
                <p className="text-xs text-destructive">{passForm.formState.errors.nuevaPassword.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogPassword(null)}>
                Cancelar
              </Button>
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
