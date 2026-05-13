import { useQuery } from "@tanstack/react-query";
import { Building2, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { inmuebleApi } from "@/api/inmuebles";
import { useAuthStore } from "@/store/authStore";
import { ESTADO_INMUEBLE_LABELS, type InmuebleResponse } from "@/types";

// ── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  loading?: boolean;
}

function KpiCard({ title, value, subtitle, icon: Icon, iconColor, iconBg, loading }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <Skeleton className="h-9 w-16" />
        ) : (
          <>
            <div className="text-3xl font-bold" style={{ color: "#333333" }}>{value}</div>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { username } = useAuthStore();

  const { data: inmuebles = [], isLoading } = useQuery<InmuebleResponse[]>({
    queryKey: ["inmuebles"],
    queryFn: inmuebleApi.listarActivos,
  });

  // KPIs calculados del lado del cliente a partir del listado
  const disponibles = inmuebles.filter((i) => i.estado === "DISPONIBLE").length;
  const alquilados  = inmuebles.filter((i) => i.estado === "ALQUILADO").length;
  const enReparacion = inmuebles.filter((i) => i.estado === "EN_REPARACION").length;

  // Últimos inmuebles disponibles para mostrar en la tabla rápida
  const ultimos = inmuebles.slice(0, 5);

  return (
    <div className="p-8 space-y-8">
      {/* ── Saludo ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#333333" }}>
          Bienvenido, {username} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Resumen del portfolio inmobiliario al día de hoy.
        </p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Portfolio total"
          value={inmuebles.length}
          subtitle="Inmuebles activos en el sistema"
          icon={Building2}
          iconColor="text-[#1A4F59]"
          iconBg="bg-[#EFF7F8]"
          loading={isLoading}
        />
        <KpiCard
          title="Disponibles"
          value={disponibles}
          subtitle="Listos para alquilar"
          icon={CheckCircle2}
          iconColor="text-green-700"
          iconBg="bg-green-50"
          loading={isLoading}
        />
        <KpiCard
          title="Alquilados"
          value={alquilados}
          subtitle="Con contrato activo"
          icon={TrendingUp}
          iconColor="text-[#A92F2F]"
          iconBg="bg-red-50"
          loading={isLoading}
        />
        <KpiCard
          title="En reparación"
          value={enReparacion}
          subtitle="Temporalmente fuera de oferta"
          icon={AlertTriangle}
          iconColor="text-orange-700"
          iconBg="bg-orange-50"
          loading={isLoading}
        />
      </div>

      {/* ── Vista rápida del portfolio ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Portfolio reciente</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : ultimos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">Todavía no hay inmuebles cargados.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ir a <span className="font-semibold text-[#1A4F59]">Inmuebles</span> para agregar el primero.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {ultimos.map((inmueble) => (
                <div key={inmueble.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF7F8]">
                    <Building2 className="h-4 w-4 text-[#1A4F59]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#333333" }}>
                      {inmueble.direccionCompleta}
                    </p>
                    <p className="text-xs text-muted-foreground">{inmueble.duenoNombreCompleto}</p>
                  </div>
                  <Badge
                    variant={
                      inmueble.estado === "DISPONIBLE" ? "disponible"
                        : inmueble.estado === "ALQUILADO" ? "alquilado"
                        : inmueble.estado === "RESERVADO" ? "reservado"
                        : inmueble.estado === "EN_REPARACION" ? "reparacion"
                        : "inactivo"
                    }
                  >
                    {ESTADO_INMUEBLE_LABELS[inmueble.estado]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
