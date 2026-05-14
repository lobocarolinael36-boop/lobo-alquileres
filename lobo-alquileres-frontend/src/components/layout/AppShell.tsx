import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

/**
 * AppShell — layout principal con sidebar responsive.
 *
 * Desktop (md+):
 *   ┌──────────┬────────────────────────────────────┐
 *   │  Sidebar │  <Outlet />                        │
 *   │  (240px) │                                    │
 *   └──────────┴────────────────────────────────────┘
 *
 * Mobile (<md):
 *   ┌────────────────────────────────────────────────┐
 *   │  ☰  Lobo Alquileres  (top bar)                │
 *   ├────────────────────────────────────────────────┤
 *   │  <Outlet />                                    │
 *   └────────────────────────────────────────────────┘
 *   El sidebar se abre como panel lateral (Sheet).
 */
export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Sidebar desktop — visible solo en md+ ─────────────────────── */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* ── Sidebar mobile — Sheet que se desliza desde la izquierda ───── */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="p-0 w-60 border-0 [&>button]:hidden"
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ── Columna derecha: top bar (mobile) + contenido ─────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar — solo visible en mobile */}
        <header
          className="flex items-center gap-3 px-4 py-3 md:hidden shrink-0"
          style={{ backgroundColor: "#1A4F59" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-white hover:bg-white/10 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-bold text-sm">Lobo</span>
            <span className="text-xs" style={{ color: "#9DD5DB" }}>Alquileres</span>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
