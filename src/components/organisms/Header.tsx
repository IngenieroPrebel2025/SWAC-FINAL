"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ArrowLeft, Database } from "lucide-react";
import { useSidebar } from "@/context/SidebarProvider";
import { IconButton } from "@/components/atoms/IconButton";
import { Divider } from "@/components/atoms/Divider";
import { Badge } from "@/components/atoms/Badge";
import { ThemeToggle } from "@/components/molecules/ThemeToggle";
import { NotificationsMenu } from "@/components/organisms/NotificationsMenu";
import { UserMenu } from "@/components/organisms/UserMenu";
import { SedeSwitcher } from "@/components/organisms/SedeSwitcher";
import { NAVIGATION } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAppSelector } from "@/store/hooks";

/** Resolve { parent, title } for the current pathname from the nav tree. */
function useBreadcrumb(pathname: string): { parent?: string; title: string } {
  for (const group of NAVIGATION) {
    for (const item of group.items) {
      if (pathname === item.href || pathname === item.href + "/")
        return { title: item.label };
      const child = item.children?.find(
        (c) => pathname === c.href || pathname.startsWith(c.href + "/")
      );
      if (child) return { parent: item.label, title: child.label };
      if (pathname.startsWith(item.href + "/")) return { title: item.label };
    }
  }
  return { title: "SWAC" };
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarWidth, isMobile, openMobile } = useSidebar();
  const { parent, title } = useBreadcrumb(pathname);
  const { isGlobalAdmin } = useAuth();
  const mode = useAppSelector((s) => s.systemConfig.dataSourceMode);
  const isInicio = pathname === "/inicio";

  return (
    <header
      className="no-print fixed top-0 right-0 z-30 flex items-center gap-2 px-3 sm:gap-3 sm:px-7"
      style={{
        left: isMobile ? 0 : sidebarWidth,
        height: 60,
        background: "var(--hd-bg)",
        backdropFilter: "var(--hd-blur)",
        WebkitBackdropFilter: "var(--hd-blur)",
        borderBottom: "1px solid var(--hd-border)",
        transition: "left 240ms cubic-bezier(.4,0,.2,1)",
      }}
    >
      {isMobile && (
        <IconButton label="Abrir menú" onClick={openMobile}>
          <Menu size={18} strokeWidth={1.8} />
        </IconButton>
      )}

      {!isInicio && (
        <IconButton label="Volver" onClick={() => router.back()} className="hidden sm:flex">
          <ArrowLeft size={17} strokeWidth={1.8} />
        </IconButton>
      )}

      {/* Breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {parent && (
          <>
            <span className="hidden text-[12px] sm:inline" style={{ color: "var(--hd-breadcrumb)" }}>
              {parent}
            </span>
            <span className="hidden text-[12px] sm:inline" style={{ color: "var(--hd-sep)" }}>
              /
            </span>
          </>
        )}
        <span
          className="truncate text-[13.5px] font-semibold"
          style={{ color: "var(--hd-title)", letterSpacing: "-0.012em" }}
        >
          {title}
        </span>
      </div>

      {isGlobalAdmin && (
        <Link href="/configuracion/sistema" className="hidden no-underline lg:flex" title="Origen de datos activo">
          <Badge size="sm" tone={mode === "MOCK" ? "amber" : "green"}>
            <Database size={11} strokeWidth={2} />
            {mode === "MOCK" ? "Datos de demostración" : "API real"}
          </Badge>
        </Link>
      )}
      <SedeSwitcher />
      <div className="hidden sm:flex">
        <ThemeToggle />
      </div>
      <Divider orientation="vertical" className="hidden sm:block" />
      <NotificationsMenu />
      <Divider orientation="vertical" />
      <UserMenu />
    </header>
  );
}
