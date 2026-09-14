import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "@/components/templates/LoginView";
import { PageLoader } from "@/components/atoms/PageLoader";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Acceso corporativo a SWAC — Sistema Web de Asignación de Citas.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader label="Preparando acceso…" />}>
      <LoginView />
    </Suspense>
  );
}
