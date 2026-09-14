import type { Metadata } from "next";
import { AppointmentsView } from "@/components/templates/AppointmentsView";

export const metadata: Metadata = {
  title: "Citas y muelles",
  description: "Cronograma de muelles, agendamiento de turnos y parámetros de capacidad.",
};

export default function CitasPage() {
  return <AppointmentsView />;
}
