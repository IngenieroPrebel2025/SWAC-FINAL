"use client";

import { useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Truck, X, XCircle } from "lucide-react";
import { Surface } from "@/components/atoms/Surface";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { Badge } from "@/components/atoms/Badge";
import { Alert } from "@/components/atoms/Alert";
import { Field } from "@/components/molecules/Field";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { EmptyState } from "@/components/molecules/EmptyState";
import { evaluateDockCompatibility, type CompatibilityInput } from "@/lib/domain/dockCompatibility";
import { TIPO_MUELLE } from "@/lib/status";
import { MATERIALES_OPCIONES } from "./constants";
import type { Muelle, TipoMaterialPermitido, TipoMuelle } from "@/types";

const VEREDICTO = {
  PERFECT: { label: "100% compatible", tone: "green" as const, Icon: CheckCircle2, bg: "var(--st-active-bg)" },
  WARNING: { label: "Con restricción", tone: "amber" as const, Icon: AlertTriangle, bg: "var(--tone-amber-bg)" },
  INCOMPATIBLE: { label: "Incompatible", tone: "coral" as const, Icon: XCircle, bg: "var(--st-warning-bg)" },
};

export function CompatibilityChecker({ muelles, sedeNombre }: { muelles: Muelle[]; sedeNombre?: string }) {
  const [input, setInput] = useState<CompatibilityInput>({
    operacion: "RECEPCION",
    material: "SECOS",
    alturaMetros: 4,
    pesoToneladas: 28,
    requiereRampa: true,
  });
  const set = <K extends keyof CompatibilityInput>(key: K, value: CompatibilityInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const results = muelles
    .map((m) => ({ muelle: m, result: evaluateDockCompatibility(m, input) }))
    .sort((a, b) => a.result.reasons.filter((r) => !r.passed).length - b.result.reasons.filter((r) => !r.passed).length);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-3">
      <Surface className="space-y-4 p-5">
        <SectionHeading icon={<Truck size={13} />} title="Parámetros de carga y camión" />
        <Field label="Tipo de operación" htmlFor="cmp-op">
          <Select id="cmp-op" value={input.operacion} onChange={(e) => set("operacion", e.target.value as TipoMuelle)}>
            {(["RECEPCION", "DESPACHO", "CROSS_DOCKING", "DEVOLUCIONES"] as TipoMuelle[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_MUELLE[t].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tipo de mercancía" htmlFor="cmp-mat">
          <Select id="cmp-mat" value={input.material} onChange={(e) => set("material", e.target.value as TipoMaterialPermitido)}>
            {MATERIALES_OPCIONES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`Gálibo / altura del camión: ${input.alturaMetros.toFixed(1)} m`} htmlFor="cmp-alt" hint="3.0 m furgón · 4.0 m estándar · 5.0 m high cube">
          <input id="cmp-alt" type="range" min={3} max={5} step={0.1} value={input.alturaMetros} onChange={(e) => set("alturaMetros", Number(e.target.value))} className="w-full" />
        </Field>
        <Field label={`Peso bruto: ${input.pesoToneladas} t`} htmlFor="cmp-peso" hint="5 t turbo · 30 t tractomula · 55 t pesado">
          <input id="cmp-peso" type="range" min={5} max={55} step={1} value={input.pesoToneladas} onChange={(e) => set("pesoToneladas", Number(e.target.value))} className="w-full" />
        </Field>
        <Switch id="cmp-rampa" label="Requiere rampa hidráulica" checked={input.requiereRampa} onChange={(v) => set("requiereRampa", v)} />
        <Alert variant="info" title="Motor de restricciones">
          Evalúa tipo de operación, material, gálibo, peso, rampa y estado del muelle en tiempo real.
        </Alert>
      </Surface>

      <div className="space-y-3 lg:col-span-2">
        <SectionHeading title={`Evaluación en ${sedeNombre ?? "la sede"}`} description={`${muelles.length} muelles analizados`} />
        {results.length === 0 ? (
          <EmptyState title="Sin muelles para evaluar" />
        ) : (
          results.map(({ muelle, result }) => {
            const v = VEREDICTO[result.status];
            return (
              <Surface key={muelle.id} className="p-4" style={{ opacity: result.status === "INCOMPATIBLE" ? 0.85 : 1 }}>
                <div className="flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--card-divider)" }}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10.5px] font-bold text-white" style={{ background: "var(--sb-mark-gradient)", fontFamily: "var(--font-mono)" }}>
                      {muelle.codigoMuelle}
                    </span>
                    <span className="truncate text-[13px] font-semibold" style={{ color: "var(--card-title)" }}>
                      {muelle.nombre}
                    </span>
                  </div>
                  <Badge tone={v.tone}>
                    <v.Icon size={12} /> {v.label}
                  </Badge>
                </div>
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {result.reasons.map((r) => (
                    <li key={r.message} className="flex items-start gap-1.5 text-[12px]">
                      {r.passed ? (
                        <Check size={13} className="mt-0.5 shrink-0" style={{ color: "var(--atom-green-500)" }} />
                      ) : (
                        <X size={13} className="mt-0.5 shrink-0" style={{ color: "var(--atom-coral-500)" }} />
                      )}
                      <span style={{ color: r.passed ? "var(--sect-sub)" : "var(--atom-coral-500)" }}>{r.message}</span>
                    </li>
                  ))}
                </ul>
              </Surface>
            );
          })
        )}
      </div>
    </div>
  );
}
