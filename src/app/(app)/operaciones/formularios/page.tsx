import type { Metadata } from "next";
import { WorkflowsView } from "@/components/templates/WorkflowsView";

export const metadata: Metadata = {
  title: "Formularios",
  description: "Formularios dinámicos, etapas del proceso y reglas de validación.",
};

export default function FormulariosPage() {
  return <WorkflowsView />;
}
