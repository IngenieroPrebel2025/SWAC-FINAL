import type { Metadata } from "next";
import { GateView } from "@/components/templates/GateView";

export const metadata: Metadata = {
  title: "Portería y patio",
  description: "Garita, inspección vehicular, gestión de patio y pase digital del conductor.",
};

export default function PorteriaPage() {
  return <GateView />;
}
