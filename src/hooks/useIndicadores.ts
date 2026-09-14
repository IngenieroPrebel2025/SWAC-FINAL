"use client";

import { useMemo } from "react";
import {
  MOCK_CURVA_DEMANDA_HORARIA,
  MOCK_DESGLOSE_DWELL_TIME,
  MOCK_DOCUMENTOS_OCR,
  MOCK_RECOMENDACIONES_IA,
  MOCK_SCORECARD_PROVEEDORES,
} from "@/mocks/dashboard.mock";
import type { MetricasGerencialesGlobales, ScorecardProveedorItem } from "@/types";

function daysBetween(startIso: string, endIso: string): number {
  const [sy, sm, sd] = startIso.split("-").map(Number);
  const [ey, em, ed] = endIso.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd).getTime();
  const end = new Date(ey, em - 1, ed).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 1;
  return Math.round((end - start) / 86_400_000) + 1;
}

/**
 * Indicadores gerenciales del período. Hoy se derivan de los datos de
 * referencia; al conectar el backend basta con reemplazar este hook por
 * una consulta TanStack Query al endpoint de analítica.
 */
export function useIndicadores(startDate: string, endDate: string) {
  const days = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);

  const metricas = useMemo<MetricasGerencialesGlobales>(() => {
    const scale = (base: number, factor: number) => (days === 1 ? base : base * days * factor);
    return {
      otifGlobalPorcentaje: Number((96.8 + Math.sin(days) * 0.4).toFixed(1)),
      otifMetaPorcentaje: 95,
      ocupacionMuellesPorcentaje: Number((84.2 + Math.cos(days) * 2.1).toFixed(1)),
      dwellTimePromedioMinutos: Math.round(54 + Math.sin(days) * 2),
      dwellTimeMetaMinutos: 90,
      citasTotalesHoy: Math.round(scale(148, 0.95)),
      citasCompletadasHoy: Math.round(scale(112, 0.95)),
      citasEnProcesoHoy: days === 1 ? 28 : Math.round(28 * Math.min(days, 4)),
      citasCanceladasHoy: Math.round(scale(5, 0.85)),
      citasRechazadasPorteriaHoy: Math.round(scale(3, 0.7)),
      estibasProcesadasHoy: Math.round(scale(3640, 0.96)),
      estibasCapacidadTotalHoy: Math.round(scale(4320, 1)),
      toneladasMovilizadasHoy: Number(scale(1845.6, 0.96).toFixed(1)),
      emisionesCo2EvitadasKg: Number(scale(420.5, 0.95).toFixed(1)),
      tiempoAhorradoPorteriaMinutos: Math.round(scale(1420, 0.95)),
    };
  }, [days]);

  const scorecards = useMemo<ScorecardProveedorItem[]>(() => {
    const factor = Math.max(0.2, days / 30);
    return MOCK_SCORECARD_PROVEEDORES.map((s) => ({
      ...s,
      totalCitasMes: Math.max(1, Math.round(s.totalCitasMes * factor)),
      rechazosPorteriaCount: Math.round(s.rechazosPorteriaCount * factor),
    }));
  }, [days]);

  return {
    days,
    metricas,
    scorecards,
    curvaDemanda: MOCK_CURVA_DEMANDA_HORARIA,
    desgloseDwell: MOCK_DESGLOSE_DWELL_TIME,
    recomendacionesIniciales: MOCK_RECOMENDACIONES_IA,
    documentosOcr: MOCK_DOCUMENTOS_OCR,
  };
}
