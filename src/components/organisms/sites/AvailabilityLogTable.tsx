"use client";

import { FileText, Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/molecules/DataTable";
import { EmptyState } from "@/components/molecules/EmptyState";
import { IconButton } from "@/components/atoms/IconButton";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { Badge } from "@/components/atoms/Badge";
import { formatTime } from "@/lib/format";
import type { Muelle, MuelleDisponibilidadLog } from "@/types";

interface AvailabilityLogTableProps {
  logs: MuelleDisponibilidadLog[];
  muelles: Muelle[];
  canDelete: boolean;
  onDelete: (log: MuelleDisponibilidadLog) => void;
}

export function AvailabilityLogTable({ logs, muelles, canDelete, onDelete }: AvailabilityLogTableProps) {
  const columns: Column<MuelleDisponibilidadLog>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (l) => (
        <div>
          <div className="font-medium" style={{ fontFamily: "var(--font-mono)" }}>
            {l.fecha}
          </div>
          <div className="text-[11px]" style={{ color: "var(--list-text-sub)" }}>
            Registrado {formatTime(l.registradoEn)}
          </div>
        </div>
      ),
    },
    {
      key: "muelle",
      header: "Muelle",
      render: (l) => (
        <Badge size="sm" tone="slate" style={{ fontFamily: "var(--font-mono)" }}>
          {muelles.find((m) => m.id === l.muelleId)?.codigoMuelle ?? l.muelleId}
        </Badge>
      ),
    },
    {
      key: "franja",
      header: "Franja",
      hideOnMobile: true,
      render: (l) => <span style={{ fontFamily: "var(--font-mono)" }}>{`${l.horaInicio} – ${l.horaFin}`}</span>,
    },
    {
      key: "estado",
      header: "Estado",
      render: (l) => (
        <StatusBadge status={l.estadoHabilitado ? "active" : "warning"} label={l.estadoHabilitado ? "Habilitado" : "Fuera de servicio"} variant="list" />
      ),
    },
    {
      key: "motivo",
      header: "Motivo",
      render: (l) => (
        <span className="line-clamp-2 max-w-[360px]" title={l.motivoCambio}>
          {l.motivoCambio}
        </span>
      ),
    },
    {
      key: "usuario",
      header: "Responsable",
      hideOnMobile: true,
      render: (l) => <span style={{ color: "var(--list-text-sub)", fontFamily: "var(--font-mono)" }}>{l.usuarioId}</span>,
    },
    ...(canDelete
      ? [
          {
            key: "acciones",
            header: "",
            align: "right" as const,
            width: "56px",
            render: (l: MuelleDisponibilidadLog) => (
              <IconButton label="Eliminar registro de bitácora" onClick={() => onDelete(l)}>
                <Trash2 size={14} />
              </IconButton>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      rows={logs}
      rowKey={(l) => l.id}
      caption="Bitácora de disponibilidad y mantenimiento de muelles"
      emptyState={<EmptyState icon={FileText} title="Sin registros" description="Aún no hay cambios de disponibilidad en esta sede." />}
    />
  );
}
