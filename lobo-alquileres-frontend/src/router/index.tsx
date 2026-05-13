import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

// Layouts
import AppShell from "@/components/layout/AppShell";

// Páginas públicas
import LoginPage from "@/pages/LoginPage";

// Páginas protegidas — app normal (tenant users)
import DashboardPage  from "@/pages/DashboardPage";
import InmueblesPage  from "@/pages/InmueblesPage";
import PersonasPage   from "@/pages/PersonasPage";
import ContratosPage  from "@/pages/ContratosPage";
import CuotasPage     from "@/pages/CuotasPage";

// Panel de superadmin
import AdminPage from "@/pages/AdminPage";

// ── Guardias de ruta ──────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const rol = useAuthStore((s) => s.rol);
  if (isAuthenticated) return <Navigate to={rol === "SUPERADMIN" ? "/admin" : "/"} replace />;
  return <>{children}</>;
}

/** Solo permite acceso a usuarios con rol SUPERADMIN */
function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, rol } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (rol !== "SUPERADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Bloquea el acceso al dashboard normal para SUPERADMIN (no tienen datos de tenant) */
function RequireTenant({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, rol } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (rol === "SUPERADMIN") return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

// ── Árbol de rutas ────────────────────────────────────────────────────────────

const router = createBrowserRouter([
  // ── Login ─────────────────────────────────────────────────────────────────
  {
    path: "/login",
    element: (
      <RequireGuest>
        <LoginPage />
      </RequireGuest>
    ),
  },

  // ── Panel Superadmin ──────────────────────────────────────────────────────
  {
    path: "/admin",
    element: (
      <RequireSuperAdmin>
        <AppShell />
      </RequireSuperAdmin>
    ),
    children: [
      { index: true, element: <AdminPage /> },
    ],
  },

  // ── App de inmobiliaria (tenant users) ────────────────────────────────────
  {
    path: "/",
    element: (
      <RequireTenant>
        <AppShell />
      </RequireTenant>
    ),
    children: [
      { index: true,           element: <DashboardPage /> },
      { path: "inmuebles",     element: <InmueblesPage /> },
      { path: "personas",      element: <PersonasPage /> },
      { path: "contratos",     element: <ContratosPage /> },
      { path: "cuotas",        element: <CuotasPage /> },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  { path: "*", element: <Navigate to="/" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
