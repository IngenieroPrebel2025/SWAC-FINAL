"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, QrCode, Truck, User } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { SearchInput } from "@/components/molecules/SearchInput";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Alert } from "@/components/atoms/Alert";
import { formatIsoHour } from "@/lib/format";
import { ESTADO_CITA } from "@/lib/status";
import type { Cita, Conductor, Muelle, Proveedor, Vehiculo } from "@/types";

interface GateScannerModalProps {
  open: boolean;
  citas: Cita[];
  muelles: Muelle[];
  proveedores: Proveedor[];
  vehiculos: Vehiculo[];
  conductores: Conductor[];
  onClose: () => void;
  onSelect: (cita: Cita) => void;
}

/** Validación de turno en garita por QR (simulado), placa, cédula o radicado. */
export function GateScannerModal({ open, citas, muelles, proveedores, vehiculos, conductores, onClose, onSelect }: GateScannerModalProps) {
  const [search, setSearch] = useState("");
  const [scan, setScan] = useState<{ status: "scanning" | "ok" | "not-found"; message: string } | null>(null);

  const q = search.toLowerCase().trim();
  const filtered = citas.filter((c) => {
    if (!q) return true;
    const veh = vehiculos.find((v) => v.id === c.vehiculoId);
    const cond = conductores.find((x) => x.id === c.conductorId);
    const prov = proveedores.find((p) => p.id === c.proveedorId);
    return (
      c.codigoCita.toLowerCase().includes(q) ||
      veh?.placa.toLowerCase().includes(q) ||
      cond?.numeroDocumento.includes(q) ||
      `${cond?.nombres} ${cond?.apellidos}`.toLowerCase().includes(q) ||
      prov?.nombreComercial.toLowerCase().includes(q)
    );
  });

  const simulateScan = () => {
    const target = filtered[0] ?? citas[0];
    if (!target) {
      setScan({ status: "not-found", message: "No hay citas programadas para validar." });
      return;
    }
    setScan({ status: "scanning", message: `Escaneando código QR ${target.codigoCita}…` });
    setTimeout(() => {
      setScan({ status: "ok", message: `Pase QR verificado · radicado ${target.codigoCita}` });
      setTimeout(() => {
        setScan(null);
        onSelect(target);
      }, 600);
    }, 900);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Garita: escaneo y validación de turno"
      description="Escanea el pase digital QR o busca por placa, cédula o radicado."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="CTA-2026-0891, WZM-481 o cédula…" aria-label="Buscar cita" autoFocus />
          <Button leftIcon={<QrCode size={15} />} onClick={simulateScan} loading={scan?.status === "scanning"}>
            Escanear QR
          </Button>
        </div>
        {scan && (
          <Alert variant={scan.status === "ok" ? "success" : scan.status === "not-found" ? "warning" : "info"}>{scan.message}</Alert>
        )}

        {filtered.length === 0 ? (
          <EmptyState title="Sin coincidencias" description="Verifica el radicado, la placa o la cédula." />
        ) : (
          <ul className="space-y-2">
            {filtered.map((cita) => {
              const veh = vehiculos.find((v) => v.id === cita.vehiculoId);
              const cond = conductores.find((c) => c.id === cita.conductorId);
              const prov = proveedores.find((p) => p.id === cita.proveedorId);
              const muelle = muelles.find((m) => m.id === cita.muelleId);
              return (
                <li key={cita.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(cita)}
                    className="group flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors hover:border-[var(--card-border-hover)] sm:flex-row sm:items-center sm:justify-between"
                    style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}
                  >
                    <span className="min-w-0 space-y-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold" style={{ color: "var(--list-text)", fontFamily: "var(--font-mono)" }}>
                          {cita.codigoCita}
                        </span>
                        <Badge size="sm" tone={ESTADO_CITA[cita.estado].tone}>
                          {ESTADO_CITA[cita.estado].label}
                        </Badge>
                        {cita.inspeccionPorteriaAprobada && (
                          <Badge size="sm" tone="green">
                            <CheckCircle2 size={10} /> Inspección OK
                          </Badge>
                        )}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]" style={{ color: "var(--sect-sub)" }}>
                        <span className="flex items-center gap-1">
                          <User size={12} /> {cond ? `${cond.nombres} ${cond.apellidos}` : "Conductor asignado"}
                        </span>
                        <span className="flex items-center gap-1" style={{ fontFamily: "var(--font-mono)" }}>
                          <Truck size={12} /> {veh?.placa ?? "—"}
                        </span>
                        <span>{prov?.nombreComercial}</span>
                      </span>
                      <span className="block text-[11px]" style={{ color: "var(--result-text)" }}>
                        {formatIsoHour(cita.tiempos.horaProgramadaInicio)} – {formatIsoHour(cita.tiempos.horaProgramadaFin)} · muelle {muelle?.codigoMuelle ?? "—"} ·{" "}
                        {cita.totalEstibas} estibas
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium" style={{ color: "var(--atom-blue-500)" }}>
                      Procesar en garita <ArrowRight size={13} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
