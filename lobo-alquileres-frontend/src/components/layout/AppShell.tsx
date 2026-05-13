import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

/**
 * AppShell — envuelve todas las páginas protegidas con el layout principal.
 *
 * Estructura:
 *   ┌──────────┬────────────────────────────────────┐
 *   │  Sidebar │  <Outlet /> — página actual        │
 *   │  (240px) │  (flex-1, scroll independiente)    │
 *   └──────────┴────────────────────────────────────┘
 *
 * React Router renderiza el componente hijo en el <Outlet />.
 * El Sidebar siempre está visible; el contenido scrollea por separado.
 */
export default function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      {/* Área de contenido principal — scrollable de forma independiente */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
