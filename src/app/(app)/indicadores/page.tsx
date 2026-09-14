import type { Metadata } from "next";
import { DashboardView } from "@/components/templates/DashboardView";

export const metadata: Metadata = {
  title: "Indicadores",
  description: "Torre de control: KPIs operativos, proveedores, alertas y auditoría documental.",
};

export default function IndicadoresPage() {
  return <DashboardView />;
}
