"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, RotateCcw, Save, ShieldAlert, Snowflake } from "lucide-react";
import { Surface } from "@/components/atoms/Surface";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Alert } from "@/components/atoms/Alert";
import { Field } from "@/components/molecules/Field";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import { capacidadSchema, type CapacidadData } from "@/schemas/cita.schema";
import { toast } from "@/lib/toast";

const DEFAULTS: CapacidadData = {
  tiempoManiobraMinutos: 15,
  tiempoBufferEntreCitasMinutos: 15,
  minutosBasePorDefecto: 15,
  minutosPorEstibaSecos: 4.5,
  minutosPorEstibaFrio: 6,
  minutosPorEstibaCongelado: 7,
  minutosPorEstibaAseo: 5,
  toleranciaImpuntualidadMinutos: 20,
};

type TipoCarga = "SECOS" | "FRIO" | "CONGELADO" | "ASEO";

const RATE_FIELD: Record<TipoCarga, keyof CapacidadData> = {
  SECOS: "minutosPorEstibaSecos",
  FRIO: "minutosPorEstibaFrio",
  CONGELADO: "minutosPorEstibaCongelado",
  ASEO: "minutosPorEstibaAseo",
};

const RATE_LABEL: Record<TipoCarga, string> = {
  SECOS: "Abarrotes y secos",
  FRIO: "Lácteos y frío (0–4 °C)",
  CONGELADO: "Ultracongelados (−18 °C)",
  ASEO: "Aseo y cuidado personal",
};

/** Parámetros del algoritmo de duración de slot + simulador en vivo. */
export function CapacityParametersPanel() {
  const [simTipo, setSimTipo] = useState<TipoCarga>("FRIO");
  const [simEstibas, setSimEstibas] = useState(18);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<CapacidadData>({ resolver: zodResolver(capacidadSchema), defaultValues: DEFAULTS });

  const params = watch();
  const rate = Number(params[RATE_FIELD[simTipo]]) || 0;
  const descargue = Math.ceil(simEstibas * rate);
  const total = Math.max(30, (Number(params.tiempoManiobraMinutos) || 0) + descargue);

  const onSubmit = handleSubmit((data) => {
    reset(data);
    toast.success("Parámetros de capacidad guardados y aplicados al motor de citas.");
  });

  return (
    <div className="grid items-start gap-5 lg:grid-cols-12">
      <form onSubmit={onSubmit} noValidate className="lg:col-span-7">
        <Surface className="space-y-5 p-5">
          <SectionHeading
            title="Tiempos base y productividad"
            description="Algoritmo de estimación de duración según naturaleza del producto, estibas y maniobra."
            actions={
              <Button type="button" variant="ghost" size="sm" leftIcon={<RotateCcw size={13} />} onClick={() => reset(DEFAULTS)}>
                Restablecer
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Maniobra y acople (min)" htmlFor="cap-man" error={errors.tiempoManiobraMinutos?.message} hint="Apertura de compuertas y acople en muelle">
              <Input id="cap-man" type="number" {...register("tiempoManiobraMinutos", { valueAsNumber: true })} />
            </Field>
            <Field label="Buffer entre citas (min)" htmlFor="cap-buf" error={errors.tiempoBufferEntreCitasMinutos?.message} hint="Holgura obligatoria entre citas consecutivas">
              <Input id="cap-buf" type="number" {...register("tiempoBufferEntreCitasMinutos", { valueAsNumber: true })} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(RATE_FIELD) as TipoCarga[]).map((tipo) => (
              <Field key={tipo} label={`${RATE_LABEL[tipo]}: ${params[RATE_FIELD[tipo]]} min/estiba`} htmlFor={`cap-${tipo}`}>
                <input id={`cap-${tipo}`} type="range" min={2} max={18} step={0.5} className="w-full" {...register(RATE_FIELD[tipo], { valueAsNumber: true })} />
              </Field>
            ))}
          </div>

          <Field
            label="Tolerancia de retraso antes de no-show (min)"
            htmlFor="cap-tol"
            error={errors.toleranciaImpuntualidadMinutos?.message}
            hint="Si el vehículo supera esta ventana, el slot se libera y pasa a lista de espera."
          >
            <Input id="cap-tol" type="number" className="sm:w-40" {...register("toleranciaImpuntualidadMinutos", { valueAsNumber: true })} />
          </Field>

          <div className="flex justify-end border-t pt-4" style={{ borderColor: "var(--card-divider)" }}>
            <Button type="submit" leftIcon={<Save size={14} />} disabled={!isDirty}>
              Guardar parámetros
            </Button>
          </div>
        </Surface>
      </form>

      <Surface className="space-y-4 p-5 lg:col-span-5">
        <SectionHeading icon={<Calculator size={13} />} title="Simulador de cálculo de slot" />
        <SegmentedControl<TipoCarga>
          ariaLabel="Tipo de mercancía"
          value={simTipo}
          onChange={setSimTipo}
          options={[
            { value: "SECOS", label: "Secos" },
            { value: "FRIO", label: "Frío", icon: <Snowflake size={12} /> },
            { value: "CONGELADO", label: "Congelado" },
            { value: "ASEO", label: "Aseo" },
          ]}
        />
        <Field label={`Cantidad de estibas: ${simEstibas}`} htmlFor="sim-est">
          <input id="sim-est" type="range" min={1} max={36} value={simEstibas} onChange={(e) => setSimEstibas(Number(e.target.value))} className="w-full" />
        </Field>
        <dl className="space-y-2 rounded-lg border p-4 text-[12.5px]" style={{ background: "var(--code-bg)", borderColor: "var(--code-border)", color: "var(--code-text)", fontFamily: "var(--font-mono)" }}>
          <div className="flex justify-between">
            <dt>+ Maniobra base</dt>
            <dd>{params.tiempoManiobraMinutos} min</dd>
          </div>
          <div className="flex justify-between">
            <dt>
              + Descargue ({simEstibas} × {rate})
            </dt>
            <dd>{descargue} min</dd>
          </div>
          <div className="flex justify-between" style={{ color: "var(--code-muted)" }}>
            <dt>+ Buffer (fuera de la ventana)</dt>
            <dd>{params.tiempoBufferEntreCitasMinutos} min</dd>
          </div>
          <div className="flex justify-between border-t pt-2 text-[14px] font-semibold" style={{ borderColor: "var(--code-border)", color: "var(--code-accent)" }}>
            <dt>Duración de ventana</dt>
            <dd>{total} min</dd>
          </div>
        </dl>
        <Alert variant="info" title="Asignación automática">
          El motor reservará un slot de <strong>{total} minutos</strong> en el muelle compatible más eficiente.
        </Alert>
        <Alert variant="warning" title="Alcance">
          <span className="inline-flex items-start gap-1">
            <ShieldAlert size={12} className="mt-0.5 shrink-0" /> Los parámetros aplican a todas las sedes con el algoritmo v2.4.
          </span>
        </Alert>
      </Surface>
    </div>
  );
}
