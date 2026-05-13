import { NavLink, useNavigate } from "react-router-dom";
import {
  Building2, LayoutDashboard, Users, FileText, CreditCard,
  LogOut, ChevronRight, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

// ── Items por rol ─────────────────────────────────────────────────────────────

const NAV_TENANT = [
  { to: "/",          icon: LayoutDashboard, label: "Dashboard",    end: true  },
  { to: "/inmuebles", icon: Building2,        label: "Inmuebles",   end: false },
  { to: "/personas",  icon: Users,            label: "Personas",    end: false },
  { to: "/contratos", icon: FileText,         label: "Contratos",   end: false },
  { to: "/cuotas",    icon: CreditCard,        label: "Cuotas y cobros", end: false },
];

const NAV_SUPERADMIN = [
  { to: "/admin", icon: ShieldCheck, label: "Inmobiliarias", end: true },
];

// ── Componente ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const navigate = useNavigate();
  const { username, rol, logout } = useAuthStore();

  const isSuperAdmin = rol === "SUPERADMIN";
  const navItems     = isSuperAdmin ? NAV_SUPERADMIN : NAV_TENANT;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className="flex h-full w-60 shrink-0 flex-col"
      style={{ backgroundColor: "#1A4F59" }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
          {isSuperAdmin
            ? <ShieldCheck className="h-5 w-5 text-white" />
            : <Building2  className="h-5 w-5 text-white" />
          }
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight">Lobo</p>
          <p className="text-xs leading-tight" style={{ color: "#9DD5DB" }}>
            {isSuperAdmin ? "Admin SaaS" : "Alquileres"}
          </p>
        </div>
      </div>

      {/* ── Navegación ───────────────────────────────────────────────── */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-white/60")} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="h-4 w-4 text-white/50" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Usuario + Logout ─────────────────────────────────────────── */}
      <div className="border-t border-white/10 px-3 py-4 space-y-2">
        <div className="rounded-lg bg-white/10 px-3 py-2.5">
          <p className="text-sm font-semibold text-white truncate">{username}</p>
          <p className="text-xs mt-0.5" style={{ color: "#9DD5DB" }}>
            {isSuperAdmin ? "Super Administrador" : rol}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
