import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import {
  Building2,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  HomeIcon,
  TrendingUp,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

// ── Esquema de validación ─────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

type LoginForm = z.infer<typeof loginSchema>;

// ── Componente ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      const response = await authApi.login(data);
      login(response.token, response.username, response.rol, response.tenantSchema);
      // SUPERADMIN va al panel de admin; el resto va al dashboard normal
      navigate(response.rol === "SUPERADMIN" ? "/admin" : "/", { replace: true });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          setServerError("Usuario o contraseña incorrectos. Verificá los datos e intentá de nuevo.");
        } else if (!error.response) {
          setServerError(
            "No se pudo conectar con el servidor. " +
            "Verificá que el backend esté corriendo en el puerto 8080."
          );
        } else {
          setServerError(`Error del servidor (${status ?? "desconocido"}). Intentá de nuevo.`);
        }
      } else {
        setServerError("Ocurrió un error inesperado. Intentá de nuevo.");
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ================================================================
          PANEL IZQUIERDO — Branding corporativo (visible solo en desktop)
          ================================================================ */}
      <aside
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: "#1A4F59" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Lobo Alquileres
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-5">
          <h1 className="text-5xl font-extrabold text-white leading-tight">
            Gestioná tus
            <br />
            alquileres
            <br />
            <span style={{ color: "#9DD5DB" }}>con claridad.</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-sm" style={{ color: "#CEEAED" }}>
            Contratos, cuotas y ajustes por inflación en un solo lugar.
            Diseñado para martilleros y agentes inmobiliarios argentinos.
          </p>

          {/* Features */}
          <div className="space-y-3 pt-2">
            {[
              { icon: FileText,   text: "Contratos digitales con cuotas automáticas" },
              { icon: TrendingUp, text: "Motor de ajuste IPC/ICL integrado" },
              { icon: HomeIcon,   text: "Gestión completa de inmuebles e inquilinos" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm" style={{ color: "#CEEAED" }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer del panel */}
        <p className="text-xs" style={{ color: "#6CBFC9" }}>
          © {new Date().getFullYear()} Lobo Alquileres · Sistema de gestión inmobiliaria
        </p>
      </aside>

      {/* ================================================================
          PANEL DERECHO — Formulario de login
          ================================================================ */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-background">

        {/* Logo solo visible en mobile */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <Building2 className="h-7 w-7" style={{ color: "#1A4F59" }} />
          <span className="font-bold text-xl" style={{ color: "#1A4F59" }}>
            Lobo Alquileres
          </span>
        </div>

        <div className="w-full max-w-md">

          {/* Encabezado */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#333333" }}>
              Iniciar sesión
            </h2>
            <p className="text-muted-foreground mt-2 text-base">
              Ingresá tus datos para acceder al sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* ── Error de servidor ────────────────────────────────────── */}
            {serverError && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium leading-snug">
                  {serverError}
                </p>
              </div>
            )}

            {/* ── Campo: Usuario ───────────────────────────────────────── */}
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-base font-semibold"
                style={{ color: "#333333" }}
              >
                Usuario
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresá tu usuario"
                  autoComplete="username"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  className={cn(
                    "h-12 pl-11 text-base",
                    errors.username && "border-destructive focus-visible:ring-destructive"
                  )}
                  {...register("username")}
                />
              </div>
              {errors.username && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* ── Campo: Contraseña ────────────────────────────────────── */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-base font-semibold"
                style={{ color: "#333333" }}
              >
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresá tu contraseña"
                  autoComplete="current-password"
                  className={cn(
                    "h-12 pl-11 pr-12 text-base",
                    errors.password && "border-destructive focus-visible:ring-destructive"
                  )}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                >
                  {showPassword
                    ? <EyeOff className="h-5 w-5" />
                    : <Eye className="h-5 w-5" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* ── Botón submit ─────────────────────────────────────────── */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-bold mt-2"
              variant="cta"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Ingresar al sistema"
              )}
            </Button>
          </form>
        </div>

        {/* Footer mobile */}
        <p className="text-xs text-muted-foreground mt-12 lg:hidden">
          © {new Date().getFullYear()} Lobo Alquileres
        </p>
      </main>
    </div>
  );
}
