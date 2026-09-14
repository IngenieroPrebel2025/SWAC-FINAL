import type { Metadata } from "next";
import { IntegrationsView } from "@/components/templates/IntegrationsView";

export const metadata: Metadata = {
  title: "Integraciones",
  description: "Conectores ERP / WMS / RUNT, autenticación y mapeo de payloads.",
};

export default function IntegracionesPage() {
  return <IntegrationsView />;
}
