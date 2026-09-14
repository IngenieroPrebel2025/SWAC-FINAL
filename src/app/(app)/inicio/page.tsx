import type { Metadata } from "next";
import { InicioView } from "@/components/templates/InicioView";

export const metadata: Metadata = { title: "Inicio" };

export default function InicioPage() {
  return <InicioView />;
}
