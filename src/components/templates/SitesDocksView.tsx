"use client";

import { useMemo, useState } from "react";
import { Building2, CheckCircle2, Clock, FileText, Layers, MapPin, Pencil, Plus, Sparkles, Trash2, Truck, Wrench, Zap } from "lucide-react";
import { PageContainer } from "@/components/templates/PageContainer";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tabs, TabsPanel } from "@/components/molecules/Tabs";
import { KpiCard } from "@/components/molecules/KpiCard";
import { SearchInput } from "@/components/molecules/SearchInput";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Surface } from "@/components/atoms/Surface";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { IconButton } from "@/components/atoms/IconButton";
import { Select } from "@/components/atoms/Select";
import { DockCard } from "@/components/organisms/sites/DockCard";
import { DockEditorModal } from "@/components/organisms/sites/DockEditorModal";
import { DockStatusModal } from "@/components/organisms/sites/DockStatusModal";
import { SedeEditorModal } from "@/components/organisms/sites/SedeEditorModal";
import { ShiftsMatrix } from "@/components/organisms/sites/ShiftsMatrix";
import { CompatibilityChecker } from "@/components/organisms/sites/CompatibilityChecker";
import { AvailabilityLogTable } from "@/components/organisms/sites/AvailabilityLogTable";
import { MATERIALES_OPCIONES } from "@/components/organisms/sites/constants";
import { useAuth } from "@/hooks/useAuth";
import { useMuelles, useSedes } from "@/hooks/useCatalogos";
import {
  useCambiarEstadoMuelle,
  useEliminarLogDisponibilidad,
  useEliminarMuelle,
  useEliminarSede,
  useGuardarMuelle,
  useGuardarSede,
  useLogsDisponibilidad,
} from "@/hooks/useSedesMuelles";
import { ESTADO_MUELLE, TIPO_MUELLE } from "@/lib/status";
import { toast } from "@/lib/toast";
import type { EstadoMuelle, Kpi, Muelle, MuelleDisponibilidadLog, Sede, TipoMuelle } from "@/types";

export function SitesDocksView() {
  const { usuario, isGlobalAdmin, isSiteAdmin, activeSede, activeSedeId, availableSedes, hasMultipleSedes, setActiveSedeId, hasPermission } =
    useAuth();
  const sedeId = activeSede?.id ?? activeSedeId;

  const { data: muelles = [] } = useMuelles(sedeId);
  const { data: logs = [] } = useLogsDisponibilidad(sedeId);
  const { data: sedes = [] } = useSedes();

  const guardarMuelle = useGuardarMuelle();
  const eliminarMuelle = useEliminarMuelle();
  const cambiarEstado = useCambiarEstadoMuelle();
  const guardarSede = useGuardarSede();
  const eliminarSede = useEliminarSede();
  const eliminarLog = useEliminarLogDisponibilidad();

  const [tab, setTab] = useState("muelles");
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("ALL");
  const [estadoFilter, setEstadoFilter] = useState("ALL");
  const [materialFilter, setMaterialFilter] = useState("ALL");

  const [dockEditor, setDockEditor] = useState<{ open: boolean; muelle: Muelle | null }>({ open: false, muelle: null });
  const [statusTarget, setStatusTarget] = useState<Muelle | null>(null);
  const [dockToDelete, setDockToDelete] = useState<Muelle | null>(null);
  const [sedeEditor, setSedeEditor] = useState<{ open: boolean; sede: Sede | null }>({ open: false, sede: null });
  const [sedeToDelete, setSedeToDelete] = useState<Sede | null>(null);
  const [logToDelete, setLogToDelete] = useState<MuelleDisponibilidadLog | null>(null);

  const canManage = isGlobalAdmin || isSiteAdmin;
  const effectiveTab = tab === "sedes" && !isGlobalAdmin ? "muelles" : tab;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return muelles.filter(
      (m) =>
        (!q ||
          m.codigoMuelle.toLowerCase().includes(q) ||
          m.nombre.toLowerCase().includes(q) ||
          m.observaciones?.toLowerCase().includes(q)) &&
        (tipoFilter === "ALL" || m.tipo === tipoFilter) &&
        (estadoFilter === "ALL" || m.estadoActual === estadoFilter) &&
        (materialFilter === "ALL" || m.materialesPermitidos.includes(materialFilter as Muelle["materialesPermitidos"][number]))
    );
  }, [muelles, search, tipoFilter, estadoFilter, materialFilter]);

  const total = muelles.length;
  const disponibles = muelles.filter((m) => m.estadoActual === "DISPONIBLE").length;
  const ocupados = muelles.filter((m) => m.estadoActual === "OCUPADO").length;
  const mantenimiento = muelles.filter((m) => m.estadoActual === "MANTENIMIENTO").length;
  const inactivos = muelles.filter((m) => m.estadoActual === "INACTIVO").length;
  const apertura = parseInt((activeSede?.horarioApertura ?? "06:00").split(":")[0], 10);
  const cierre = parseInt((activeSede?.horarioCierre ?? "22:00").split(":")[0], 10);
  const slotsDia = (total - mantenimiento - inactivos) * Math.max(1, cierre - apertura) * (60 / (activeSede?.tiempoSlotMinutosDefecto || 30));
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const kpis: Kpi[] = [
    {
      icon: Layers,
      label: "Muelles totales",
      value: String(total),
      subValue: `${muelles.filter((m) => m.tipo === "RECEPCION").length} recepción · ${muelles.filter((m) => m.tipo === "CROSS_DOCKING").length} cross-dock`,
      iconBg: "var(--kpi-icon-info-bg)",
      iconColor: "var(--kpi-icon-info-color)",
    },
    {
      icon: CheckCircle2,
      label: "Disponibles",
      value: String(disponibles),
      subValue: `${pct(disponibles)}% libres para citas`,
      iconBg: "var(--kpi-icon-pos-bg)",
      iconColor: "var(--kpi-icon-pos-color)",
      progress: pct(disponibles),
      progressColor: "var(--solid-green)",
    },
    {
      icon: Truck,
      label: "En operación",
      value: String(ocupados),
      subValue: `${pct(ocupados)}% de uso`,
      iconBg: "var(--tone-navy-bg)",
      iconColor: "var(--tone-navy-color)",
      progress: pct(ocupados),
      progressColor: "var(--solid-navy)",
    },
    {
      icon: Wrench,
      label: "Mantenimiento",
      value: String(mantenimiento),
      subValue: `${inactivos} fuera de servicio`,
      iconBg: "var(--kpi-icon-warn-bg)",
      iconColor: "var(--kpi-icon-warn-color)",
    },
    {
      icon: Zap,
      label: "Slots diarios",
      value: String(Math.round(slotsDia)),
      subValue: `${activeSede?.tiempoSlotMinutosDefecto ?? 30} min por slot`,
      iconBg: "var(--tone-amber-bg)",
      iconColor: "var(--tone-amber-color)",
    },
  ];

  const handleSaveDock = (data: Partial<Muelle>) => {
    const payload = dockEditor.muelle
      ? { ...data, id: dockEditor.muelle.id }
      : { ...data, sedeId, estadoActual: "DISPONIBLE" as EstadoMuelle, activo: true };
    guardarMuelle.mutate(payload, {
      onSuccess: (saved) => {
        toast.success(`Muelle ${saved.codigoMuelle} guardado`);
        setDockEditor({ open: false, muelle: null });
      },
    });
  };

  const handleSaveSede = (data: Partial<Sede>) => {
    guardarSede.mutate(sedeEditor.sede ? { ...data, id: sedeEditor.sede.id } : data, {
      onSuccess: (saved) => {
        toast.success(`Sede ${saved.nombre} guardada`);
        setSedeEditor({ open: false, sede: null });
        if (!sedeEditor.sede) setActiveSedeId(saved.id);
      },
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Sedes, muelles y capacidad"
        description="Configuración de sedes, muelles de carga, turnos de atención y reglas de compatibilidad vehicular."
        actions={
          hasMultipleSedes ? (
            <div className="w-60">
              <Select value={sedeId} onChange={(e) => setActiveSedeId(e.target.value)} aria-label="Sede activa">
                {availableSedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.codigo})
                  </option>
                ))}
              </Select>
            </div>
          ) : activeSede ? (
            <Badge tone="blue">
              <MapPin size={12} /> {activeSede.nombre}
            </Badge>
          ) : undefined
        }
      />

      <div className="mb-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <Tabs
        className="mb-5"
        value={effectiveTab}
        onChange={setTab}
        items={[
          { value: "muelles", label: "Muelles y bahías", icon: <Layers size={14} />, badge: total },
          { value: "turnos", label: "Horarios y turnos", icon: <Clock size={14} /> },
          { value: "compatibilidad", label: "Compatibilidad de carga", icon: <Sparkles size={14} /> },
          ...(isGlobalAdmin ? [{ value: "sedes", label: "Sedes logísticas", icon: <Building2 size={14} />, badge: sedes.length }] : []),
          { value: "historial", label: "Historial", icon: <FileText size={14} />, badge: logs.length },
        ]}
      />

      <TabsPanel value="muelles" activeValue={effectiveTab} className="space-y-4">
        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar muelle (M-01)…" aria-label="Buscar muelle" containerClassName="xl:max-w-xs" />
          <div className="grid flex-1 gap-2.5 sm:grid-cols-3">
            <Select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} aria-label="Filtrar por tipo">
              <option value="ALL">Todos los tipos</option>
              {(Object.keys(TIPO_MUELLE) as TipoMuelle[]).map((t) => (
                <option key={t} value={t}>
                  {TIPO_MUELLE[t].label}
                </option>
              ))}
            </Select>
            <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} aria-label="Filtrar por estado">
              <option value="ALL">Todos los estados</option>
              {(Object.keys(ESTADO_MUELLE) as EstadoMuelle[]).map((e) => (
                <option key={e} value={e}>
                  {ESTADO_MUELLE[e].label}
                </option>
              ))}
            </Select>
            <Select value={materialFilter} onChange={(e) => setMaterialFilter(e.target.value)} aria-label="Filtrar por material">
              <option value="ALL">Todos los materiales</option>
              {MATERIALES_OPCIONES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
          {canManage && (
            <Button leftIcon={<Plus size={15} />} onClick={() => setDockEditor({ open: true, muelle: null })}>
              Nuevo muelle
            </Button>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Layers} title="Sin muelles para los filtros aplicados" description="Ajusta los criterios o registra un nuevo muelle." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((muelle) => (
              <DockCard
                key={muelle.id}
                muelle={muelle}
                canManage={canManage}
                canChangeStatus={hasPermission("MUELLES_HABILITAR", undefined, muelle.id)}
                onChangeStatus={() => setStatusTarget(muelle)}
                onEdit={() => setDockEditor({ open: true, muelle })}
                onDelete={() => setDockToDelete(muelle)}
              />
            ))}
          </div>
        )}
      </TabsPanel>

      <TabsPanel value="turnos" activeValue={effectiveTab}>
        <ShiftsMatrix
          muelles={muelles}
          sede={activeSede}
          usuarioId={usuario?.id ?? "usr-sistema"}
          canEdit={hasPermission("MUELLES_HABILITAR")}
        />
      </TabsPanel>

      <TabsPanel value="compatibilidad" activeValue={effectiveTab}>
        <CompatibilityChecker muelles={muelles} sedeNombre={activeSede?.nombre} />
      </TabsPanel>

      {isGlobalAdmin && (
        <TabsPanel value="sedes" activeValue={effectiveTab} className="space-y-4">
          <div className="flex justify-end">
            <Button leftIcon={<Plus size={15} />} onClick={() => setSedeEditor({ open: true, sede: null })}>
              Nueva sede
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sedes.map((sede) => {
              const active = sede.id === sedeId;
              return (
                <Surface key={sede.id} className="flex flex-col p-5" style={active ? { borderColor: "var(--card-border-hover)", boxShadow: "var(--card-shadow-hover)" } : undefined}>
                  <div className="flex items-start justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--card-divider)" }}>
                    <div className="min-w-0">
                      <Badge size="sm" tone="slate" style={{ fontFamily: "var(--font-mono)" }}>
                        {sede.codigo}
                      </Badge>
                      <h3 className="mt-1.5 truncate text-[14px] font-semibold" style={{ color: "var(--card-title)" }}>
                        {sede.nombre}
                      </h3>
                      <p className="truncate text-[12px]" style={{ color: "var(--card-desc)" }}>
                        {sede.ciudad}, {sede.departamentoOEstado} · {sede.pais}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <IconButton label={`Editar ${sede.nombre}`} onClick={() => setSedeEditor({ open: true, sede })}>
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton label={`Eliminar ${sede.nombre}`} onClick={() => setSedeToDelete(sede)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </div>
                  <dl className="space-y-1.5 py-3 text-[12px]">
                    {[
                      ["Horario", `${sede.horarioApertura} – ${sede.horarioCierre}`],
                      ["Slot base", `${sede.tiempoSlotMinutosDefecto} min`],
                      ["Tolerancia", `${sede.toleranciaImpuntualidadMinutos} min`],
                      ["Capacidad simultánea", `${sede.capacidadSimultaneaMuelles} muelles`],
                      ["Días no laborables", `${sede.diasNoLaborables.length}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <dt style={{ color: "var(--list-text-sub)" }}>{k}</dt>
                        <dd className="font-medium" style={{ color: "var(--list-text)", fontFamily: "var(--font-mono)" }}>
                          {v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-auto flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--card-divider)" }}>
                    <Button size="sm" variant={active ? "primary" : "secondary"} disabled={active} onClick={() => setActiveSedeId(sede.id)}>
                      {active ? "Sede activa" : "Seleccionar"}
                    </Button>
                    <span className="text-[11px]" style={{ color: "var(--result-text)", fontFamily: "var(--font-mono)" }}>
                      {sede.zonaHoraria}
                    </span>
                  </div>
                </Surface>
              );
            })}
          </div>
        </TabsPanel>
      )}

      <TabsPanel value="historial" activeValue={effectiveTab}>
        <AvailabilityLogTable logs={logs} muelles={muelles} canDelete={canManage} onDelete={setLogToDelete} />
      </TabsPanel>

      <DockEditorModal
        open={dockEditor.open}
        muelle={dockEditor.muelle}
        sedeNombre={activeSede?.nombre}
        siguienteNumero={total + 1}
        saving={guardarMuelle.isPending}
        onClose={() => setDockEditor({ open: false, muelle: null })}
        onSubmit={handleSaveDock}
      />

      <DockStatusModal
        muelle={statusTarget}
        saving={cambiarEstado.isPending}
        onClose={() => setStatusTarget(null)}
        onSubmit={(data) =>
          statusTarget &&
          cambiarEstado.mutate(
            { muelleId: statusTarget.id, estado: data.estado, motivo: data.motivo, usuarioId: usuario?.id ?? "usr-sistema" },
            {
              onSuccess: (m) => {
                toast.success(`Muelle ${m.codigoMuelle}: ${ESTADO_MUELLE[m.estadoActual].label}`);
                setStatusTarget(null);
              },
            }
          )
        }
      />

      <SedeEditorModal
        open={sedeEditor.open}
        sede={sedeEditor.sede}
        siguienteNumero={sedes.length + 1}
        saving={guardarSede.isPending}
        onClose={() => setSedeEditor({ open: false, sede: null })}
        onSubmit={handleSaveSede}
      />

      <ConfirmDialog
        open={Boolean(dockToDelete)}
        title="¿Eliminar muelle?"
        description="Se eliminará la bahía y no podrán programarse nuevas citas en ella."
        itemName={dockToDelete ? `${dockToDelete.codigoMuelle} — ${dockToDelete.nombre}` : undefined}
        confirmLabel="Eliminar muelle"
        loading={eliminarMuelle.isPending}
        onCancel={() => setDockToDelete(null)}
        onConfirm={() =>
          dockToDelete &&
          eliminarMuelle.mutate(dockToDelete.id, {
            onSuccess: () => {
              toast.success(`Muelle ${dockToDelete.codigoMuelle} eliminado`);
              setDockToDelete(null);
            },
          })
        }
      />

      <ConfirmDialog
        open={Boolean(sedeToDelete)}
        title="¿Eliminar centro de distribución?"
        description="Se eliminará la configuración de la sede, sus parámetros de slots y reglas operativas."
        itemName={sedeToDelete ? `${sedeToDelete.codigo} — ${sedeToDelete.nombre}` : undefined}
        confirmLabel="Eliminar sede"
        loading={eliminarSede.isPending}
        onCancel={() => setSedeToDelete(null)}
        onConfirm={() =>
          sedeToDelete &&
          eliminarSede.mutate(sedeToDelete.id, {
            onSuccess: () => {
              toast.success(`Sede ${sedeToDelete.nombre} eliminada`);
              setSedeToDelete(null);
            },
          })
        }
      />

      <ConfirmDialog
        open={Boolean(logToDelete)}
        title="¿Eliminar registro de la bitácora?"
        description="Se borrará esta entrada de trazabilidad histórica."
        itemName={logToDelete ? `${logToDelete.fecha} — ${logToDelete.motivoCambio}` : undefined}
        confirmLabel="Eliminar registro"
        loading={eliminarLog.isPending}
        onCancel={() => setLogToDelete(null)}
        onConfirm={() =>
          logToDelete &&
          eliminarLog.mutate(logToDelete.id, {
            onSuccess: () => {
              toast.success("Registro de bitácora eliminado");
              setLogToDelete(null);
            },
          })
        }
      />
    </PageContainer>
  );
}
