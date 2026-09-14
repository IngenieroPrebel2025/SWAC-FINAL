"use client";

import { useDeferredValue, useState } from "react";
import { CheckCircle2, Clock, History, QrCode, Radio, ShieldCheck, Smartphone, Tablet, Truck } from "lucide-react";
import { PageContainer } from "@/components/templates/PageContainer";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tabs, TabsPanel } from "@/components/molecules/Tabs";
import { DataTable, type Column } from "@/components/molecules/DataTable";
import { SearchInput } from "@/components/molecules/SearchInput";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import { EmptyState } from "@/components/molecules/EmptyState";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { Surface } from "@/components/atoms/Surface";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { GateScannerModal } from "@/components/organisms/gate/GateScannerModal";
import { GateInspectionModal } from "@/components/organisms/gate/GateInspectionModal";
import { GateCheckoutModal } from "@/components/organisms/gate/GateCheckoutModal";
import { DriverPassModal } from "@/components/organisms/gate/DriverPassModal";
import { YardQueueBoard } from "@/components/organisms/gate/YardQueueBoard";
import { useAuth } from "@/hooks/useAuth";
import { useConductores, useMuelles, useProveedores, useVehiculos } from "@/hooks/useCatalogos";
import { useCitas } from "@/hooks/useCitas";
import { useHistorialSalidas, useTurnosPatio } from "@/hooks/usePorteria";
import { formatIsoHour, formatTime, todayIso } from "@/lib/format";
import { ESTADO_CITA } from "@/lib/status";
import type { Cita, RegistroSalidaPorteria, TurnoPatio } from "@/types";

/** Estados en los que una cita todavía requiere gestión en garita de entrada. */
const ESTADOS_GARITA = new Set(["SOLICITADA", "CONFIRMADA", "EN_PORTERIA", "EN_MUELLE", "DESCARGANDO", "COMPLETADA"]);

export function GateView() {
  const { activeSede, activeSedeId, availableSedes, setActiveSedeId } = useAuth();
  const sedeId = activeSede?.id ?? activeSedeId;

  const [tab, setTab] = useState("garita");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [soloHoy, setSoloHoy] = useState(true);
  const [tabletMode, setTabletMode] = useState(false);
  const [pasePrueba, setPasePrueba] = useState("CTA-2026-0891");

  const [scannerOpen, setScannerOpen] = useState(false);
  const [inspecting, setInspecting] = useState<Cita | null>(null);
  const [checkoutTurno, setCheckoutTurno] = useState<TurnoPatio | null>(null);
  const [driverPass, setDriverPass] = useState<string | null>(null);

  const citasQuery = useCitas({ sedeId, fecha: soloHoy ? todayIso() : undefined });
  const turnosQuery = useTurnosPatio({ sedeId });
  const salidasQuery = useHistorialSalidas(sedeId);
  const { data: muelles = [] } = useMuelles(sedeId);
  const { data: proveedores = [] } = useProveedores();
  const { data: vehiculos = [] } = useVehiculos();
  const { data: conductores = [] } = useConductores();

  const citas = (citasQuery.data ?? []).filter((c) => ESTADOS_GARITA.has(c.estado));
  const turnos = turnosQuery.data ?? [];
  const salidas = salidasQuery.data ?? [];

  const q = deferredSearch.toLowerCase().trim();
  const citasFiltradas = citas.filter((c) => {
    if (!q) return true;
    const veh = vehiculos.find((v) => v.id === c.vehiculoId);
    const cond = conductores.find((x) => x.id === c.conductorId);
    return (
      c.codigoCita.toLowerCase().includes(q) ||
      Boolean(veh?.placa.toLowerCase().includes(q)) ||
      Boolean(cond && `${cond.nombres} ${cond.apellidos}`.toLowerCase().includes(q)) ||
      Boolean(cond?.numeroDocumento.includes(q))
    );
  });
  const pendientesGarita = citas.filter((c) => c.estado === "CONFIRMADA" || c.estado === "SOLICITADA" || c.estado === "EN_PORTERIA");

  const openInspection = (cita: Cita) => {
    setScannerOpen(false);
    setInspecting(cita);
  };

  const columns: Column<Cita>[] = [
    {
      key: "radicado",
      header: "Radicado",
      render: (c) => (
        <div>
          <span className="font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
            {c.codigoCita}
          </span>
          <div className="text-[11px]" style={{ color: "var(--list-text-sub)" }}>
            {c.fechaCita}
          </div>
        </div>
      ),
    },
    {
      key: "vehiculo",
      header: "Vehículo y conductor",
      render: (c) => {
        const veh = vehiculos.find((v) => v.id === c.vehiculoId);
        const cond = conductores.find((x) => x.id === c.conductorId);
        return (
          <div>
            <span className="flex items-center gap-1.5 font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--atom-blue-500)" }}>
              <Truck size={13} /> {veh?.placa ?? "PLACA-PEND"}
            </span>
            <div className="max-w-[170px] truncate text-[11px]" style={{ color: "var(--list-text-sub)" }}>
              {cond ? `${cond.nombres} ${cond.apellidos}` : "Conductor por asignar"}
            </div>
          </div>
        );
      },
    },
    {
      key: "proveedor",
      header: "Proveedor",
      hideOnMobile: true,
      render: (c) => {
        const muelle = muelles.find((m) => m.id === c.muelleId);
        return (
          <div>
            <div className="max-w-[180px] truncate font-medium">{proveedores.find((p) => p.id === c.proveedorId)?.razonSocial ?? "Proveedor"}</div>
            <div className="text-[11px]" style={{ color: "var(--list-text-sub)" }}>
              {c.items.length} ítems · {muelle?.materialesPermitidos.includes("REFRIGERADOS") ? "Cadena de frío" : "Carga seca"}
            </div>
          </div>
        );
      },
    },
    {
      key: "horario",
      header: "Horario",
      hideOnMobile: true,
      render: (c) => (
        <div>
          <span className="flex items-center gap-1" style={{ fontFamily: "var(--font-mono)" }}>
            <Clock size={12} style={{ color: "var(--list-text-sub)" }} />
            {formatIsoHour(c.tiempos.horaProgramadaInicio)} – {formatIsoHour(c.tiempos.horaProgramadaFin)}
          </span>
          <div className="text-[11px]" style={{ color: "var(--list-text-sub)" }}>
            {muelles.find((m) => m.id === c.muelleId)?.nombre ?? "Bahía por asignar"}
          </div>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (c) => (
        <div className="flex flex-col items-start gap-1">
          <Badge size="sm" tone={ESTADO_CITA[c.estado].tone}>
            {ESTADO_CITA[c.estado].label}
          </Badge>
          {c.inspeccionPorteriaAprobada && (
            <span className="flex items-center gap-1 text-[10.5px]" style={{ color: "var(--kpi-icon-pos-color)" }}>
              <CheckCircle2 size={11} /> Inspección OK
            </span>
          )}
        </div>
      ),
    },
    {
      key: "accion",
      header: "",
      align: "right",
      render: (c) => (
        <Button size={tabletMode ? "md" : "sm"} leftIcon={<ShieldCheck size={13} />} onClick={() => openInspection(c)} disabled={c.estado === "COMPLETADA"}>
          Inspeccionar
        </Button>
      ),
    },
  ];

  const salidaColumns: Column<RegistroSalidaPorteria>[] = [
    { key: "hora", header: "Salida", render: (s) => <span style={{ fontFamily: "var(--font-mono)" }}>{formatTime(s.horaSalida)}</span> },
    { key: "cita", header: "Radicado", render: (s) => <span style={{ fontFamily: "var(--font-mono)" }}>{s.codigoCita}</span> },
    { key: "placa", header: "Placa", render: (s) => <span style={{ fontFamily: "var(--font-mono)" }}>{s.vehiculoPlaca}</span> },
    { key: "conductor", header: "Conductor", hideOnMobile: true, render: (s) => s.conductorNombre },
    { key: "estibas", header: "Estibas", hideOnMobile: true, align: "right", render: (s) => s.estibasRetornadasCount },
    {
      key: "estadia",
      header: "Estadía",
      align: "right",
      render: (s) => (
        <Badge size="sm" tone={s.cumplioSlaEstadia ? "green" : "coral"}>
          {s.tiempoTotalEstadiaMinutos} min
        </Badge>
      ),
    },
  ];

  const inspectingLookup = inspecting
    ? {
        muelle: muelles.find((m) => m.id === inspecting.muelleId),
        proveedor: proveedores.find((p) => p.id === inspecting.proveedorId),
        vehiculo: vehiculos.find((v) => v.id === inspecting.vehiculoId),
        conductor: conductores.find((c) => c.id === inspecting.conductorId),
      }
    : {};

  return (
    <PageContainer>
      <PageHeader
        title="Control de acceso y garita"
        description="Ingreso en portería, inspección de seguridad vehicular, pase digital del conductor y llamados a patio."
        actions={
          <>
            <Button variant="secondary" leftIcon={<Smartphone size={15} />} onClick={() => setDriverPass(pasePrueba)}>
              Pase digital chofer
            </Button>
            <Button leftIcon={<QrCode size={15} />} onClick={() => setScannerOpen(true)}>
              Escanear pase QR
            </Button>
          </>
        }
      />

      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: "garita", label: "Garita y portería", icon: <ShieldCheck size={14} />, badge: pendientesGarita.length },
          { value: "conductor", label: "Pase móvil conductor", icon: <Smartphone size={14} /> },
          { value: "patio", label: "Gestión de patio", icon: <Radio size={14} />, badge: turnos.filter((t) => t.estado !== "SALIDA_REGISTRADA").length },
        ]}
      />

      <TabsPanel value="garita" activeValue={tab} className="space-y-4">
        <Surface className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--kpi-icon-pos-bg)", color: "var(--kpi-icon-pos-color)" }}>
              <Tablet size={18} />
            </span>
            <div>
              <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold" style={{ color: "var(--list-text)" }}>
                Puesto de control: garita principal
                <Badge size="sm" tone="green">
                  Sistema activo
                </Badge>
              </p>
              <p className="text-[12px]" style={{ color: "var(--sect-sub)" }}>
                Validación de ingreso, EPP, documentos y asignación de turno de patio.
              </p>
            </div>
          </div>
          <Switch id="tablet-mode" size="sm" checked={tabletMode} onChange={setTabletMode} label="Modo tablet" description="Filas amplias para pantallas táctiles" />
        </Surface>

        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Radicado, placa, conductor o cédula…"
            aria-label="Buscar citas en garita"
            containerClassName="lg:max-w-sm"
          />
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {availableSedes.length > 1 && (
              <div className="sm:w-52">
                <Select value={sedeId} onChange={(e) => setActiveSedeId(e.target.value)} aria-label="Sede">
                  {availableSedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.codigo})
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <SegmentedControl<string>
              ariaLabel="Rango de fechas"
              value={soloHoy ? "HOY" : "TODAS"}
              onChange={(v) => setSoloHoy(v === "HOY")}
              options={[
                { value: "HOY", label: "Hoy" },
                { value: "TODAS", label: "Todas" },
              ]}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={citasFiltradas}
          rowKey={(c) => c.id}
          caption="Citas para gestión en garita"
          density={tabletMode ? "comfortable" : "compact"}
          emptyState={
            <EmptyState
              icon={ShieldCheck}
              title={citasQuery.isLoading ? "Cargando citas…" : "Sin citas pendientes en garita"}
              description={citasQuery.isLoading ? undefined : soloHoy ? "No hay citas hoy para esta sede. Prueba con «Todas»." : "Ajusta la búsqueda o cambia de sede."}
            />
          }
        />
      </TabsPanel>

      <TabsPanel value="conductor" activeValue={tab} className="space-y-4">
        <Surface className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--tone-navy-bg)", color: "var(--tone-navy-color)" }}>
              <Smartphone size={18} />
            </span>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--list-text)" }}>
                Portal móvil para conductores
              </p>
              <p className="text-[12px]" style={{ color: "var(--sect-sub)" }}>
                Pase de acceso QR, turno en patio, muelle asignado y estado de descargue en tiempo real.
              </p>
            </div>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (pasePrueba.trim()) setDriverPass(pasePrueba.trim());
            }}
          >
            <Input value={pasePrueba} onChange={(e) => setPasePrueba(e.target.value)} aria-label="Radicado, placa o cédula" className="sm:w-48" />
            <Button type="submit" leftIcon={<Smartphone size={14} />}>
              Ver pase
            </Button>
          </form>
        </Surface>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: QrCode,
              title: "1. Pase digital de acceso",
              text: "El transportista presenta su código QR dinámico cifrado en garita para verificación instantánea sin papeles.",
              tile: "Validación en garita",
              hint: "QR por radicado, placa o cédula",
              tone: "green" as const,
              badge: "Válido hoy",
            },
            {
              icon: Radio,
              title: "2. Llamado a bahía en vivo",
              text: "Notificación y cambio de pantalla cuando el muelle está desocupado y listo para recibir el camión.",
              tile: "Muelle asignado",
              hint: "Posición en fila y bahía destino",
              tone: "navy" as const,
              badge: "En vivo",
            },
            {
              icon: CheckCircle2,
              title: "3. Paz y salvo digital",
              text: "Conformidad de descargue, cálculo de dwell time y autorización de salida en garita.",
              tile: "Checkout autorizado",
              hint: "Firma del conductor con hash",
              tone: "blue" as const,
              badge: "Listo",
            },
          ].map(({ icon: Icon, ...card }) => (
            <Surface key={card.title} className="space-y-3 p-5">
              <SectionHeading icon={<Icon size={13} />} title={card.title} />
              <p className="text-[12.5px]" style={{ color: "var(--sect-sub)" }}>
                {card.text}
              </p>
              <div
                className="flex items-center justify-between gap-2 rounded-lg border p-3"
                style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}
              >
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold" style={{ color: "var(--list-text)" }}>
                    {card.tile}
                  </div>
                  <div className="truncate text-[11px]" style={{ color: "var(--list-text-sub)" }}>
                    {card.hint}
                  </div>
                </div>
                <Badge size="sm" tone={card.tone}>
                  {card.badge}
                </Badge>
              </div>
            </Surface>
          ))}
        </div>
      </TabsPanel>

      <TabsPanel value="patio" activeValue={tab} className="space-y-5">
        <YardQueueBoard turnos={turnos} muelles={muelles} loading={turnosQuery.isLoading} onCheckout={setCheckoutTurno} onDriverPass={setDriverPass} />

        <div className="space-y-3">
          <SectionHeading icon={<History size={13} />} title="Historial de salidas" description="Registros de check-out de la sede activa con cumplimiento de SLA de estadía." />
          <DataTable
            columns={salidaColumns}
            rows={salidas}
            rowKey={(s) => s.id}
            caption="Historial de salidas"
            emptyState={<EmptyState icon={History} title={salidasQuery.isLoading ? "Cargando historial…" : "Sin salidas registradas"} />}
          />
        </div>
      </TabsPanel>

      <GateScannerModal
        open={scannerOpen}
        citas={pendientesGarita}
        muelles={muelles}
        proveedores={proveedores}
        vehiculos={vehiculos}
        conductores={conductores}
        onClose={() => setScannerOpen(false)}
        onSelect={openInspection}
      />

      <GateInspectionModal cita={inspecting} {...inspectingLookup} onClose={() => setInspecting(null)} />

      <GateCheckoutModal
        turno={checkoutTurno}
        cita={checkoutTurno ? (citasQuery.data ?? []).find((c) => c.id === checkoutTurno.citaId) : undefined}
        onClose={() => setCheckoutTurno(null)}
      />

      <DriverPassModal codigo={driverPass} onClose={() => setDriverPass(null)} />
    </PageContainer>
  );
}
