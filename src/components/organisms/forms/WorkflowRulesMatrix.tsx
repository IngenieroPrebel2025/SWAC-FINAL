"use client";

import { useState } from "react";
import { ArrowRight, FileCheck2, KeyRound, Lock } from "lucide-react";
import { Surface } from "@/components/atoms/Surface";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Switch } from "@/components/atoms/Switch";
import { Alert } from "@/components/atoms/Alert";
import { SectionHeading } from "@/components/molecules/SectionHeading";

interface TransitionPolicy {
  id: string;
  origen: string;
  destino: string;
  nombre: string;
  criterio: string;
  requiereFormulario: boolean;
  requiereFirmaSupervisor: boolean;
  permiteBypass: boolean;
  activa: boolean;
}

const INITIAL_POLICIES: TransitionPolicy[] = [
  {
    id: "pol-01",
    origen: "SOLICITUD_PROVEEDOR",
    destino: "DATOS_VEHICULO_CONDUCTOR",
    nombre: "Completitud de orden de compra / SKU",
    criterio: "La cita debe tener al menos una orden de compra válida y capacidad de cubicaje disponible.",
    requiereFormulario: true,
    requiereFirmaSupervisor: false,
    permiteBypass: true,
    activa: true,
  },
  {
    id: "pol-02",
    origen: "DATOS_VEHICULO_CONDUCTOR",
    destino: "VALIDACION_DOCUMENTAL",
    nombre: "Validación de ARL y licencia de conducción",
    criterio: "La planilla de seguridad social (ARL) debe estar VIGENTE.",
    requiereFormulario: true,
    requiereFirmaSupervisor: false,
    permiteBypass: false,
    activa: true,
  },
  {
    id: "pol-03",
    origen: "LLEGADA_PORTERIA",
    destino: "INSPECCION_SEGURIDAD",
    nombre: "Control de ventana de impuntualidad",
    criterio: "Con más de 30 minutos de retraso se requiere re-priorización o re-agendamiento.",
    requiereFormulario: false,
    requiereFirmaSupervisor: true,
    permiteBypass: true,
    activa: true,
  },
  {
    id: "pol-04",
    origen: "INSPECCION_SEGURIDAD",
    destino: "ASIGNACION_MUELLE",
    nombre: "Sellos de seguridad y temperatura",
    criterio: "Bloqueo absoluto si el precinto está roto o la temperatura de lácteos/cárnicos supera 8.0 °C.",
    requiereFormulario: true,
    requiereFirmaSupervisor: true,
    permiteBypass: false,
    activa: true,
  },
  {
    id: "pol-05",
    origen: "OPERACION_DESCARGUE",
    destino: "SALIDA_PLANTA",
    nombre: "Conteo físico y firma de remisión",
    criterio: "El operador de muelle debe ingresar el conteo de estibas recibidas y firmar digitalmente.",
    requiereFormulario: true,
    requiereFirmaSupervisor: true,
    permiteBypass: true,
    activa: true,
  },
];

const DEMO_PINS = ["9920", "1234"];

export function WorkflowRulesMatrix() {
  const [policies, setPolicies] = useState(INITIAL_POLICIES);
  const [pin, setPin] = useState("");
  const [bypass, setBypass] = useState<{ ok: boolean; message: string } | null>(null);

  const activas = policies.filter((p) => p.activa).length;

  const handleBypass = () => {
    setBypass(
      DEMO_PINS.includes(pin)
        ? { ok: true, message: `Bypass excepcional autorizado por el supervisor de guardia (auditoría #BP-${Date.now().toString().slice(-4)}).` }
        : { ok: false, message: "PIN de supervisor incorrecto o sin autorización para liberar candados de seguridad." }
    );
    setPin("");
  };

  return (
    <div className="space-y-5">
      <Surface className="p-5">
        <SectionHeading
          title="Políticas de control operativo"
          description="Requisitos previos entre etapas para asegurar el cumplimiento antes del ingreso a muelle."
          actions={<Badge tone="green">{activas} reglas activas</Badge>}
          className="mb-4"
        />
        <ul className="space-y-3">
          {policies.map((pol) => (
            <li
              key={pol.id}
              className="rounded-lg border p-4 transition-opacity"
              style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)", opacity: pol.activa ? 1 : 0.6 }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h4 className="text-[13px] font-semibold" style={{ color: "var(--list-text)" }}>
                    {pol.nombre}
                  </h4>
                  <p className="mt-1 flex flex-wrap items-center gap-1 text-[10.5px]" style={{ color: "var(--list-text-sub)", fontFamily: "var(--font-mono)" }}>
                    {pol.origen} <ArrowRight size={11} /> <strong style={{ color: "var(--atom-blue-500)" }}>{pol.destino}</strong>
                  </p>
                </div>
                <Switch
                  size="sm"
                  id={`pol-${pol.id}`}
                  label={pol.activa ? "Activa" : "Pausada"}
                  checked={pol.activa}
                  onChange={(v) => setPolicies((prev) => prev.map((p) => (p.id === pol.id ? { ...p, activa: v } : p)))}
                />
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: "var(--sect-sub)" }}>
                {pol.criterio}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge size="sm" tone={pol.requiereFormulario ? "blue" : "slate"}>
                  <FileCheck2 size={11} /> Formulario {pol.requiereFormulario ? "obligatorio" : "opcional"}
                </Badge>
                <Badge size="sm" tone={pol.requiereFirmaSupervisor ? "amber" : "slate"}>
                  <Lock size={11} /> Firma supervisor {pol.requiereFirmaSupervisor ? "requerida" : "no requerida"}
                </Badge>
                <Badge size="sm" tone={pol.permiteBypass ? "navy" : "coral"}>
                  <KeyRound size={11} /> Bypass {pol.permiteBypass ? "permitido con PIN" : "prohibido"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </Surface>

      <Surface className="p-5">
        <SectionHeading
          icon={<KeyRound size={13} />}
          title="Autorización de excepción"
          description="En situaciones excepcionales un supervisor puede autorizar el avance mediante su PIN de seguridad."
          className="mb-4"
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleBypass();
          }}
          className="flex flex-col gap-2.5 sm:flex-row sm:items-center"
        >
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="PIN (demo: 9920)"
            aria-label="PIN del supervisor"
            className="text-center tracking-[0.3em] sm:w-44"
          />
          <Button type="submit" variant="danger" disabled={pin.length < 4}>
            Ejecutar desbloqueo de emergencia
          </Button>
        </form>
        {bypass && (
          <Alert variant={bypass.ok ? "success" : "error"} className="mt-4" title={bypass.ok ? "Autorizado" : "Denegado"} onClose={() => setBypass(null)}>
            {bypass.message}
          </Alert>
        )}
      </Surface>
    </div>
  );
}
