"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useSidebar } from "@/context/SidebarProvider";
import { useTheme } from "@/context/ThemeProvider";
import { type NavGroup, type NavNode, type NavLeaf } from "@/config/navigation";
import { useFilteredNavigation } from "@/hooks/useNavigation";
import logoLight from "@/assets/icons/Logo + Tagline negro Web.webp";
import logoDark from "@/assets/icons/Logo + Tagline blanco Web.webp";

/* Most-specific matching nav href for the current pathname. */
function useActiveHref(navigation: NavGroup[]): string {
  const pathname = usePathname();
  return useMemo(() => {
    const all: string[] = [];
    navigation.forEach((g) =>
      g.items.forEach((i) => {
        all.push(i.href);
        i.children?.forEach((c) => all.push(c.href));
      })
    );
    const matches = all
      .filter((h) => pathname === h || pathname.startsWith(h + "/"))
      .sort((a, b) => b.length - a.length);
    return matches[0] ?? pathname;
  }, [navigation, pathname]);
}

/* ── Glassmorphism animated highlight (brand colours) ── */
function NavGlow() {
  return (
    <motion.span
      layoutId="nav-active-glow"
      aria-hidden="true"
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 8,
        zIndex: 0,
        background: "var(--nav-glow-grad)",
        border: "1px solid var(--nav-glow-border)",
        boxShadow: "var(--nav-glow-shadow)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    />
  );
}

interface RowProps {
  leaf: NavLeaf;
  active: boolean;
  collapsed: boolean;
  depth?: number;
  onNavigate: () => void;
}

function NavRow({ leaf, active, collapsed, depth = 0, onNavigate }: RowProps) {
  const Icon = leaf.icon;
  return (
    <Link
      href={leaf.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? leaf.label : undefined}
      className="relative flex items-center no-underline"
      style={{
        height: depth > 0 ? 34 : 38,
        gap: 10,
        padding: collapsed ? 0 : `0 14px 0 ${18 + depth * 16}px`,
        justifyContent: collapsed ? "center" : "flex-start",
        margin: "1px 8px",
        borderRadius: 8,
      }}
    >
      {active && <NavGlow />}
      <span
        className="relative flex shrink-0"
        style={{ zIndex: 1, color: active ? "var(--sb-item-text-active)" : "var(--sb-item-text)" }}
      >
        <Icon size={depth > 0 ? 14 : 16} strokeWidth={active ? 2.1 : 1.7} />
      </span>
      {!collapsed && (
        <span
          className="relative flex-1 truncate text-left"
          style={{
            zIndex: 1,
            fontSize: depth > 0 ? 12.5 : 13,
            fontWeight: active ? 600 : 400,
            color: active ? "var(--sb-item-text-active)" : "var(--sb-item-text)",
          }}
        >
          {leaf.label}
        </span>
      )}
    </Link>
  );
}

interface ParentRowProps {
  node: NavNode;
  activeHref: string;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

function ParentRow({ node, activeHref, collapsed, open, onToggle, onNavigate }: ParentRowProps) {
  const Icon = node.icon;
  const inTrail = activeHref === node.href || activeHref.startsWith(node.href + "/");
  const selfActive = activeHref === node.href;

  return (
    <div>
      <div className="relative flex items-center" style={{ margin: "1px 8px" }}>
        <Link
          href={node.href}
          onClick={onNavigate}
          aria-current={selfActive ? "page" : undefined}
          title={collapsed ? node.label : undefined}
          className="relative flex flex-1 items-center no-underline"
          style={{
            height: 38,
            gap: 10,
            padding: collapsed ? 0 : "0 8px 0 18px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 8,
          }}
        >
          {selfActive && <NavGlow />}
          <span
            className="relative flex shrink-0"
            style={{ zIndex: 1, color: inTrail ? "var(--sb-item-text-active)" : "var(--sb-item-text)" }}
          >
            <Icon size={16} strokeWidth={inTrail ? 2.1 : 1.7} />
          </span>
          {!collapsed && (
            <span
              className="relative flex-1 truncate text-left"
              style={{
                zIndex: 1,
                fontSize: 13,
                fontWeight: inTrail ? 600 : 400,
                color: inTrail ? "var(--sb-item-text-active)" : "var(--sb-item-text)",
              }}
            >
              {node.label}
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={`${open ? "Contraer" : "Expandir"} ${node.label}`}
            aria-expanded={open}
            className="relative z-[1] flex h-7 w-7 items-center justify-center rounded-md"
            style={{ color: "var(--sb-chevron)" }}
          >
            <ChevronDown
              size={14}
              strokeWidth={2}
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }}
            />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingBottom: 4 }}>
              {node.children!.map((child) => (
                <NavRow
                  key={child.href}
                  leaf={child}
                  active={activeHref === child.href || activeHref.startsWith(child.href + "/")}
                  collapsed={collapsed}
                  depth={1}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  const { collapsed, isMobile, openMenus, toggleMenu, setMenuOpen, closeMobile, toggleCollapse } = useSidebar();
  const { theme } = useTheme();
  const navigation = useFilteredNavigation();
  const activeHref = useActiveHref(navigation);
  const showCollapsed = collapsed && !isMobile;

  /* Auto-expand the parent that contains the active route. */
  useEffect(() => {
    for (const group of navigation) {
      for (const item of group.items) {
        if (item.children?.some((c) => activeHref === c.href || activeHref.startsWith(c.href + "/"))) {
          setMenuOpen(item.href, true);
        }
      }
    }
  }, [activeHref, navigation, setMenuOpen]);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className="flex shrink-0 items-center gap-3 overflow-hidden"
        style={{ height: 64, padding: "0 20px", borderBottom: "1px solid var(--sb-divider)" }}
      >
        <Link
          href="/inicio"
          onClick={onNavigate}
          aria-label="SWAC — Inicio"
          className="flex shrink-0 items-center justify-center"
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            background: "var(--sb-mark-gradient)",
            boxShadow: "var(--sb-mark-shadow)",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="5.5" height="5.5" rx="1.4" fill="white" />
            <rect x="9.5" y="2" width="5.5" height="5.5" rx="1.4" fill="white" fillOpacity="0.42" />
            <rect x="2" y="9.5" width="5.5" height="5.5" rx="1.4" fill="white" fillOpacity="0.42" />
            <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1.4" fill="white" />
          </svg>
        </Link>
        {!showCollapsed && (
          <Image
            src={theme === "dark" ? logoDark : logoLight}
            alt="PREBEL"
            height={22}
            style={{ width: "auto", maxWidth: 130, objectFit: "contain" }}
            priority
          />
        )}
        {isMobile && (
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Cerrar menú"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md"
            style={{ color: "var(--sb-toggle-icon)" }}
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Navegación principal" className="scrollbar-none flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: "10px 0" }}>
        {navigation.map((group, gi) => (
          <div key={gi}>
            {group.separator && gi > 0 && (
              <div style={{ height: 1, background: "var(--sb-divider)", margin: "8px 18px" }} />
            )}
            {group.items.map((item) =>
              item.children?.length ? (
                <ParentRow
                  key={item.href}
                  node={item}
                  activeHref={activeHref}
                  collapsed={showCollapsed}
                  open={!!openMenus[item.href]}
                  onToggle={() => toggleMenu(item.href)}
                  onNavigate={onNavigate}
                />
              ) : (
                <NavRow
                  key={item.href}
                  leaf={item}
                  active={activeHref === item.href || activeHref.startsWith(item.href + "/")}
                  collapsed={showCollapsed}
                  onNavigate={onNavigate}
                />
              )
            )}
          </div>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <div
          className="flex shrink-0 items-center justify-between"
          style={{ borderTop: "1px solid var(--sb-divider)", padding: "10px 14px" }}
        >
          {!showCollapsed && (
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--sb-section-label)" }}>
              SWAC
            </span>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            className="ml-auto flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid var(--sb-toggle-border)",
              background: "var(--sb-toggle-bg)",
              color: "var(--sb-toggle-icon)",
              cursor: "pointer",
            }}
          >
            {collapsed ? <ChevronRight size={13} strokeWidth={1.8} /> : <ChevronLeft size={13} strokeWidth={1.8} />}
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { isMobile, mobileOpen, closeMobile, sidebarWidth } = useSidebar();

  /* ── Mobile: off-canvas drawer ── */
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              aria-hidden="true"
              className="fixed inset-0 z-[60]"
              style={{ background: "rgba(5,19,38,0.45)", backdropFilter: "blur(3px)" }}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              aria-label="Navegación principal"
              className="fixed inset-y-0 left-0 z-[61]"
              style={{
                width: 260,
                background: "var(--sb-bg)",
                backdropFilter: "var(--sb-blur)",
                WebkitBackdropFilter: "var(--sb-blur)",
                borderRight: "1px solid var(--sb-border)",
                boxShadow: "var(--sb-shadow)",
              }}
            >
              <SidebarContent onNavigate={closeMobile} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  /* ── Desktop: fixed rail ── */
  return (
    <aside
      aria-label="Navegación principal"
      className="no-print fixed inset-y-0 left-0 z-40"
      style={{
        width: sidebarWidth,
        background: "var(--sb-bg)",
        backdropFilter: "var(--sb-blur)",
        WebkitBackdropFilter: "var(--sb-blur)",
        borderRight: "1px solid var(--sb-border)",
        boxShadow: "var(--sb-shadow)",
        transition: "width 240ms cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
      }}
    >
      <SidebarContent onNavigate={() => {}} />
    </aside>
  );
}
