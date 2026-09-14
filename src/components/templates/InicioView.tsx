"use client";

import { Database, Lock, MapPin } from "lucide-react";
import { PageContainer } from "@/components/templates/PageContainer";
import { RouteCard } from "@/components/molecules/RouteCard";
import { Badge } from "@/components/atoms/Badge";
import { leavesOf } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFilteredNavigation } from "@/hooks/useNavigation";
import { useAppSelector } from "@/store/hooks";

export function InicioView() {
  const { data: user } = useCurrentUser();
  const { activeSede, hasMultipleSedes, isGlobalAdmin } = useAuth();
  const mode = useAppSelector((s) => s.systemConfig.dataSourceMode);
  const navigation = useFilteredNavigation();
  const routes = leavesOf(navigation).filter((r) => r.href !== "/inicio");

  return (
    <PageContainer>
      {/* Hero */}
      <section className="mb-10 flex flex-col items-center gap-5 pt-6 text-center">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "var(--sb-mark-gradient)", boxShadow: "var(--sb-mark-shadow)" }}
        >
          <svg width="34" height="34" viewBox="0 0 17 17" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="5.5" height="5.5" rx="1.4" fill="white" />
            <rect x="9.5" y="2" width="5.5" height="5.5" rx="1.4" fill="white" fillOpacity="0.42" />
            <rect x="2" y="9.5" width="5.5" height="5.5" rx="1.4" fill="white" fillOpacity="0.42" />
            <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1.4" fill="white" />
          </svg>
        </div>

        <div className="max-w-2xl">
          <h1
            className="text-[26px] font-bold sm:text-[30px]"
            style={{ color: "var(--sect-title)", letterSpacing: "-0.03em" }}
          >
            Sistema Web de Asignación de Citas <span style={{ color: "var(--atom-blue-500)" }}>SWAC</span>
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: "var(--sect-sub)" }}>
            Hola, <strong style={{ color: "var(--list-text)" }}>{user?.primerNombre}</strong>. Gestiona citas, portería,
            patio y muelles de descargue desde un solo lugar.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {user && (
            <Badge tone={user.roleTone} size="sm">
              {user.roleLabel}
            </Badge>
          )}
          {user?.nitProveedor && (
            <Badge tone="slate" size="sm">
              NIT {user.nitProveedor}
            </Badge>
          )}
          {activeSede && (
            <Badge tone="blue" size="sm">
              {hasMultipleSedes ? <MapPin size={11} /> : <Lock size={11} />}
              {isGlobalAdmin ? `Sede activa: ${activeSede.nombre} · acceso total` : activeSede.nombre}
            </Badge>
          )}
          <Badge tone={mode === "MOCK" ? "amber" : "green"} size="sm">
            <Database size={11} />
            {mode === "MOCK" ? "Datos de demostración" : "API real"}
          </Badge>
        </div>
      </section>

      {/* Routes */}
      <section aria-label="Accesos rápidos">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--sect-sub)" }}>
            Módulos disponibles para tu perfil
          </h2>
          <span className="text-[12px]" style={{ color: "var(--result-text)" }}>
            {routes.length} {routes.length === 1 ? "módulo" : "módulos"}
          </span>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <RouteCard key={route.href} route={route} />
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
