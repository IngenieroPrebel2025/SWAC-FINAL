import type { Muelle, TipoMaterialPermitido, TipoMuelle } from "@/types";
import { TIPO_MUELLE } from "@/lib/status";

export interface CompatibilityInput {
  operacion: TipoMuelle;
  material: TipoMaterialPermitido;
  alturaMetros: number;
  pesoToneladas: number;
  requiereRampa: boolean;
}

export interface CompatibilityResult {
  status: "PERFECT" | "WARNING" | "INCOMPATIBLE";
  reasons: { passed: boolean; message: string }[];
}

/** Evaluación multidimensional vehículo/carga ↔ muelle (regla de dominio pura). */
export function evaluateDockCompatibility(muelle: Muelle, input: CompatibilityInput): CompatibilityResult {
  const reasons: CompatibilityResult["reasons"] = [];

  const operacionOk =
    muelle.tipo === "MIXTO" || muelle.tipo === "CROSS_DOCKING" || muelle.tipo === input.operacion;
  reasons.push({
    passed: operacionOk,
    message: operacionOk
      ? `Tipo de operación compatible (${TIPO_MUELLE[muelle.tipo].label})`
      : `Configurado para ${TIPO_MUELLE[muelle.tipo].label}, no para ${TIPO_MUELLE[input.operacion].label}`,
  });

  const materialOk = muelle.materialesPermitidos.includes(input.material);
  reasons.push({
    passed: materialOk,
    message: materialOk
      ? `Admite material ${input.material}`
      : `No admite ${input.material}. Solo: ${muelle.materialesPermitidos.join(", ")}`,
  });

  const altura = muelle.alturaMaximaMetros ?? 4.5;
  reasons.push({
    passed: input.alturaMetros <= altura,
    message:
      input.alturaMetros <= altura
        ? `Gálibo suficiente (máx. ${altura} m)`
        : `Altura del camión (${input.alturaMetros} m) excede el gálibo (${altura} m)`,
  });

  const peso = muelle.pesoMaximoToneladas ?? 35;
  reasons.push({
    passed: input.pesoToneladas <= peso,
    message:
      input.pesoToneladas <= peso
        ? `Capacidad de carga suficiente (máx. ${peso} t)`
        : `Peso bruto (${input.pesoToneladas} t) supera la capacidad (${peso} t)`,
  });

  const rampaOk = !input.requiereRampa || muelle.tieneRampaNiveladora;
  reasons.push({
    passed: rampaOk,
    message: rampaOk ? "Rampa niveladora disponible" : "El vehículo requiere rampa hidráulica y el muelle no la tiene",
  });

  const disponible = muelle.estadoActual === "DISPONIBLE";
  reasons.push({
    passed: disponible,
    message: disponible ? "Muelle disponible y activo" : `Muelle actualmente en estado ${muelle.estadoActual}`,
  });

  const failed = reasons.filter((r) => !r.passed).length;
  const status: CompatibilityResult["status"] =
    !materialOk || failed >= 2 ? "INCOMPATIBLE" : failed === 1 ? "WARNING" : "PERFECT";

  return { status, reasons };
}
