import type { Metadata } from "next";
import { SystemSettingsView } from "@/components/templates/SystemSettingsView";

export const metadata: Metadata = {
  title: "Sistema",
  description: "Origen de datos, backend y telemetría de peticiones HTTP.",
};

export default function SistemaPage() {
  return <SystemSettingsView />;
}
