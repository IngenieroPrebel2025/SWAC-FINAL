import { Building2, CheckCircle2, Clock, FileCheck, Layers, Lock, Shield, Truck, type LucideIcon } from "lucide-react";
import type { FaseWorkflow, TipoCampoFormulario } from "@/types";

export interface FaseInfo {
  fase: FaseWorkflow;
  nombre: string;
  paso: number;
  descripcion: string;
  responsableRol: string;
  slaPromedioMinutos: number;
  requiereAprobacionSupervisor: boolean;
  politicaBloqueo: string;
  icon: LucideIcon;
}

/** Etapas del proceso de cita (pipeline del workflow). */
export const FASES_PIPELINE: FaseInfo[] = [
  {
    fase: "SOLICITUD_PROVEEDOR",
    nombre: "Solicitud y radicación de turno",
    paso: 1,
    descripcion: "El proveedor o transportador reserva la franja horaria e ingresa los datos iniciales de la carga.",
    responsableRol: "PROVEEDOR",
    slaPromedioMinutos: 15,
    requiereAprobacionSupervisor: false,
    politicaBloqueo: "Validación de SKU y cupo disponible en el centro de distribución.",
    icon: Building2,
  },
  {
    fase: "DATOS_VEHICULO_CONDUCTOR",
    nombre: "Registro de vehículo y conductor",
    paso: 2,
    descripcion: "Placa tractora, remolque, datos del conductor, ARL vigente y teléfono para notificaciones.",
    responsableRol: "TRANSPORTADOR / PROVEEDOR",
    slaPromedioMinutos: 10,
    requiereAprobacionSupervisor: false,
    politicaBloqueo: "Bloqueo automático si la ARL no está vigente o la placa no coincide con el tipo de vehículo.",
    icon: Truck,
  },
  {
    fase: "VALIDACION_DOCUMENTAL",
    nombre: "Validación documental",
    paso: 3,
    descripcion: "Cotejo de factura electrónica, remisión de carga y manifiesto electrónico RNDC.",
    responsableRol: "ANALISTA_LOGISTICA",
    slaPromedioMinutos: 20,
    requiereAprobacionSupervisor: false,
    politicaBloqueo: "No se emite pase de ingreso si faltan documentos obligatorios.",
    icon: FileCheck,
  },
  {
    fase: "LLEGADA_PORTERIA",
    nombre: "Arribo a garita",
    paso: 4,
    descripcion: "Recepción del vehículo en portería, validación del QR de la cita y cálculo de puntualidad.",
    responsableRol: "PORTERIA",
    slaPromedioMinutos: 5,
    requiereAprobacionSupervisor: false,
    politicaBloqueo: "Alerta si llega fuera de la ventana de tolerancia (±30 min).",
    icon: Clock,
  },
  {
    fase: "INSPECCION_SEGURIDAD",
    nombre: "Inspección física y checklist",
    paso: 5,
    descripcion: "Revisión de precintos, termógrafo, llantas y EPP reglamentarios.",
    responsableRol: "OFICIAL_SEGURIDAD",
    slaPromedioMinutos: 12,
    requiereAprobacionSupervisor: true,
    politicaBloqueo: "Rechazo inmediato si el precinto fue violado o la temperatura excede +8 °C en refrigerados.",
    icon: Shield,
  },
  {
    fase: "ASIGNACION_MUELLE",
    nombre: "Asignación y llamado a bahía",
    paso: 6,
    descripcion: "Asignación del muelle óptimo según gálibo, peso y tipo de carga.",
    responsableRol: "SUPERVISOR_CD",
    slaPromedioMinutos: 8,
    requiereAprobacionSupervisor: false,
    politicaBloqueo: "El muelle debe estar DISPONIBLE y cumplir la compatibilidad de carga.",
    icon: Layers,
  },
  {
    fase: "OPERACION_DESCARGUE",
    nombre: "Operación en muelle y conteo",
    paso: 7,
    descripcion: "Descarga, cotejo contra factura, registro de mermas, averías y precintado.",
    responsableRol: "OPERADOR_MUELLE",
    slaPromedioMinutos: 45,
    requiereAprobacionSupervisor: true,
    politicaBloqueo: "Requiere firma digital del operador y evidencia fotográfica de averías.",
    icon: CheckCircle2,
  },
  {
    fase: "SALIDA_PLANTA",
    nombre: "Paz y salvo y salida",
    paso: 8,
    descripcion: "Entrega de remisiones selladas, firma del conductor y liberación en portería.",
    responsableRol: "PORTERIA",
    slaPromedioMinutos: 5,
    requiereAprobacionSupervisor: false,
    politicaBloqueo: "No se levanta la talanquera sin paz y salvo del supervisor de bodega.",
    icon: Lock,
  },
];

export const FASE_LABEL = Object.fromEntries(
  FASES_PIPELINE.map((f) => [f.fase, `${f.paso}. ${f.nombre}`])
) as Record<FaseWorkflow, string>;

export const TIPOS_CAMPO_INFO: { tipo: TipoCampoFormulario; label: string }[] = [
  { tipo: "TEXTO", label: "Texto corto" },
  { tipo: "TEXTO_LARGO", label: "Texto largo" },
  { tipo: "NUMERO", label: "Numérico" },
  { tipo: "SELECT", label: "Selector único" },
  { tipo: "MULTI_SELECT", label: "Selector múltiple" },
  { tipo: "CHECKBOX", label: "Casilla sí/no" },
  { tipo: "FECHA", label: "Fecha" },
  { tipo: "HORA", label: "Hora" },
  { tipo: "DOCUMENTO_ADJUNTO", label: "Documento / PDF" },
  { tipo: "FOTO_EVIDENCIA", label: "Foto / evidencia" },
  { tipo: "FIRMA_DIGITAL", label: "Firma digital" },
  { tipo: "SELECTOR_DEPENDIENTE", label: "Selector dependiente" },
  { tipo: "CAMPO_CALCULADO", label: "Fórmula calculada" },
];

export const TIPO_CAMPO_LABEL = Object.fromEntries(TIPOS_CAMPO_INFO.map((t) => [t.tipo, t.label])) as Record<
  TipoCampoFormulario,
  string
>;
