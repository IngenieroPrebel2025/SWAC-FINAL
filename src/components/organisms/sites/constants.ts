import { Boxes, Flame, Package, ShieldAlert, Snowflake, ThermometerSnowflake, type LucideIcon } from "lucide-react";
import type { TipoMaterialPermitido } from "@/types";
import type { Tone } from "@/lib/status";

export const MATERIALES_OPCIONES: { id: TipoMaterialPermitido; label: string; icon: LucideIcon; tone: Tone }[] = [
  { id: "SECOS", label: "Secos y abarrotes", icon: Package, tone: "slate" },
  { id: "REFRIGERADOS", label: "Refrigerados (2–8 °C)", icon: ThermometerSnowflake, tone: "blue" },
  { id: "CONGELADOS", label: "Congelados (−18 °C)", icon: Snowflake, tone: "blue" },
  { id: "PELIGROSOS", label: "Químicos / peligrosos", icon: Flame, tone: "coral" },
  { id: "VALOR", label: "Alto valor / custodia", icon: ShieldAlert, tone: "amber" },
  { id: "GRANEL", label: "Granel / materia prima", icon: Boxes, tone: "slate" },
];

export const materialTone = (id: TipoMaterialPermitido): Tone =>
  MATERIALES_OPCIONES.find((m) => m.id === id)?.tone ?? "slate";
