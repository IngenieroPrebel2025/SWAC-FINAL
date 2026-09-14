"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarProvider";
import { Sidebar } from "@/components/organisms/Sidebar";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { PageLoader } from "@/components/atoms/PageLoader";
import { ErrorScreen } from "@/components/atoms/ErrorScreen";
import { canAccessPath } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAccessContext } from "@/hooks/useNavigation";

/**
 * Shell autenticado: guarda de sesión, guarda RBAC por ruta y alineación
 * de la sede activa con las sedes autorizadas del usuario.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarWidth, isMobile } = useSidebar();
  const { hydrated, isAuthenticated, availableSedes, activeSedeId, setActiveSedeId } = useAuth();
  const access = useAccessContext();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, isAuthenticated, pathname, router]);

  useEffect(() => {
    if (availableSedes.length > 0 && !availableSedes.some((s) => s.id === activeSedeId)) {
      setActiveSedeId(availableSedes[0].id);
    }
  }, [availableSedes, activeSedeId, setActiveSedeId]);

  if (!hydrated || !isAuthenticated) return <PageLoader />;

  const allowed = canAccessPath(pathname, access);

  return (
    <div className="relative flex min-h-screen" style={{ background: "var(--page-bg)" }}>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "var(--page-gradient)" }}
      />

      <Sidebar />

      <div
        className="relative z-[1] flex min-h-screen min-w-0 flex-1 flex-col"
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
          transition: "margin-left 240ms cubic-bezier(.4,0,.2,1)",
        }}
      >
        <Header />
        <main className="flex flex-1 flex-col" style={{ paddingTop: 60 }}>
          {allowed ? (
            children
          ) : (
            <ErrorScreen
              code="403"
              title="Acceso restringido"
              subtitle="Tu perfil no tiene permisos para este módulo. Si crees que es un error, contacta al administrador de la plataforma."
            />
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
