import type { Metadata } from "next";
import { SectionIndex } from "@/components/templates/SectionIndex";

export const metadata: Metadata = { title: "Operaciones" };

export default function OperacionesPage() {
  return <SectionIndex parentHref="/operaciones" />;
}
