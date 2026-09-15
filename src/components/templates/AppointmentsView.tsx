"use client";

import { useDeferredValue, useState } from "react";
import { Calendar, Clock, Eye, Layers, Plus, RotateCcw, ShieldCheck, Sliders, Trash2, TrendingUp, Truck } from "lucide-react";
import { PageContainer } from "@/components/templates/PageContainer";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tabs, TabsPanel } from "@/components/molecules/Tabs";
import { KpiCard } from "@/components/molecules/KpiCard";
import { DataTable, type Column } from "@/components/molecules/DataTable";
import { SearchInput } from "@/components/molecules/SearchInput";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { IconButton } from "@/components/atoms/IconButton";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { AppointmentsGanttTimeline } from "@/components/organisms/appointments/AppointmentsGanttTimeline";
import { AppointmentDetailModal } from "@/components/organisms/appointments/AppointmentDetailModal";
import { AppointmentWizardModal } from "@/components/organisms/appointments/AppointmentWizardModal";
import { CapacityParametersPanel } from "@/components/organisms/appointments/CapacityParametersPanel";
import { useAuth } from "@/hooks/useAuth";
import { useConductores, useMateriales, useMuelles, useProveedores, useTiposMaterial, useVehiculos } from "@/hooks/useCatalogos";
import { useCambiarEstadoCita, useCitas, useEliminarCita } from "@/hooks/useCitas";
import { formatIsoHour, shiftIsoDate, todayIso } from "@/lib/format";
import { ESTADO_CITA } from "@/lib/status";
import { toast } from "@/lib/toast";
import type { Cita, EstadoCita, Kpi } from "@/types";

export function AppointmentsView() {
  const { usuario, isProvider, isSiteAdmin, isGlobalAdmin, hasPermission, activeSede, activeSedeId, availableSedes, setActiveSedeId } = useAuth();
  const sedeId = activeSede?.id ?? activeSedeId;
  const proveedorId = isProvider ? usuario?.proveedorId : undefined;

  const [tab, setTab] = useState(isProvider ? "listado" : "cronograma");
  const [fecha, setFecha] = useState(todayIso());
  const [estado, setEstado] = useState("TODOS");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const [selected, setSelected] = useState<Cita | null>(null);
  const [toDelete, setToDelete] = useState<Cita | null>(null);
  const [wizard, setWizard] = useState<{ open: boolean; slot?: { muelleId: string; horaInicio: string }; special?: boolean }>({ open: false });

  const today = todayIso();
  const tomorrow = shiftIsoDate(today, 1);
  const fechaDia = fecha === "TODAS" ? today : fecha;

  const diaQuery = useCitas({ sedeId, fecha: fechaDia, proveedorId });
  const listQuery = useCitas(
    { sedeId, fecha: fecha === "TODAS" ? undefined : fecha, estado: estado === "TODOS" ? undefined : estado, search: deferredSearch || undefined, proveedorId },
    tab === "listado"
  );
  const { data: muelles = [] } = useMuelles(sedeId);
  const { data: proveedores = [] } = useProveedores();
  const { data: tiposMaterial = [] } = useTiposMaterial();
  const { data: materiales = [] } = useMateriales();
  const { data: vehiculos = [] } = useVehiculos();
  const { data: conductores = [] } = useConductores();

  const cambiarEstado = useCambiarEstadoCita();
  const eliminar = useEliminarCita();

  const canCreate = hasPermission("CITAS_SOLICITAR") || isGlobalAdmin;
  const canCreateSpecial = !isProvider && (isGlobalAdmin || isSiteAdmin);
  const canManageCapacity = !isProvider && (isGlobalAdmin || isSiteAdmin);
  const canDelete = isGlobalAdmin || isSiteAdmin;
  const effectiveTab = (tab === "capacidad" && !canManageCapacity) || (tab === "cronograma" && isProvider) ? "listado" : tab;

  const citasDia = diaQuery.data ?? [];
  const citas = listQuery.data ?? [];
  const enMuelle = citasDia.filter((c) => c.estado === "EN_MUELLE" || c.estado === "DESCARGANDO").length;
  const enPorteria = citasDia.filter((c) => c.estado === "EN_PORTERIA").length;
  const puntuales = citasDia.filter((c) => c.tiempos.minutosRetrasoLlegada === 0).length;
  const conArribo = citasDia.filter((c) => c.tiempos.minutosRetrasoLlegada !== undefined).length;

  const kpis: Kpi[] = [
    {
      icon: Calendar,
      label: fechaDia === today ? "Citas hoy" : `Citas ${fechaDia}`,
      value: String(citasDia.length),
      subValue: `${citasDia.filter((c) => c.estado === "COMPLETADA").length} completadas`,
      iconBg: "var(--kpi-icon-info-bg)",
      iconColor: "var(--kpi-icon-info-color)",
    },
    {
      icon: Truck,
      label: "En muelle / descargando",
      value: String(enMuelle),
      iconBg: "var(--tone-navy-bg)",
      iconColor: "var(--tone-navy-color)",
    },
    {
      icon: ShieldCheck,
      label: "En garita de entrada",
      value: String(enPorteria),
      iconBg: "var(--tone-amber-bg)",
      iconColor: "var(--tone-amber-color)",
    },
    {
      icon: TrendingUp,
      label: "Puntualidad",
      value: conArribo > 0 ? `${Math.round((puntuales / conArribo) * 100)}%` : "—",
      subValue: `${conArribo} arribos registrados`,
      iconBg: "var(--kpi-icon-pos-bg)",
      iconColor: "var(--kpi-icon-pos-color)",
      progress: conArribo > 0 ? (puntuales / conArribo) * 100 : undefined,
      progressColor: "var(--solid-green)",
    },
  ];

  const handleChangeEstado = (nuevo: EstadoCita, metadata?: Record<string, unknown>) => {
    if (!selected) return;
    cambiarEstado.mutate(
      { citaId: selected.id, estado: nuevo, metadata },
      {
        onSuccess: (cita) => {
          setSelected(cita);
          toast.success(`Cita ${cita.codigoCita}: ${ESTADO_CITA[cita.estado].label}`);
        },
      }
    );
  };

  const columns: Column<Cita>[] = [
    { key: "codigo", header: "Radicado", render: (c) => <span className="font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{c.codigoCita}</span> },
    { key: "proveedor", header: "Proveedor", render: (c) => proveedores.find((p) => p.id === c.proveedorId)?.nombreComercial ?? "—" },
    {
      key: "horario",
      header: "Ventana",
      render: (c) => (
        <div style={{ fontFamily: "var(--font-mono)" }}>
          {formatIsoHour(c.tiempos.horaProgramadaInicio)} – {formatIsoHour(c.tiempos.horaProgramadaFin)}
          <div className="text-[11px]" style={{ color: "var(--list-text-sub)" }}>
            {c.fechaCita}
          </div>
        </div>
      ),
    },
    {
      key: "muelle",
      header: "Muelle",
      hideOnMobile: true,
      render: (c) => {
        const m = muelles.find((x) => x.id === c.muelleId);
        return (
          <div>
            <span style={{ fontFamily: "var(--font-mono)" }}>{m?.codigoMuelle ?? "—"}</span>
            <div className="max-w-[160px] truncate text-[11px]" style={{ color: "var(--list-text-sub)" }}>
              {m?.nombre}
            </div>
          </div>
        );
      },
    },
    {
      key: "carga",
      header: "Carga",
      hideOnMobile: true,
      render: (c) => (
        <div>
          {c.totalEstibas} estibas
          <div className="text-[11px]" style={{ color: "var(--list-text-sub)" }}>
            {(c.pesoTotalKg / 1000).toFixed(1)} t
          </div>
        </div>
      ),
    },
    {
      key: "vehiculo",
      header: "Vehículo",
      hideOnMobile: true,
      render: (c) => <span style={{ fontFamily: "var(--font-mono)" }}>{vehiculos.find((v) => v.id === c.vehiculoId)?.placa ?? "—"}</span>,
    },
    {
      key: "estado",
      header: "Estado",
      render: (c) => (
        <Badge size="sm" tone={ESTADO_CITA[c.estado].tone}>
          {ESTADO_CITA[c.estado].label}
        </Badge>
      ),
    },
    {
      key: "acciones",
      header: "",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="secondary" size="sm" leftIcon={<Eye size={13} />} onClick={() => setSelected(c)}>
            Ficha
          </Button>
          {canDelete && (
            <IconButton label={`Eliminar ${c.codigoCita}`} onClick={() => setToDelete(c)}>
              <Trash2 size={14} />
            </IconButton>
          )}
        </div>
      ),
    },
  ];

  const filtrosActivos = Boolean(search) || estado !== "TODOS" || fecha !== today;

  return (
    <PageContainer>
      <PageHeader
        title={isProvider ? "Mis citas y solicitudes" : "Agendamiento y turnos de camiones"}
        description={
          isProvider
            ? `Consulta tus entregas y agenda turnos de descargue${usuario?.nit_proveedor ? ` · NIT ${usuario.nit_proveedor}` : ""}.`
            : "Programa la llegada de proveedores, asigna muelles de descargue y consulta el horario del día."
        }
        actions={
          canCreate || canCreateSpecial ? (
            <div className="flex flex-wrap gap-2">
              {canCreate && (
                <Button leftIcon={<Plus size={15} />} onClick={() => setWizard({ open: true })}>
                  Programar cita
                </Button>
              )}
              {canCreateSpecial && (
                <Button variant="secondary" leftIcon={<Calendar size={15} />} onClick={() => setWizard({ open: true, special: true })}>
                  Asignar cita especial
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="mb-5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <Tabs
        className="mb-5"
        value={effectiveTab}
        onChange={setTab}
        items={[
          ...(!isProvider ? [{ value: "cronograma", label: "Cronograma de muelles", icon: <Clock size={14} /> }] : []),
          { value: "listado", label: isProvider ? "Mis citas" : "Listado de citas", icon: <Layers size={14} />, badge: tab === "listado" ? citas.length : undefined },
          ...(canManageCapacity ? [{ value: "capacidad", label: "Capacidad y restricciones", icon: <Sliders size={14} /> }] : []),
        ]}
      />

      <TabsPanel value="cronograma" activeValue={effectiveTab}>
        <AppointmentsGanttTimeline
          citas={citasDia}
          muelles={muelles}
          sedes={isGlobalAdmin ? availableSedes : activeSede ? [activeSede] : []}
          proveedores={proveedores}
          vehiculos={vehiculos}
          sedeId={sedeId}
          fecha={fechaDia}
          onFechaChange={setFecha}
          onSedeChange={setActiveSedeId}
          onOpenCita={setSelected}
          onNewAtSlot={canCreate ? (slot) => setWizard({ open: true, slot }) : undefined}
        />
      </TabsPanel>

      <TabsPanel value="listado" activeValue={effectiveTab} className="space-y-4">
        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Radicado, SKU u orden de compra…" aria-label="Buscar citas" containerClassName="xl:max-w-xs" />
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            {isGlobalAdmin && availableSedes.length > 1 && (
              <div className="sm:w-48">
                <Select value={sedeId} onChange={(e) => setActiveSedeId(e.target.value)} aria-label="Sede">
                  {availableSedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className="sm:w-44">
              <Select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado">
                <option value="TODOS">Todos los estados</option>
                {(Object.keys(ESTADO_CITA) as EstadoCita[]).map((e) => (
                  <option key={e} value={e}>
                    {ESTADO_CITA[e].label}
                  </option>
                ))}
              </Select>
            </div>
            <Input type="date" aria-label="Fecha" value={fecha === "TODAS" ? "" : fecha} onChange={(e) => setFecha(e.target.value || "TODAS")} className="sm:w-[150px]" />
            <SegmentedControl<string>
              ariaLabel="Fecha rápida"
              value={fecha === today ? "HOY" : fecha === tomorrow ? "MANANA" : fecha === "TODAS" ? "TODAS" : ""}
              onChange={(v) => setFecha(v === "HOY" ? today : v === "MANANA" ? tomorrow : "TODAS")}
              options={[
                { value: "HOY", label: "Hoy" },
                { value: "MANANA", label: "Mañana" },
                { value: "TODAS", label: "Todas" },
              ]}
            />
            {filtrosActivos && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RotateCcw size={13} />}
                onClick={() => {
                  setSearch("");
                  setEstado("TODOS");
                  setFecha(today);
                }}
              >
                Restablecer
              </Button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={citas}
          rowKey={(c) => c.id}
          caption="Listado de citas"
          emptyState={
            <EmptyState
              icon={Calendar}
              title={listQuery.isLoading ? "Cargando citas…" : "No hay citas para los filtros seleccionados"}
              description={listQuery.isLoading ? undefined : "Prueba otra fecha o programa una nueva cita."}
              action={
                !listQuery.isLoading ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setFecha("TODAS")}>
                      Ver todas las fechas
                    </Button>
                    {canCreate && (
                      <>
                        <Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setWizard({ open: true })}>
                          Programar cita
                        </Button>
                        {canCreateSpecial && (
                          <Button variant="secondary" size="sm" leftIcon={<Calendar size={13} />} onClick={() => setWizard({ open: true, special: true })}>
                            Cita especial
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ) : undefined
              }
            />
          }
        />
      </TabsPanel>

      {canManageCapacity && (
        <TabsPanel value="capacidad" activeValue={effectiveTab}>
          <CapacityParametersPanel />
        </TabsPanel>
      )}

      <AppointmentDetailModal
        cita={selected}
        sedes={availableSedes}
        muelles={muelles}
        proveedores={proveedores}
        vehiculos={vehiculos}
        conductores={conductores}
        changing={cambiarEstado.isPending}
        onClose={() => setSelected(null)}
        onChangeEstado={handleChangeEstado}
      />

      <AppointmentWizardModal
        open={wizard.open}
        sedes={availableSedes}
        proveedores={isProvider ? proveedores.filter((p) => p.id === proveedorId) : proveedores}
        tiposMaterial={tiposMaterial}
        materiales={materiales}
        initialSedeId={sedeId}
        initialFecha={fechaDia}
        initialSlot={wizard.slot}
        lockedProveedorId={proveedorId}
        defaultSpecial={Boolean(wizard.special)}
        onClose={() => setWizard({ open: false })}
        onCreated={(cita) => {
          toast.success(`Cita ${cita.codigoCita} programada con éxito`);
          setFecha(cita.fechaCita);
          if (cita.sedeId !== sedeId) setActiveSedeId(cita.sedeId);
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="¿Eliminar cita del sistema?"
        description="Se eliminará la reserva y se liberará el slot del muelle para otros proveedores."
        itemName={toDelete ? `${toDelete.codigoCita} (${toDelete.fechaCita})` : undefined}
        confirmLabel="Eliminar cita"
        loading={eliminar.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() =>
          toDelete &&
          eliminar.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success(`Cita ${toDelete.codigoCita} eliminada`);
              if (selected?.id === toDelete.id) setSelected(null);
              setToDelete(null);
            },
          })
        }
      />
    </PageContainer>
  );
}
