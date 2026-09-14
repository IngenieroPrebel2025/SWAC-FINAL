"use client";

import { Pencil, Trash2, Wrench } from "lucide-react";
import { Surface } from "@/components/atoms/Surface";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { IconButton } from "@/components/atoms/IconButton";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { ESTADO_MUELLE, TIPO_MUELLE } from "@/lib/status";
import { materialTone } from "./constants";
import type { Muelle } from "@/types";

interface DockCardProps {
  muelle: Muelle;
  canChangeStatus: boolean;
  canManage: boolean;
  onChangeStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11.5px]">
      <span style={{ color: "var(--list-text-sub)" }}>{label}</span>
      <strong style={{ color: "var(--list-text)", fontFamily: "var(--font-mono)" }}>{value}</strong>
    </div>
  );
}

export function DockCard({ muelle, canChangeStatus, canManage, onChangeStatus, onEdit, onDelete }: DockCardProps) {
  const estado = ESTADO_MUELLE[muelle.estadoActual];
  const tipo = TIPO_MUELLE[muelle.tipo];

  return (
    <Surface className="flex flex-col overflow-hidden">
      <div className="border-b p-4" style={{ borderColor: "var(--card-divider)" }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[11.5px] font-bold text-white"
              style={{ background: "var(--sb-mark-gradient)", fontFamily: "var(--font-mono)" }}
            >
              {muelle.codigoMuelle}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-[13px] font-semibold" style={{ color: "var(--card-title)" }} title={muelle.nombre}>
                {muelle.nombre}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge size="sm" tone={tipo.tone}>
                  {tipo.label}
                </Badge>
                {muelle.tieneRampaNiveladora && (
                  <Badge size="sm" tone="slate">
                    Rampa hidráulica
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <StatusBadge status={estado.status} label={estado.label} className="shrink-0" />
        </div>
        {muelle.observaciones && (
          <p
            className="mt-3 rounded-md border px-2.5 py-2 text-[11.5px]"
            style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)", color: "var(--sect-sub)" }}
          >
            {muelle.observaciones}
          </p>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--kpi-label)" }}>
            Materiales permitidos
          </span>
          <div className="flex flex-wrap gap-1">
            {muelle.materialesPermitidos.map((m) => (
              <Badge key={m} size="sm" tone={materialTone(m)}>
                {m}
              </Badge>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t pt-3" style={{ borderColor: "var(--card-divider)" }}>
          <Spec label="Gálibo" value={`${muelle.alturaMaximaMetros ?? 4.5} m`} />
          <Spec label="Carga máx." value={`${muelle.pesoMaximoToneladas ?? 35} t`} />
          <Spec label="Operación máx." value={`${muelle.tiempoMaximoOperacionMinutos} min`} />
          <Spec label="Buffer" value={`${muelle.tiempoBufferEntreCitasMinutos} min`} />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t p-3" style={{ borderColor: "var(--card-divider)" }}>
        <Button variant="secondary" size="sm" leftIcon={<Wrench size={13} />} onClick={onChangeStatus} disabled={!canChangeStatus}>
          Cambiar estado
        </Button>
        {canManage && (
          <div className="flex items-center gap-1">
            <IconButton label={`Editar ${muelle.codigoMuelle}`} onClick={onEdit}>
              <Pencil size={14} />
            </IconButton>
            <IconButton label={`Eliminar ${muelle.codigoMuelle}`} onClick={onDelete}>
              <Trash2 size={14} />
            </IconButton>
          </div>
        )}
      </div>
    </Surface>
  );
}
