import type { Metadata } from "next";
import { SectionIndex } from "@/components/templates/SectionIndex";

export const metadata: Metadata = { title: "Configuración" };

export default function ConfiguracionPage() {
  return <SectionIndex parentHref="/configuracion" />;
}
