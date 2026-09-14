"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Check, ChevronDown, LogOut, Settings } from "lucide-react";
import { Dropdown } from "@/components/molecules/Dropdown";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUsuarios } from "@/hooks/useRbac";
import { useAppSelector } from "@/store/hooks";
import { getInitials } from "@/lib/format";
import { rolInfo } from "@/lib/status";
import { toast } from "@/lib/toast";

const itemClass =
  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12.5px] no-underline transition-colors hover:bg-[var(--card-menu-item-hover)]";

export function UserMenu() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { isGlobalAdmin, logout, impersonate } = useAuth();
  const isMockMode = useAppSelector((s) => s.systemConfig.dataSourceMode === "MOCK");
  const { data: perfiles = [] } = useUsuarios(isMockMode);

  const handleSwitch = async (usuarioId: string, close: () => void) => {
    close();
    try {
      const session = await impersonate(usuarioId);
      toast.success(`Perfil activo: ${session.usuario.nombreCompleto}`);
      router.push("/inicio");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar de perfil");
    }
  };

  const handleLogout = (close: () => void) => {
    close();
    logout();
    toast.info("Sesión cerrada correctamente");
    router.replace("/login");
  };

  return (
    <Dropdown
      width={300}
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label="Menú de usuario"
          className="flex items-center gap-2 rounded-lg border border-transparent px-1.5 py-1 transition-colors hover:border-[var(--hd-user-border-hover)] hover:bg-[var(--hd-user-bg-hover)]"
          style={{ cursor: "pointer" }}
        >
          <Avatar initials={user?.initials ?? "…"} />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-[140px] truncate text-[12.5px] font-medium" style={{ color: "var(--hd-user-title)" }}>
              {user?.primerNombre ?? "…"}
            </span>
            <span className="block max-w-[140px] truncate text-[11px]" style={{ color: "var(--hd-user-sub)" }}>
              {user?.roleLabel ?? "Usuario"}
            </span>
          </span>
          <ChevronDown size={12} strokeWidth={2} style={{ color: "var(--hd-icon-color)" }} aria-hidden="true" />
        </button>
      )}
    >
      {(close) => (
        <div className="py-1.5">
          <div className="px-3 pb-2.5 pt-1" style={{ borderBottom: "1px solid var(--card-divider)" }}>
            <span className="block text-[12.5px] font-medium" style={{ color: "var(--hd-user-title)" }}>
              {user?.nombre}
            </span>
            <span className="block truncate text-[11px]" style={{ color: "var(--hd-user-sub)" }}>
              {user?.email}
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <Badge size="sm" tone={user?.roleTone ?? "slate"}>
                {user?.roleLabel}
              </Badge>
              {user?.nitProveedor && (
                <Badge size="sm" tone="slate">
                  NIT {user.nitProveedor}
                </Badge>
              )}
            </div>
          </div>

          {isMockMode && perfiles.length > 0 && (
            <div style={{ borderBottom: "1px solid var(--card-divider)" }}>
              <div
                className="flex items-center justify-between px-3 pb-1 pt-2.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{ color: "var(--kpi-label)" }}
              >
                Cambiar perfil de prueba
                <ArrowLeftRight size={11} />
              </div>
              <ul className="max-h-56 overflow-y-auto pb-1">
                {perfiles
                  .filter((p) => p.activo)
                  .map((perfil) => {
                    const current = perfil.id === user?.id;
                    return (
                      <li key={perfil.id}>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => !current && handleSwitch(perfil.id, close)}
                          className={itemClass}
                          style={{ background: current ? "var(--chip-bg-active)" : "transparent" }}
                        >
                          <Avatar initials={getInitials(perfil.nombreCompleto)} size={24} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium" style={{ color: "var(--card-menu-item)" }}>
                              {perfil.nombreCompleto.replace(/\s*\(.*?\)\s*/g, " ").trim()}
                            </span>
                            <span className="block truncate text-[11px]" style={{ color: "var(--hd-user-sub)" }}>
                              {rolInfo(perfil.rolCodigo).label}
                            </span>
                          </span>
                          {current && <Check size={14} style={{ color: "var(--atom-green-500)" }} />}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}

          {isGlobalAdmin && (
            <Link
              href="/configuracion"
              onClick={close}
              role="menuitem"
              className={itemClass}
              style={{ color: "var(--card-menu-item)" }}
            >
              <Settings size={14} strokeWidth={1.7} />
              Configuración
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => handleLogout(close)}
            className={itemClass}
            style={{ color: "var(--card-menu-danger, var(--atom-coral-500))" }}
          >
            <LogOut size={14} strokeWidth={1.7} />
            Cerrar sesión
          </button>
        </div>
      )}
    </Dropdown>
  );
}
