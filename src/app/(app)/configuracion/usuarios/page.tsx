import type { Metadata } from "next";
import { UsersRbacView } from "@/components/templates/UsersRbacView";

export const metadata: Metadata = {
  title: "Usuarios y roles",
  description: "Directorio de usuarios, matriz RBAC y consola de sesión.",
};

export default function UsuariosPage() {
  return <UsersRbacView />;
}
