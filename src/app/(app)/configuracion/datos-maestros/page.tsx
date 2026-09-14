import type { Metadata } from "next";
import { MasterDataView } from "@/components/templates/MasterDataView";

export const metadata: Metadata = {
  title: "Datos maestros",
  description: "Administración de materiales habilitados para el ingreso y las citas.",
};

export default function DatosMaestrosPage() {
  return <MasterDataView />;
}
