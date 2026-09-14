"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Bot,
  Boxes,
  Building2,
  CalendarRange,
  Check,
  Clock,
  Download,
  FileCheck2,
  Leaf,
  ScanLine,
  ShieldCheck,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import { PageContainer } from "@/components/templates/PageContainer";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tabs, TabsPanel } from "@/components/molecules/Tabs";
import { KpiCard } from "@/components/molecules/KpiCard";
import { DataTable, type Column } from "@/components/molecules/DataTable";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import { SearchInput } from "@/components/molecules/SearchInput";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { InfoTile } from "@/components/molecules/InfoTile";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Surface } from "@/components/atoms/Surface";
import { Button } from "@/components/atoms/Button";
import { Badge, type BadgeTone } from "@/components/atoms/Badge";
import { Alert } from "@/components/atoms/Alert";
import { Input } from "@/components/atoms/Input";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { MultiAreaChart } from "@/components/atoms/charts/MultiAreaChart";
import { GroupedBarChart } from "@/components/atoms/charts/GroupedBarChart";
import { useIndicadores } from "@/hooks/useIndicadores";
import { formatFriendlyDate, formatNumber, shiftIsoDate, toIsoDate, todayIso } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { DocumentoOcrAnalisis, Kpi, RecomendacionOptimizacionIA, ScorecardProveedorItem } from "@/types";

type DatePreset = "HOY" | "AYER" | "ULTIMOS_7" | "ESTE_MES" | "ULTIMOS_30" | "PERSONALIZADO";

function rangeForPreset(preset: Exclude<DatePreset, "PERSONALIZADO">): [string, string] {
  const today = todayIso();
  switch (preset) {
    case "HOY":
      return [today, today];
    case "AYER": {
      const y = shiftIsoDate(today, -1);
      return [y, y];
    }
    case "ULTIMOS_7":
      return [shiftIsoDate(today, -6), today];
    case "ULTIMOS_30":
      return [shiftIsoDate(today, -29), today];
    case "ESTE_MES": {
      const now = new Date();
      return [toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)), today];
    }
  }
}

const RIESGO: Record<ScorecardProveedorItem["nivelRiesgo"], { label: string; tone: BadgeTone }> = {
  BAJO: { label: "Riesgo bajo", tone: "green" },
  MEDIO: { label: "Riesgo medio", tone: "amber" },
  ALTO: { label: "Riesgo alto", tone: "coral" },
};

const URGENCIA: Record<RecomendacionOptimizacionIA["nivelUrgencia"], { label: string; tone: BadgeTone }> = {
  CRITICA: { label: "Prioridad alta", tone: "coral" },
  MEDIA: { label: "Prioridad media", tone: "amber" },
  INFORMATIVA: { label: "Informativa", tone: "blue" },
};

const GRAVEDAD: Record<DocumentoOcrAnalisis["discrepanciasDetectadas"][number]["gravedad"], "error" | "warning" | "info"> = {
  BLOQUEANTE: "error",
  ADVERTENCIA: "warning",
  INFO: "info",
};

export function DashboardView() {
  const [tab, setTab] = useState("resumen");
  const [preset, setPreset] = useState<DatePreset>("ESTE_MES");
  const [[startDate, endDate], setRange] = useState<[string, string]>(() => rangeForPreset("ESTE_MES"));
  const [supplierSearch, setSupplierSearch] = useState("");

  const { days, metricas: m, scorecards, curvaDemanda, desgloseDwell, recomendacionesIniciales, documentosOcr } =
    useIndicadores(startDate, endDate);

  const [aplicadas, setAplicadas] = useState<Set<string>>(
    () => new Set(recomendacionesIniciales.filter((r) => r.aplicado).map((r) => r.id))
  );
  const [selectedDocId, setSelectedDocId] = useState(documentosOcr[0]?.id);
  const selectedDoc = documentosOcr.find((d) => d.id === selectedDocId) ?? documentosOcr[0];

  const pendientes = recomendacionesIniciales.filter((r) => !aplicadas.has(r.id)).length;
  const periodoLabel = `${formatFriendlyDate(startDate)} — ${formatFriendlyDate(endDate)}`;

  const handlePreset = (value: DatePreset) => {
    setPreset(value);
    if (value !== "PERSONALIZADO") setRange(rangeForPreset(value));
  };

  const handleCustomDate = (which: "start" | "end", value: string) => {
    if (!value) return;
    setPreset("PERSONALIZADO");
    setRange(([s, e]) =>
      which === "start" ? [value, value > e ? value : e] : [value < s ? value : s, value]
    );
  };

  const handleExportCsv = () => {
    const header = "Proveedor,Citas,Puntualidad %,Cumplimiento estibas %,Rechazos garita,Dwell time prom (min),Riesgo";
    const rows = scorecards.map((s) =>
      [
        `"${s.nombreProveedor}"`,
        s.totalCitasMes,
        s.puntualidadPorcentaje,
        s.cumplimientoEstibasPorcentaje,
        s.rechazosPorteriaCount,
        s.dwellTimePromedioMins,
        s.nivelRiesgo,
      ].join(",")
    );
    const csv = [`Reporte gerencial SWAC — ${startDate} a ${endDate} (${days} días)`, header, ...rows].join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `reporte-gerencial_${startDate}_${endDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Reporte del período ${periodoLabel} exportado a CSV.`);
  };

  const estibasPct = (m.estibasProcesadasHoy / m.estibasCapacidadTotalHoy) * 100;
  const kpis: Kpi[] = [
    {
      icon: TrendingUp,
      label: "Entregas a tiempo",
      value: `${m.otifGlobalPorcentaje}%`,
      subValue: `Meta mínima ${m.otifMetaPorcentaje}%`,
      trend: "up",
      trendValue: "+1.8% vs. período anterior",
      iconBg: "var(--kpi-icon-pos-bg)",
      iconColor: "var(--kpi-icon-pos-color)",
      progress: m.otifGlobalPorcentaje,
      progressColor: "var(--solid-green)",
    },
    {
      icon: Building2,
      label: "Muelles en uso",
      value: `${m.ocupacionMuellesPorcentaje}%`,
      subValue: "Capacidad óptima",
      iconBg: "var(--kpi-icon-info-bg)",
      iconColor: "var(--kpi-icon-info-color)",
      progress: m.ocupacionMuellesPorcentaje,
    },
    {
      icon: Clock,
      label: "Tiempo en bodega",
      value: `${m.dwellTimePromedioMinutos} min`,
      subValue: `Límite ${m.dwellTimeMetaMinutos} min`,
      iconBg: "var(--tone-amber-bg)",
      iconColor: "var(--tone-amber-color)",
      progress: (m.dwellTimePromedioMinutos / m.dwellTimeMetaMinutos) * 100,
      progressColor: "var(--solid-amber)",
    },
    {
      icon: Boxes,
      label: days === 1 ? "Estibas hoy" : "Estibas del período",
      value: formatNumber(m.estibasProcesadasHoy),
      subValue: `${estibasPct.toFixed(0)}% de ${formatNumber(m.estibasCapacidadTotalHoy)}`,
      iconBg: "var(--tone-navy-bg)",
      iconColor: "var(--tone-navy-color)",
      progress: estibasPct,
      progressColor: "var(--solid-navy)",
    },
    {
      icon: Truck,
      label: days === 1 ? "Camiones hoy" : "Camiones del período",
      value: formatNumber(m.citasTotalesHoy),
      subValue: `${formatNumber(m.citasCompletadasHoy)} atendidos · ${m.citasEnProcesoHoy} en atención`,
      iconBg: "var(--kpi-icon-info-bg)",
      iconColor: "var(--kpi-icon-info-color)",
      progress: (m.citasCompletadasHoy / Math.max(1, m.citasTotalesHoy)) * 100,
    },
    {
      icon: Leaf,
      label: "CO₂ evitado",
      value: `${formatNumber(m.emisionesCo2EvitadasKg, 1)} kg`,
      subValue: "Menos colas con motor encendido",
      iconBg: "var(--kpi-icon-pos-bg)",
      iconColor: "var(--kpi-icon-pos-color)",
    },
  ];

  const filteredScorecards = useMemo(
    () => scorecards.filter((s) => s.nombreProveedor.toLowerCase().includes(supplierSearch.toLowerCase().trim())),
    [scorecards, supplierSearch]
  );

  const scorecardColumns: Column<ScorecardProveedorItem>[] = [
    {
      key: "proveedor",
      header: "Proveedor",
      render: (s) => (
        <div className="min-w-[180px]">
          <div className="font-medium">{s.nombreProveedor}</div>
          <div className="text-[11px]" style={{ color: "var(--list-text-sub)" }}>
            Calificación {s.calificacionGeneral} ★
          </div>
        </div>
      ),
    },
    { key: "citas", header: "Citas", align: "right", render: (s) => formatNumber(s.totalCitasMes) },
    {
      key: "puntualidad",
      header: "Puntualidad",
      render: (s) => (
        <div className="flex min-w-[120px] items-center gap-2">
          <ProgressBar
            value={s.puntualidadPorcentaje}
            className="w-16"
            color={
              s.puntualidadPorcentaje >= 95
                ? "var(--solid-green)"
                : s.puntualidadPorcentaje >= 85
                  ? "var(--solid-amber)"
                  : "var(--solid-coral)"
            }
          />
          <span style={{ fontFamily: "var(--font-mono)" }}>{s.puntualidadPorcentaje}%</span>
        </div>
      ),
    },
    { key: "carga", header: "Carga completa", hideOnMobile: true, align: "right", render: (s) => `${s.cumplimientoEstibasPorcentaje}%` },
    {
      key: "rechazos",
      header: "Rechazos garita",
      hideOnMobile: true,
      align: "right",
      render: (s) => (
        <span style={{ color: s.rechazosPorteriaCount > 0 ? "var(--atom-coral-500)" : "var(--atom-green-500)" }}>
          {s.rechazosPorteriaCount}
        </span>
      ),
    },
    { key: "dwell", header: "Tiempo prom.", hideOnMobile: true, align: "right", render: (s) => `${s.dwellTimePromedioMins} min` },
    {
      key: "riesgo",
      header: "Riesgo",
      align: "right",
      render: (s) => (
        <Badge size="sm" tone={RIESGO[s.nivelRiesgo].tone}>
          {RIESGO[s.nivelRiesgo].label}
        </Badge>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Panel de control e indicadores"
        description="Monitoreo de la operación, cumplimiento de proveedores y rendimiento de muelles."
        actions={
          <Button leftIcon={<Download size={15} />} onClick={handleExportCsv}>
            Exportar reporte
          </Button>
        }
      />

      {/* Período de análisis */}
      <Surface className="mb-5 flex flex-col gap-4 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--kpi-icon-info-bg)", color: "var(--kpi-icon-info-color)" }}
          >
            <CalendarRange size={18} />
          </span>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--sect-title)" }}>
              {periodoLabel}
            </p>
            <p className="text-[12px]" style={{ color: "var(--sect-sub)" }}>
              Período de análisis · {days} {days === 1 ? "día" : "días"}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <SegmentedControl<DatePreset>
            ariaLabel="Período predefinido"
            value={preset}
            onChange={handlePreset}
            options={[
              { value: "HOY", label: "Hoy" },
              { value: "AYER", label: "Ayer" },
              { value: "ULTIMOS_7", label: "7 días" },
              { value: "ESTE_MES", label: "Este mes" },
              { value: "ULTIMOS_30", label: "30 días" },
              { value: "PERSONALIZADO", label: "Personalizado" },
            ]}
          />
          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label="Desde"
              value={startDate}
              max={endDate}
              onChange={(e) => handleCustomDate("start", e.target.value)}
              className="h-8 w-[150px] text-[12px]"
            />
            <span className="text-[12px]" style={{ color: "var(--result-text)" }}>
              a
            </span>
            <Input
              type="date"
              aria-label="Hasta"
              value={endDate}
              min={startDate}
              onChange={(e) => handleCustomDate("end", e.target.value)}
              className="h-8 w-[150px] text-[12px]"
            />
          </div>
        </div>
      </Surface>

      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: "resumen", label: "Resumen general", icon: <BarChart3 size={14} /> },
          { value: "proveedores", label: "Proveedores", icon: <ShieldCheck size={14} />, badge: scorecards.length },
          { value: "alertas", label: "Optimización y alertas", icon: <Bot size={14} />, badge: pendientes },
          { value: "ocr", label: "Auditoría documental", icon: <ScanLine size={14} /> },
          { value: "informe", label: "Informe gerencial", icon: <FileCheck2 size={14} /> },
        ]}
      />

      {/* ── Resumen ── */}
      <TabsPanel value="resumen" activeValue={tab} className="space-y-5">
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} kpi={kpi} />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <Surface className="p-5 lg:col-span-2">
            <SectionHeading
              icon={<TrendingUp size={13} />}
              title="Horas pico: demanda vs. capacidad"
              description="Estibas programadas frente a la capacidad disponible de muelles por hora."
              className="mb-4"
            />
            <MultiAreaChart
              ariaLabel="Demanda agendada frente a capacidad disponible por hora"
              labels={curvaDemanda.map((c) => c.hora)}
              series={[
                { label: "Demanda agendada (estibas)", data: curvaDemanda.map((c) => c.demandaAgendadaEstibas), color: "var(--solid-blue)", fill: true },
                { label: "Capacidad disponible (estibas)", data: curvaDemanda.map((c) => c.capacidadDisponibleEstibas), color: "var(--solid-green)", dashed: true },
              ]}
            />
          </Surface>
          <Surface className="p-5">
            <SectionHeading
              icon={<Clock size={13} />}
              title="Tiempo por etapa"
              description="Minutos reales promedio vs. meta (SLA)."
              className="mb-4"
            />
            <GroupedBarChart
              ariaLabel="Tiempo real frente a meta por etapa operativa"
              unit=" min"
              data={desgloseDwell.map((d) => ({ label: d.fase, values: [d.tiempoMinutos, d.slaMinutos] }))}
              series={[
                { label: "Tiempo real", color: "var(--solid-amber)" },
                { label: "Meta máxima", color: "var(--solid-slate)" },
              ]}
            />
          </Surface>
        </div>
      </TabsPanel>

      {/* ── Proveedores ── */}
      <TabsPanel value="proveedores" activeValue={tab} className="space-y-4">
        <SearchInput
          value={supplierSearch}
          onChange={(e) => setSupplierSearch(e.target.value)}
          placeholder="Buscar proveedor por nombre…"
          aria-label="Buscar proveedor"
          containerClassName="max-w-md"
        />
        <DataTable
          columns={scorecardColumns}
          rows={filteredScorecards}
          rowKey={(s) => s.proveedorId}
          caption="Calificación de proveedores del período"
          emptyState={<EmptyState icon={ShieldCheck} title="Sin proveedores" description="Ningún proveedor coincide con la búsqueda." />}
        />
      </TabsPanel>

      {/* ── Optimización ── */}
      <TabsPanel value="alertas" activeValue={tab} className="space-y-4">
        <Alert variant="info" title="Asistente de patio y muelles">
          Recomendaciones automáticas para evitar congestión y agilizar el descargue.
        </Alert>
        <div className="grid gap-4 md:grid-cols-2">
          {recomendacionesIniciales.map((rec) => {
            const aplicada = aplicadas.has(rec.id);
            const urgencia = URGENCIA[rec.nivelUrgencia];
            return (
              <Surface key={rec.id} className={cn("flex flex-col gap-3 p-5", aplicada && "opacity-75")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge size="sm" tone={urgencia.tone}>
                    {urgencia.label}
                  </Badge>
                  <span className="text-[11.5px] font-medium" style={{ color: "var(--atom-green-500)" }}>
                    {rec.impactoEstimado}
                  </span>
                </div>
                <div>
                  <h3 className="text-[13.5px] font-semibold" style={{ color: "var(--card-title)" }}>
                    {rec.titulo}
                  </h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "var(--card-desc)" }}>
                    {rec.descripcion}
                  </p>
                </div>
                <div
                  className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3"
                  style={{ borderColor: "var(--card-divider)" }}
                >
                  <span className="text-[12px]" style={{ color: "var(--sect-sub)" }}>
                    Acción: {rec.accionSugerida}
                  </span>
                  {aplicada ? (
                    <span className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: "var(--atom-green-500)" }}>
                      <Check size={14} /> Aplicada
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      leftIcon={<Zap size={13} />}
                      onClick={() => {
                        setAplicadas((prev) => new Set(prev).add(rec.id));
                        toast.success("Recomendación aplicada al cronograma de bahías.");
                      }}
                    >
                      Aplicar sugerencia
                    </Button>
                  )}
                </div>
              </Surface>
            );
          })}
        </div>
      </TabsPanel>

      {/* ── OCR ── */}
      <TabsPanel value="ocr" activeValue={tab}>
        <div className="grid gap-4 lg:grid-cols-3">
          <Surface className="p-4">
            <SectionHeading title="Documentos escaneados" className="mb-3" />
            <ul className="space-y-2">
              {documentosOcr.map((doc) => {
                const active = doc.id === selectedDoc?.id;
                return (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedDocId(doc.id)}
                      className="w-full rounded-lg border p-3 text-left transition-colors"
                      style={{
                        background: active ? "var(--chip-bg-active)" : "transparent",
                        borderColor: active ? "var(--chip-border-active)" : "var(--card-border)",
                      }}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate text-[12.5px] font-semibold" style={{ color: "var(--list-text)" }}>
                          {doc.datosExtraidos.numeroDocumento ?? doc.tipoDocumento}
                        </span>
                        <Badge size="sm" tone={doc.estadoValidacion === "VALIDO" ? "green" : "amber"}>
                          {doc.confianzaGlobal}%
                        </Badge>
                      </div>
                      <span className="block truncate text-[11px]" style={{ color: "var(--list-text-sub)" }}>
                        {doc.nombreArchivo}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Surface>

          {selectedDoc && (
            <Surface className="space-y-4 p-5 lg:col-span-2">
              <SectionHeading
                icon={<ScanLine size={13} />}
                title={`Datos leídos · ${selectedDoc.nombreArchivo}`}
                actions={
                  <Badge tone={selectedDoc.discrepanciasDetectadas.length > 0 ? "amber" : "green"}>
                    {selectedDoc.discrepanciasDetectadas.length > 0 ? "Revisar detalle" : "Todo coincide"}
                  </Badge>
                }
              />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <InfoTile label="Orden de compra" value={selectedDoc.datosExtraidos.ordenCompraRelacionada ?? "N/A"} mono />
                <InfoTile label="Placa" value={selectedDoc.datosExtraidos.placaVehiculo ?? "N/A"} mono />
                <InfoTile label="Estibas" value={selectedDoc.datosExtraidos.totalEstibas ?? "N/A"} />
                <InfoTile
                  label="Temperatura"
                  value={
                    selectedDoc.datosExtraidos.temperaturaRegistradaC !== undefined
                      ? `${selectedDoc.datosExtraidos.temperaturaRegistradaC} °C`
                      : "Ambiente"
                  }
                />
              </div>

              {selectedDoc.discrepanciasDetectadas.map((d) => (
                <Alert key={d.campo} variant={GRAVEDAD[d.gravedad]} title={`${d.campo}: ${d.valorDocumento}`}>
                  {d.explicacion} <span className="opacity-80">(Sistema: {d.valorCitaSistema})</span>
                </Alert>
              ))}

              {selectedDoc.datosExtraidos.itemsDetalle?.length ? (
                <DataTable
                  caption="Ítems extraídos del documento"
                  rows={selectedDoc.datosExtraidos.itemsDetalle}
                  rowKey={(r) => r.codigoSku}
                  columns={[
                    { key: "sku", header: "Código", render: (r) => <span style={{ fontFamily: "var(--font-mono)" }}>{r.codigoSku}</span> },
                    { key: "desc", header: "Descripción", render: (r) => r.descripcion },
                    { key: "cant", header: "Cantidad", align: "right", render: (r) => formatNumber(r.cantidad) },
                    { key: "und", header: "Unidad", hideOnMobile: true, render: (r) => r.unidadMedida },
                  ]}
                />
              ) : null}
            </Surface>
          )}
        </div>
      </TabsPanel>

      {/* ── Informe ── */}
      <TabsPanel value="informe" activeValue={tab}>
        <Surface className="mx-auto max-w-4xl space-y-5 p-6">
          <SectionHeading
            title="Informe resumido para la dirección"
            description={`Período consolidado: ${periodoLabel} (${days} ${days === 1 ? "día" : "días"})`}
            actions={
              <Button variant="secondary" size="sm" leftIcon={<Download size={13} />} onClick={handleExportCsv}>
                Descargar informe
              </Button>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile label="Puntualidad global" value={`${m.otifGlobalPorcentaje}%`} />
            <InfoTile label="Muelles en uso" value={`${m.ocupacionMuellesPorcentaje}%`} />
            <InfoTile label="Espera promedio" value={`${m.dwellTimePromedioMinutos} min`} />
            <InfoTile label="CO₂ evitado" value={`${formatNumber(m.emisionesCo2EvitadasKg, 1)} kg`} />
          </div>
          <Alert variant="success" title="Operación fluida y cumplimiento satisfactorio">
            Durante el período analizado el centro de distribución operó con una eficiencia del {m.otifGlobalPorcentaje}%,
            procesando {formatNumber(m.estibasProcesadasHoy)} estibas y atendiendo {formatNumber(m.citasTotalesHoy)} camiones,
            con {m.citasRechazadasPorteriaHoy} rechazos en portería y {m.citasCanceladasHoy} cancelaciones.
          </Alert>
        </Surface>
      </TabsPanel>
    </PageContainer>
  );
}
