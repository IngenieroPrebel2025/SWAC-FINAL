"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Surface } from "@/components/atoms/Surface";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { JsonBlock } from "@/components/atoms/JsonBlock";
import { Spinner } from "@/components/atoms/Spinner";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { decodeJwtPayload } from "@/lib/auth/jwt";
import { getInitials } from "@/lib/format";
import { rolInfo } from "@/lib/status";
import type { SesionUsuario, Usuario } from "@/types";

interface SessionConsoleProps {
  session: SesionUsuario;
  usuarios: Usuario[];
  impersonatingId: string | null;
  onImpersonate: (usuario: Usuario) => void;
}

const POLITICAS = [
  {
    titulo: "Aislamiento de proveedores",
    detalle: "Con rol PROVEEDOR los adaptadores filtran citas y órdenes exclusivamente por su proveedorId.",
  },
  {
    titulo: "Aislamiento multi-sede",
    detalle: "Si sedesAsignadasIds no está vacío, las consultas de muelles y citas se restringen a esas sedes (403 en backend).",
  },
  {
    titulo: "Permisos granulares",
    detalle: "Los permisos especiales por recurso y scope (p. ej. un muelle) prevalecen sobre los permisos del rol.",
  },
  {
    titulo: "Trazabilidad",
    detalle: "El token viaja como Authorization: Bearer junto con X-Active-Sede y X-User-Role en cada petición.",
  },
];

/** Simulador de perfiles + inspector del JWT y reglas de aislamiento. */
export function SessionConsole({ session, usuarios, impersonatingId, onImpersonate }: SessionConsoleProps) {
  const claims = {
    ...(decodeJwtPayload(session.token) ?? {}),
    expiraEn: session.expiraEn,
    permisos: session.permisosEfectivos,
  };

  return (
    <div className="space-y-5">
      <Surface className="p-5">
        <SectionHeading
          title="Simulador de sesión"
          description="Evalúa la plataforma bajo distintos niveles de autorización iniciando sesión como otro perfil."
          className="mb-4"
        />
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {usuarios.map((u) => {
            const current = u.id === session.usuario.id;
            const rol = rolInfo(u.rolCodigo);
            return (
              <li key={u.id}>
                <button
                  type="button"
                  disabled={current || !u.activo || Boolean(impersonatingId)}
                  onClick={() => onImpersonate(u)}
                  className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors enabled:hover:border-[var(--card-border-hover)] disabled:cursor-default"
                  style={{
                    background: current ? "var(--chip-bg-active)" : "var(--inset-bg)",
                    borderColor: current ? "var(--chip-border-active)" : "var(--inset-border)",
                    opacity: u.activo ? 1 : 0.55,
                  }}
                >
                  <Avatar initials={getInitials(u.nombreCompleto)} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold" style={{ color: "var(--list-text)" }}>
                      {u.nombreCompleto}
                    </span>
                    <span className="block truncate text-[11px]" style={{ color: "var(--list-text-sub)" }}>
                      {u.email}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge size="sm" tone={rol.tone}>
                        {rol.label}
                      </Badge>
                      <span className="text-[11px]" style={{ color: "var(--result-text)" }}>
                        {u.sedesAsignadasIds.length === 0 ? "Acceso global" : `${u.sedesAsignadasIds.length} sede(s)`}
                      </span>
                    </span>
                  </span>
                  {current && <CheckCircle2 size={16} style={{ color: "var(--atom-green-500)" }} aria-label="En sesión" />}
                  {impersonatingId === u.id && <Spinner size={14} />}
                </button>
              </li>
            );
          })}
        </ul>
      </Surface>

      <div className="grid gap-5 lg:grid-cols-2">
        <JsonBlock title="Payload decodificado (claims del JWT)" data={claims} maxHeight={460} />
        <div className="space-y-5">
          <JsonBlock title="Bearer token (raw)" data={session.token} maxHeight={150} />
          <Surface className="p-5">
            <SectionHeading icon={<ShieldCheck size={13} />} title="Reglas de aislamiento aplicadas" className="mb-3" />
            <ul className="space-y-2.5">
              {POLITICAS.map((p) => (
                <li key={p.titulo} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: "var(--atom-green-500)" }} />
                  <span className="text-[12.5px]" style={{ color: "var(--sect-sub)" }}>
                    <strong style={{ color: "var(--list-text)" }}>{p.titulo}:</strong> {p.detalle}
                  </span>
                </li>
              ))}
            </ul>
          </Surface>
        </div>
      </div>
    </div>
  );
}
