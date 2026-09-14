"use client";

import { Plus, Trash2 } from "lucide-react";
import { Surface } from "@/components/atoms/Surface";
import { FilterChip } from "@/components/atoms/FilterChip";
import { Badge, type BadgeTone } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { Spinner } from "@/components/atoms/Spinner";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { EmptyState } from "@/components/molecules/EmptyState";
import { rolInfo } from "@/lib/status";
import type { ModuloSistema, Permiso, Rol } from "@/types";

const MODULOS: { id: ModuloSistema; label: string; description: string }[] = [
  { id: "SEDES_MUELLES", label: "Sedes y muelles", description: "Parametrización de CD, horarios y habilitación dinámica" },
  { id: "PROVEEDORES_MATERIALES", label: "Proveedores y materiales", description: "Homologación, catálogo y tiempos de descarga" },
  { id: "CITAS_PROGRAMACION", label: "Citas y programación", description: "Agenda de cupos, reservas temporales y confirmación" },
  { id: "PORTERIA_CONTROL", label: "Portería y acceso", description: "Check-in de camiones, inspección física y OCR de placas" },
  { id: "FORMULARIOS_WORKFLOWS", label: "Formularios y workflows", description: "Plantillas de inspección y listas de chequeo" },
  { id: "INTEGRACIONES_APIS", label: "Integraciones y APIs", description: "Endpoints corporativos, mapeos JSON y webhooks" },
  { id: "USUARIOS_ROLES", label: "Usuarios y RBAC", description: "Directorio de personal, perfiles y matriz de permisos" },
  { id: "DASHBOARDS_REPORTES", label: "Dashboards y KPIs", description: "Métricas OTIF, ocupación de muelles y exportaciones" },
  { id: "AUDITORIA_LOGS", label: "Auditoría", description: "Trazabilidad inmutable de eventos operacionales" },
];

const ACCION_TONE: Record<string, BadgeTone> = {
  CONFIGURAR: "coral",
  CREAR: "green",
  APROBAR: "green",
  EDITAR: "amber",
  ELIMINAR: "amber",
  RECHAZAR: "amber",
  LEER: "blue",
  EXPORTAR: "blue",
};

interface RbacMatrixProps {
  roles: Rol[];
  permisos: Permiso[];
  selectedRoleId: string;
  saving: boolean;
  onSelectRole: (id: string) => void;
  onChangePermisos: (rol: Rol, permisosIds: string[]) => void;
  onCreateRole: () => void;
  onDeleteRole: (rol: Rol) => void;
}

/** Matriz interactiva de permisos por módulo para el rol seleccionado. */
export function RbacMatrix({
  roles,
  permisos,
  selectedRoleId,
  saving,
  onSelectRole,
  onChangePermisos,
  onCreateRole,
  onDeleteRole,
}: RbacMatrixProps) {
  const selected = roles.find((r) => r.id === selectedRoleId) ?? roles[0];
  if (!selected) return <EmptyState title="Sin roles configurados" />;

  const ids = selected.permisosIds;
  const coverage = permisos.length > 0 ? (ids.length / permisos.length) * 100 : 0;
  const info = rolInfo(selected.codigo);

  const toggle = (permisoId: string) =>
    onChangePermisos(selected, ids.includes(permisoId) ? ids.filter((id) => id !== permisoId) : [...ids, permisoId]);

  const toggleModule = (modulo: ModuloSistema, enable: boolean) => {
    const moduleIds = permisos.filter((p) => p.modulo === modulo).map((p) => p.id);
    onChangePermisos(
      selected,
      enable ? Array.from(new Set([...ids, ...moduleIds])) : ids.filter((id) => !moduleIds.includes(id))
    );
  };

  return (
    <div className="space-y-4">
      <Surface className="space-y-4 p-5">
        <SectionHeading
          title="Perfil a editar"
          description="Los cambios se persisten de inmediato a través del repositorio activo."
          actions={
            <>
              {saving && (
                <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--sect-sub)" }}>
                  <Spinner size={12} /> Guardando…
                </span>
              )}
              <Button variant="secondary" size="sm" leftIcon={<Plus size={13} />} onClick={onCreateRole}>
                Nuevo rol
              </Button>
            </>
          }
        />
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <FilterChip
              key={r.id}
              label={r.nombre}
              count={r.permisosIds.length}
              active={r.id === selected.id}
              onClick={() => onSelectRole(r.id)}
            />
          ))}
        </div>
        <div
          className="flex flex-col gap-3 rounded-lg border p-3.5 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13.5px] font-semibold" style={{ color: "var(--sect-title)" }}>
                {selected.nombre}
              </span>
              <Badge size="sm" tone={info.tone}>
                {selected.codigo}
              </Badge>
              {selected.esSistema && (
                <Badge size="sm" tone="slate">
                  Sistema
                </Badge>
              )}
            </div>
            <p className="mt-1 text-[12px]" style={{ color: "var(--sect-sub)" }}>
              {selected.descripcion}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="w-28">
              <span className="mb-1 block text-[11px]" style={{ color: "var(--kpi-label)" }}>
                Cobertura {Math.round(coverage)}%
              </span>
              <ProgressBar value={coverage} label="Cobertura de permisos" />
            </div>
            {!selected.esSistema && (
              <Button variant="danger" size="sm" leftIcon={<Trash2 size={13} />} onClick={() => onDeleteRole(selected)}>
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </Surface>

      {MODULOS.map((mod) => {
        const modPerms = permisos.filter((p) => p.modulo === mod.id);
        if (modPerms.length === 0) return null;
        const activeCount = modPerms.filter((p) => ids.includes(p.id)).length;

        return (
          <section
            key={mod.id}
            aria-label={mod.label}
            className="overflow-hidden rounded-xl border"
            style={{ background: "var(--list-bg)", borderColor: "var(--list-border)" }}
          >
            <header
              className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              style={{ background: "var(--list-header-bg)", borderBottom: "1px solid var(--list-row-divider)" }}
            >
              <div>
                <h3 className="text-[13px] font-semibold" style={{ color: "var(--sect-title)" }}>
                  {mod.label}
                </h3>
                <p className="text-[11.5px]" style={{ color: "var(--list-text-sub)" }}>
                  {mod.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11.5px]" style={{ color: "var(--kpi-label)" }}>
                  {activeCount} de {modPerms.length}
                </span>
                <Button variant="ghost" size="sm" disabled={activeCount === modPerms.length} onClick={() => toggleModule(mod.id, true)}>
                  Habilitar todos
                </Button>
                <Button variant="ghost" size="sm" disabled={activeCount === 0} onClick={() => toggleModule(mod.id, false)}>
                  Limpiar
                </Button>
              </div>
            </header>
            <ul>
              {modPerms.map((permiso, idx) => (
                <li key={permiso.id} style={{ borderTop: idx === 0 ? undefined : "1px solid var(--list-row-divider)" }}>
                  <label
                    htmlFor={`perm-${permiso.id}`}
                    className="flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors hover:bg-[var(--list-row-hover)]"
                  >
                    <span className="mt-0.5">
                      <Checkbox id={`perm-${permiso.id}`} checked={ids.includes(permiso.id)} onChange={() => toggle(permiso.id)} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[12.5px] font-medium" style={{ color: "var(--list-text)" }}>
                          {permiso.nombre}
                        </span>
                        <Badge size="sm" tone="slate" style={{ fontFamily: "var(--font-mono)" }}>
                          {permiso.codigo}
                        </Badge>
                      </span>
                      <span className="mt-0.5 block text-[11.5px]" style={{ color: "var(--list-text-sub)" }}>
                        {permiso.descripcion}
                      </span>
                    </span>
                    <Badge size="sm" tone={ACCION_TONE[permiso.accion] ?? "slate"}>
                      {permiso.accion}
                    </Badge>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
