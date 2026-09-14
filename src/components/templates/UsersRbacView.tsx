"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Key, LogIn, Pencil, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { PageContainer } from "@/components/templates/PageContainer";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tabs, TabsPanel } from "@/components/molecules/Tabs";
import { KpiCard } from "@/components/molecules/KpiCard";
import { DataTable, type Column } from "@/components/molecules/DataTable";
import { SearchInput } from "@/components/molecules/SearchInput";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { IconButton } from "@/components/atoms/IconButton";
import { Select } from "@/components/atoms/Select";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { UserEditorModal } from "@/components/organisms/rbac/UserEditorModal";
import { RoleCreateModal } from "@/components/organisms/rbac/RoleCreateModal";
import { RbacMatrix } from "@/components/organisms/rbac/RbacMatrix";
import { SessionConsole } from "@/components/organisms/rbac/SessionConsole";
import { useAuth } from "@/hooks/useAuth";
import { useProveedores, useSedes } from "@/hooks/useCatalogos";
import {
  useActualizarPermisosRol,
  useCrearRol,
  useEliminarRol,
  useEliminarUsuario,
  useGuardarUsuario,
  usePermisos,
  useRoles,
  useUsuarios,
} from "@/hooks/useRbac";
import { useAppDispatch } from "@/store/hooks";
import { updateSessionPermissions } from "@/store/slices/authSlice";
import { getInitials } from "@/lib/format";
import { rolInfo } from "@/lib/status";
import { toast } from "@/lib/toast";
import type { RolFormData } from "@/schemas/usuario.schema";
import type { CodigoRol, Kpi, Rol, Usuario } from "@/types";

export function UsersRbacView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { session, impersonate } = useAuth();

  const { data: usuarios = [], isLoading } = useUsuarios();
  const { data: roles = [] } = useRoles();
  const { data: permisos = [] } = usePermisos();
  const { data: sedes = [] } = useSedes();
  const { data: proveedores = [] } = useProveedores();

  const guardarUsuario = useGuardarUsuario();
  const eliminarUsuario = useEliminarUsuario();
  const crearRol = useCrearRol();
  const eliminarRol = useEliminarRol();
  const actualizarPermisos = useActualizarPermisosRol();

  const [tab, setTab] = useState("usuarios");
  const [search, setSearch] = useState("");
  const [rolFilter, setRolFilter] = useState("ALL");
  const [sedeFilter, setSedeFilter] = useState("ALL");
  const [editor, setEditor] = useState<{ open: boolean; usuario: Usuario | null }>({ open: false, usuario: null });
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Rol | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return usuarios.filter(
      (u) =>
        (!q ||
          u.nombreCompleto.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.documentoIdentidad.includes(q)) &&
        (rolFilter === "ALL" || u.rolId === rolFilter) &&
        (sedeFilter === "ALL" || u.sedesAsignadasIds.length === 0 || u.sedesAsignadasIds.includes(sedeFilter))
    );
  }, [usuarios, search, rolFilter, sedeFilter]);

  const handleImpersonate = async (usuario: Usuario) => {
    setImpersonatingId(usuario.id);
    try {
      await impersonate(usuario.id);
      toast.success(`Sesión iniciada como ${usuario.nombreCompleto}`);
      router.push("/inicio");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar sesión como el usuario");
    } finally {
      setImpersonatingId(null);
    }
  };

  const handleSaveUser = (data: Partial<Usuario>, impersonateAfter: boolean) => {
    guardarUsuario.mutate(data, {
      onSuccess: (saved) => {
        toast.success(`Usuario “${saved.nombreCompleto}” ${data.id ? "actualizado" : "registrado"} correctamente`);
        setEditor({ open: false, usuario: null });
        if (impersonateAfter) handleImpersonate(saved);
      },
    });
  };

  const handleToggleStatus = (usuario: Usuario) => {
    guardarUsuario.mutate(
      { id: usuario.id, activo: !usuario.activo },
      { onSuccess: () => toast.success(`Usuario ${usuario.activo ? "desactivado" : "activado"} correctamente`) }
    );
  };

  const handleCreateRole = (data: RolFormData) => {
    const base = data.cloneFromId ? roles.find((r) => r.id === data.cloneFromId)?.permisosIds ?? [] : [];
    crearRol.mutate(
      { codigo: data.codigo as CodigoRol, nombre: data.nombre, descripcion: data.descripcion, permisosIds: base },
      {
        onSuccess: (rol) => {
          toast.success(`Rol “${rol.nombre}” creado`);
          setSelectedRoleId(rol.id);
          setRoleModalOpen(false);
        },
      }
    );
  };

  const handleChangePermisos = (rol: Rol, permisosIds: string[]) => {
    actualizarPermisos.mutate(
      { rolId: rol.id, permisosIds },
      {
        onSuccess: () => {
          if (session?.usuario.rolId === rol.id) {
            dispatch(updateSessionPermissions(permisos.filter((p) => permisosIds.includes(p.id)).map((p) => p.codigo)));
          }
        },
      }
    );
  };

  const kpis: Kpi[] = [
    {
      icon: Users,
      label: "Usuarios registrados",
      value: String(usuarios.length),
      subValue: `${usuarios.filter((u) => u.activo).length} activos · ${usuarios.filter((u) => u.rolCodigo === "PROVEEDOR").length} proveedores`,
      iconBg: "var(--kpi-icon-info-bg)",
      iconColor: "var(--kpi-icon-info-color)",
    },
    {
      icon: Shield,
      label: "Roles",
      value: String(roles.length),
      subValue: `${roles.filter((r) => !r.esSistema).length} personalizados`,
      iconBg: "var(--tone-navy-bg)",
      iconColor: "var(--tone-navy-color)",
    },
    {
      icon: Key,
      label: "Permisos granulares",
      value: String(permisos.length),
      subValue: `${new Set(permisos.map((p) => p.modulo)).size} módulos`,
      iconBg: "var(--kpi-icon-pos-bg)",
      iconColor: "var(--kpi-icon-pos-color)",
    },
    {
      icon: Globe,
      label: "Alcance multi-sede",
      value: String(sedes.length),
      subValue: "Aislamiento por centro logístico",
      iconBg: "var(--tone-amber-bg)",
      iconColor: "var(--tone-amber-color)",
    },
  ];

  const columns: Column<Usuario>[] = [
    {
      key: "usuario",
      header: "Usuario",
      render: (u) => (
        <div className="flex min-w-[220px] items-center gap-3">
          <Avatar initials={getInitials(u.nombreCompleto)} size={32} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate font-medium">
              {u.nombreCompleto}
              {u.id === session?.usuario.id && (
                <Badge size="sm" tone="green">
                  En sesión
                </Badge>
              )}
            </div>
            <div className="truncate text-[11px]" style={{ color: "var(--list-text-sub)" }}>
              {u.email} · CC {u.documentoIdentidad}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "rol",
      header: "Rol",
      render: (u) => (
        <Badge size="sm" tone={rolInfo(u.rolCodigo).tone}>
          {rolInfo(u.rolCodigo).label}
        </Badge>
      ),
    },
    {
      key: "sedes",
      header: "Sedes",
      hideOnMobile: true,
      render: (u) =>
        u.sedesAsignadasIds.length === 0 ? (
          <Badge size="sm" tone="green">
            Acceso global
          </Badge>
        ) : (
          <div className="flex max-w-[220px] flex-wrap gap-1">
            {sedes
              .filter((s) => u.sedesAsignadasIds.includes(s.id))
              .map((s) => (
                <Badge key={s.id} size="sm" tone="slate">
                  {s.nombre}
                </Badge>
              ))}
          </div>
        ),
    },
    {
      key: "empresa",
      header: "Empresa",
      hideOnMobile: true,
      render: (u) => (
        <span style={{ color: "var(--list-text-sub)" }}>
          {proveedores.find((p) => p.id === u.proveedorId)?.nombreComercial ?? "Interno corporativo"}
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (u) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(u)}
          disabled={u.id === session?.usuario.id}
          title={u.activo ? "Desactivar usuario" : "Activar usuario"}
          className="disabled:cursor-not-allowed"
        >
          <StatusBadge status={u.activo ? "active" : "inactive"} variant="list" />
        </button>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      align: "right",
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<LogIn size={12} />}
            loading={impersonatingId === u.id}
            disabled={u.id === session?.usuario.id || !u.activo}
            onClick={() => handleImpersonate(u)}
          >
            <span className="hidden xl:inline">Impersonar</span>
          </Button>
          <IconButton label={`Editar ${u.nombreCompleto}`} onClick={() => setEditor({ open: true, usuario: u })}>
            <Pencil size={14} />
          </IconButton>
          <IconButton
            label={`Eliminar ${u.nombreCompleto}`}
            onClick={() => setUserToDelete(u)}
            disabled={u.id === session?.usuario.id}
            className="disabled:opacity-40"
          >
            <Trash2 size={14} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Usuarios, roles y permisos"
        description="Control de acceso por módulo y sede, gestión de credenciales y directivas de seguridad."
        actions={
          tab === "usuarios" ? (
            <Button leftIcon={<UserPlus size={15} />} onClick={() => setEditor({ open: true, usuario: null })}>
              Nuevo usuario
            </Button>
          ) : undefined
        }
      />

      <div className="mb-5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: "usuarios", label: "Directorio de usuarios", icon: <Users size={14} />, badge: usuarios.length },
          { value: "matriz", label: "Matriz RBAC", icon: <Shield size={14} /> },
          { value: "sesion", label: "Consola de sesión", icon: <Key size={14} /> },
        ]}
      />

      <TabsPanel value="usuarios" activeValue={tab} className="space-y-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o documento…"
            aria-label="Buscar usuarios"
            containerClassName="sm:max-w-sm"
          />
          <div className="sm:w-52">
            <Select value={rolFilter} onChange={(e) => setRolFilter(e.target.value)} aria-label="Filtrar por rol">
              <option value="ALL">Todos los roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:w-52">
            <Select value={sedeFilter} onChange={(e) => setSedeFilter(e.target.value)} aria-label="Filtrar por sede">
              <option value="ALL">Todas las sedes</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(u) => u.id}
          caption="Directorio de usuarios"
          isRowHighlighted={(u) => u.id === session?.usuario.id}
          emptyState={
            <EmptyState
              icon={Users}
              title={isLoading ? "Cargando usuarios…" : "Sin resultados"}
              description={isLoading ? undefined : "Ajusta los filtros de búsqueda."}
            />
          }
        />
      </TabsPanel>

      <TabsPanel value="matriz" activeValue={tab}>
        <RbacMatrix
          roles={roles}
          permisos={permisos}
          selectedRoleId={selectedRoleId}
          saving={actualizarPermisos.isPending}
          onSelectRole={setSelectedRoleId}
          onChangePermisos={handleChangePermisos}
          onCreateRole={() => setRoleModalOpen(true)}
          onDeleteRole={setRoleToDelete}
        />
      </TabsPanel>

      <TabsPanel value="sesion" activeValue={tab}>
        {session && (
          <SessionConsole
            session={session}
            usuarios={usuarios}
            impersonatingId={impersonatingId}
            onImpersonate={handleImpersonate}
          />
        )}
      </TabsPanel>

      <UserEditorModal
        open={editor.open}
        usuario={editor.usuario}
        roles={roles}
        sedes={sedes}
        proveedores={proveedores}
        saving={guardarUsuario.isPending}
        onClose={() => setEditor({ open: false, usuario: null })}
        onSubmit={handleSaveUser}
      />

      <RoleCreateModal
        open={roleModalOpen}
        roles={roles}
        saving={crearRol.isPending}
        onClose={() => setRoleModalOpen(false)}
        onSubmit={handleCreateRole}
      />

      <ConfirmDialog
        open={Boolean(userToDelete)}
        title="¿Eliminar usuario del sistema?"
        description="Se revocarán sus accesos de inicio de sesión y credenciales activas."
        itemName={userToDelete ? `${userToDelete.nombreCompleto} (${userToDelete.email})` : undefined}
        confirmLabel="Eliminar usuario"
        loading={eliminarUsuario.isPending}
        onCancel={() => setUserToDelete(null)}
        onConfirm={() =>
          userToDelete &&
          eliminarUsuario.mutate(userToDelete.id, {
            onSuccess: () => {
              toast.success(`Usuario ${userToDelete.nombreCompleto} eliminado`);
              setUserToDelete(null);
            },
          })
        }
      />

      <ConfirmDialog
        open={Boolean(roleToDelete)}
        title="¿Eliminar rol personalizado?"
        description="Los usuarios con este rol deberán reasignarse a otro perfil antes de eliminarlo."
        itemName={roleToDelete ? `${roleToDelete.nombre} [${roleToDelete.codigo}]` : undefined}
        confirmLabel="Eliminar rol"
        loading={eliminarRol.isPending}
        onCancel={() => setRoleToDelete(null)}
        onConfirm={() =>
          roleToDelete &&
          eliminarRol.mutate(roleToDelete.id, {
            onSuccess: () => {
              toast.success(`Rol ${roleToDelete.nombre} eliminado`);
              setRoleToDelete(null);
              setSelectedRoleId("");
            },
          })
        }
      />
    </PageContainer>
  );
}
