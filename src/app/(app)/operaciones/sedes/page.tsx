import type { Metadata } from "next";
import { SitesDocksView } from "@/components/templates/SitesDocksView";

export const metadata: Metadata = {
  title: "Sedes y muelles",
  description: "Infraestructura, turnos de atención, compatibilidad de carga y bitácora.",
};

export default function SedesPage() {
  return <SitesDocksView />;
}
