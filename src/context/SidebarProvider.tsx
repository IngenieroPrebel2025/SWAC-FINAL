"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface SidebarContextValue {
  /** Desktop collapsed (icon-only) state. */
  collapsed: boolean;
  toggleCollapse: () => void;
  /** Mobile off-canvas drawer open state. */
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  /** Expanded sub-menus, keyed by parent href. */
  openMenus: Record<string, boolean>;
  toggleMenu: (href: string) => void;
  setMenuOpen: (href: string, open: boolean) => void;
  /** True below 1024px. */
  isMobile: boolean;
  /** Effective sidebar width in px for the current viewport/state. */
  sidebarWidth: number;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const EXPANDED = 260;
const COLLAPSED = 72;

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useLocalStorage("prebel-sidebar-collapsed", false);
  const [openMenus, setOpenMenus] = useLocalStorage<Record<string, boolean>>(
    "prebel-sidebar-menus",
    { "/reportes": true, "/configuracion": true }
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Close the mobile drawer automatically when leaving mobile. */
  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const toggleCollapse = useCallback(() => setCollapsed((c) => !c), [setCollapsed]);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMenu = useCallback(
    (href: string) => setOpenMenus((m) => ({ ...m, [href]: !m[href] })),
    [setOpenMenus]
  );
  const setMenuOpen = useCallback(
    (href: string, open: boolean) => setOpenMenus((m) => ({ ...m, [href]: open })),
    [setOpenMenus]
  );

  /* On mobile the drawer is always full-width when open; collapse only applies to desktop. */
  const sidebarWidth = isMobile ? 0 : collapsed ? COLLAPSED : EXPANDED;

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggleCollapse,
        mobileOpen,
        openMobile,
        closeMobile,
        openMenus,
        toggleMenu,
        setMenuOpen,
        isMobile,
        sidebarWidth,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
}
