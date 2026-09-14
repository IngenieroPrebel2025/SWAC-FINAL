import {
  BarChart3,
  CalendarDays,
  FormInput,
  Home,
  LayoutGrid,
  MapPin,
  Settings,
  ClipboardList,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  type LucideIcon,
} from "lucide-react";

/** Contexto RBAC con el que se evalúan las reglas de acceso. */
export interface AccessContext {
  rolCodigo: string;
  isGlobalAdmin: boolean;
  isSiteAdmin: boolean;
  isProvider: boolean;
  isGateOfficer: boolean;
  hasPermission: (code: string) => boolean;
}

export type AccessRule = (ctx: AccessContext) => boolean;

export interface NavLeaf {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  /** Regla RBAC. Sin regla = visible para cualquier usuario autenticado. */
  access?: AccessRule;
}

export interface NavNode extends NavLeaf {
  children?: NavLeaf[];
}

export interface NavGroup {
  separator?: boolean;
  items: NavNode[];
}

/**
 * Fuente única de navegación: sidebar, breadcrumbs, tarjetas de Inicio,
 * índices de sección y guardas de ruta se derivan de esta configuración.
 */
export const NAVIGATION: NavGroup[] = [
  {
    items: [
      {
        label: "Inicio",
        href: "/inicio",
        icon: Home,
        description: "Bienvenida, contexto de sesión y accesos rápidos",
      },
    ],
  },
  {
    separator: true,
    items: [
      {
        label: "Indicadores",
        href: "/indicadores",
        icon: BarChart3,
        description: "Torre de control: KPIs, proveedores, alertas y auditoría documental",
        access: (c) => c.isSiteAdmin || c.rolCodigo === "AUDITOR" || c.hasPermission("INDICADORES_LEER"),
      },
      {
        label: "Operaciones",
        href: "/operaciones",
        icon: LayoutGrid,
        description: "Citas, portería, formularios y muelles",
        children: [
          {
            label: "Citas y muelles",
            href: "/operaciones/citas",
            icon: CalendarDays,
            description: "Cronograma de muelles, agendamiento de turnos y capacidad",
            access: (c) =>
              c.isSiteAdmin ||
              c.isProvider ||
              c.isGateOfficer ||
              c.rolCodigo === "PERSONALIZADO" ||
              c.rolCodigo === "OPERADOR_MUELLE" ||
              c.hasPermission("CITAS_LEER"),
          },
          {
            label: "Portería y patio",
            href: "/operaciones/porteria",
            icon: Truck,
            description: "Garita, inspección vehicular, patio y pase del conductor",
            access: (c) =>
              c.isSiteAdmin || c.isGateOfficer || c.rolCodigo === "OPERADOR_MUELLE" || c.hasPermission("PORTERIA_LEER"),
          },
          {
            label: "Formularios",
            href: "/operaciones/formularios",
            icon: FormInput,
            description: "Formularios dinámicos, etapas del workflow y reglas de paso",
            access: (c) => c.isSiteAdmin || c.hasPermission("FORMULARIOS_LEER"),
          },
          {
            label: "Sedes y muelles",
            href: "/operaciones/sedes",
            icon: MapPin,
            description: "Infraestructura, turnos, compatibilidad de carga y bitácora",
            access: (c) => c.isSiteAdmin || c.hasPermission("SEDES_LEER"),
          },
        ],
      },
    ],
  },
  {
    separator: true,
    items: [
      {
        label: "Configuración",
        href: "/configuracion",
        icon: Settings,
        description: "Usuarios, integraciones y parámetros del sistema",
        children: [
          {
            label: "Usuarios y roles",
            href: "/configuracion/usuarios",
            icon: ShieldCheck,
            description: "Directorio, matriz RBAC y consola de sesión",
            access: (c) => c.isGlobalAdmin && c.hasPermission("USUARIOS_LEER"),
          },
          {
            label: "Datos maestros",
            href: "/configuracion/datos-maestros",
            icon: ClipboardList,
            description: "Materiales habilitados para ingreso y agendamiento",
            access: (c) => c.isGlobalAdmin || c.isSiteAdmin || c.hasPermission("MATERIALES_GESTION"),
          },
          {
            label: "Integraciones",
            href: "/configuracion/integraciones",
            icon: Share2,
            description: "Conectores ERP / WMS / RUNT y mapeo de payloads",
            access: (c) => c.isGlobalAdmin && c.hasPermission("INTEGRACIONES_LEER"),
          },
          {
            label: "Sistema",
            href: "/configuracion/sistema",
            icon: SlidersHorizontal,
            description: "Origen de datos, backend y telemetría HTTP",
            access: (c) => c.isGlobalAdmin,
          },
        ],
      },
    ],
  },
];

const allowed = (leaf: NavLeaf, ctx: AccessContext) => !leaf.access || leaf.access(ctx);

/** Poda el árbol según el contexto RBAC (un padre sin hijos visibles desaparece). */
export function filterNavigation(ctx: AccessContext, groups: NavGroup[] = NAVIGATION): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.flatMap((item): NavNode[] => {
        if (item.children?.length) {
          const children = item.children.filter((c) => allowed(c, ctx));
          return children.length > 0 ? [{ ...item, children }] : [];
        }
        return allowed(item, ctx) ? [item] : [];
      }),
    }))
    .filter((group) => group.items.length > 0);
}

/** Hojas navegables (hijos o ítems sin hijos). */
export function leavesOf(groups: NavGroup[] = NAVIGATION): NavLeaf[] {
  return groups.flatMap((group) => group.items.flatMap((item) => (item.children?.length ? item.children : [item])));
}

export const ALL_ROUTES: NavLeaf[] = leavesOf(NAVIGATION);

export function getChildren(parentHref: string, groups: NavGroup[] = NAVIGATION): NavLeaf[] {
  for (const group of groups) {
    const node = group.items.find((i) => i.href === parentHref);
    if (node?.children?.length) return node.children;
  }
  return [];
}

export function getNode(href: string, groups: NavGroup[] = NAVIGATION): NavNode | undefined {
  for (const group of groups) {
    const node = group.items.find((i) => i.href === href);
    if (node) return node;
  }
  return undefined;
}

/** Guarda de ruta: evalúa la regla del nodo de navegación más específico. */
export function canAccessPath(pathname: string, ctx: AccessContext): boolean {
  const matches = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  for (const group of NAVIGATION) {
    for (const item of group.items) {
      const child = item.children?.find((c) => matches(c.href));
      if (child) return allowed(child, ctx);
      if (matches(item.href)) {
        if (item.children?.length) return item.children.some((c) => allowed(c, ctx));
        return allowed(item, ctx);
      }
    }
  }
  return true;
}
