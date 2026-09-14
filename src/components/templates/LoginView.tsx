"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Building2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  ShieldCheck,
  Truck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Surface } from "@/components/atoms/Surface";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Alert } from "@/components/atoms/Alert";
import { Badge } from "@/components/atoms/Badge";
import { BrandBar } from "@/components/atoms/BrandBar";
import { PageLoader } from "@/components/atoms/PageLoader";
import { Field } from "@/components/molecules/Field";
import { Modal } from "@/components/molecules/Modal";
import { ThemeToggle } from "@/components/molecules/ThemeToggle";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import { useTheme } from "@/context/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateSystemConfig } from "@/store/slices/systemConfigSlice";
import { loginSchema, recoverySchema, type LoginFormData, type RecoveryFormData } from "@/schemas/auth.schema";
import { rolInfo } from "@/lib/status";
import { toast } from "@/lib/toast";
import type { CodigoRol, DataSourceMode } from "@/types";
import logoLight from "@/assets/icons/Logo + Tagline negro Web.webp";
import logoDark from "@/assets/icons/Logo + Tagline blanco Web.webp";

interface DemoAccount {
  email: string;
  nombre: string;
  rolCodigo: CodigoRol;
  alcance: string;
  descripcion: string;
  icon: LucideIcon;
}

const DEMO_PASSWORD = "demo2026";

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "admin_global@empresa.com",
    nombre: "Carlos Eduardo Montoya",
    rolCodigo: "ADMINISTRADOR",
    alcance: "Acceso total (todas las sedes)",
    descripcion: "Muelles, APIs, usuarios, RBAC e indicadores.",
    icon: Shield,
  },
  {
    email: "admin_rionegro@empresa.com",
    nombre: "Andrea Morales",
    rolCodigo: "SUPERVISOR_CD",
    alcance: "Sede Rionegro (exclusivo)",
    descripcion: "Muelles, horarios, citas y portería de su sede.",
    icon: Building2,
  },
  {
    email: "porteria_medellin@empresa.com",
    nombre: "Gabriel Torres",
    rolCodigo: "PORTERIA",
    alcance: "Sede Comercial (Medellín)",
    descripcion: "Garita, control de patio y llegadas.",
    icon: ShieldCheck,
  },
  {
    email: "contacto@proveedorXYZ.com",
    nombre: "Gerardo Valencia",
    rolCodigo: "PROVEEDOR",
    alcance: "NIT 900.123.456-1 (XYZ S.A.S.)",
    descripcion: "Agenda citas y consulta su histórico.",
    icon: Truck,
  },
  {
    email: "operativo_custom@empresa.com",
    nombre: "Lucas Bedoya",
    rolCodigo: "PERSONALIZADO",
    alcance: "Sede Rionegro (Muelle 2)",
    descripcion: "Lectura en Rionegro y edición exclusiva del Muelle 2.",
    icon: Users,
  },
];

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && raw !== "/login" ? raw : "/inicio";
}

function RecoveryModal({ open, defaultEmail, onClose }: { open: boolean; defaultEmail: string; onClose: () => void }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryFormData>({ resolver: zodResolver(recoverySchema) });

  useEffect(() => {
    if (open) {
      reset({ email: defaultEmail });
      setSentTo(null);
    }
  }, [open, defaultEmail, reset]);

  const onSubmit = handleSubmit(async ({ email }) => {
    await new Promise((r) => setTimeout(r, 500));
    setSentTo(email);
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Restablecer contraseña"
      description="Te enviaremos un enlace temporal de recuperación a tu correo institucional."
      footer={
        sentTo ? (
          <Button onClick={onClose}>Entendido</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="recovery-form" loading={isSubmitting}>
              Enviar instrucciones
            </Button>
          </>
        )
      }
    >
      {sentTo ? (
        <Alert variant="success" title="Correo enviado">
          Revisa la bandeja de entrada de <strong>{sentTo}</strong>.
        </Alert>
      ) : (
        <form id="recovery-form" onSubmit={onSubmit} noValidate>
          <Field label="Correo registrado" htmlFor="recovery-email" required error={errors.email?.message}>
            <Input id="recovery-email" type="email" invalid={!!errors.email} {...register("email")} />
          </Field>
        </form>
      )}
    </Modal>
  );
}

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { theme } = useTheme();
  const { hydrated, isAuthenticated, login } = useAuth();
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.systemConfig.dataSourceMode);
  const apiBaseUrl = useAppSelector((s) => s.systemConfig.apiBaseUrl);

  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [quickEmail, setQuickEmail] = useState<string | null>(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: DEMO_ACCOUNTS[0].email, password: DEMO_PASSWORD },
  });
  const currentEmail = watch("email");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace(next);
  }, [hydrated, isAuthenticated, next, router]);

  const doLogin = async (email: string, password: string) => {
    setError(null);
    const res = await login(email, password);
    if (res.success) toast.success(`Sesión iniciada como ${email}`);
    else setError(res.error);
  };

  const onSubmit = handleSubmit((data) => doLogin(data.email, data.password));

  const handleQuickLogin = async (email: string) => {
    setValue("email", email);
    setValue("password", DEMO_PASSWORD);
    setQuickEmail(email);
    await doLogin(email, DEMO_PASSWORD);
    setQuickEmail(null);
  };

  const handleModeChange = (value: DataSourceMode) => {
    dispatch(updateSystemConfig({ dataSourceMode: value }));
    setError(null);
  };

  if (!mounted || !hydrated || isAuthenticated) {
    return <PageLoader label={isAuthenticated ? "Ingresando…" : "Preparando acceso…"} />;
  }

  return (
    <div className="relative flex min-h-screen flex-col" style={{ background: "var(--page-bg)" }}>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ background: "var(--page-gradient)" }} />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:px-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px]"
              style={{ background: "var(--sb-mark-gradient)", boxShadow: "var(--sb-mark-shadow)" }}
            >
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <rect x="2" y="2" width="5.5" height="5.5" rx="1.4" fill="white" />
                <rect x="9.5" y="2" width="5.5" height="5.5" rx="1.4" fill="white" fillOpacity="0.42" />
                <rect x="2" y="9.5" width="5.5" height="5.5" rx="1.4" fill="white" fillOpacity="0.42" />
                <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1.4" fill="white" />
              </svg>
            </div>
            <Image
              src={theme === "dark" ? logoDark : logoLight}
              alt="PREBEL"
              height={22}
              style={{ width: "auto", maxWidth: 130, objectFit: "contain" }}
              priority
            />
          </div>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center py-8">
          <div className="grid w-full items-start gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Formulario */}
            <section className="lg:col-span-5">
              <div className="mb-6">
                <Badge tone="blue" size="sm">
                  <KeyRound size={11} /> Acceso corporativo seguro
                </Badge>
                <h1
                  className="mt-3 text-[28px] font-bold sm:text-[32px]"
                  style={{ color: "var(--sect-title)", letterSpacing: "-0.03em" }}
                >
                  Bienvenido a <span style={{ color: "var(--atom-blue-500)" }}>SWAC</span>
                </h1>
                <p className="mt-1.5 text-[13.5px]" style={{ color: "var(--sect-sub)" }}>
                  Sistema Web de Asignación de Citas: agendamiento, portería, patio y muelles de descargue.
                </p>
              </div>

              <Surface className="p-6">
                {error && (
                  <Alert variant="error" title="No fue posible iniciar sesión" className="mb-4" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={onSubmit} className="space-y-4" noValidate>
                  <Field label="Correo electrónico" htmlFor="email" required error={errors.email?.message}>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="username"
                      placeholder="usuario@empresa.com"
                      invalid={!!errors.email}
                      {...register("email")}
                    />
                  </Field>

                  <Field label="Contraseña" htmlFor="password" required error={errors.password?.message}>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="pr-10"
                        invalid={!!errors.password}
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md"
                        style={{ color: "var(--ctrl-text)" }}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setRecoveryOpen(true)}
                      className="text-[12px] font-medium"
                      style={{ color: "var(--atom-blue-500)" }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <Button type="submit" size="lg" className="w-full" loading={isSubmitting && !quickEmail}>
                    Ingresar al sistema
                    <ArrowRight size={15} />
                  </Button>
                </form>

                <div
                  className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4"
                  style={{ borderColor: "var(--card-divider)" }}
                >
                  <span className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--sect-sub)" }}>
                    <Database size={12} /> Origen de datos
                  </span>
                  <SegmentedControl<DataSourceMode>
                    ariaLabel="Origen de datos"
                    value={mode}
                    onChange={handleModeChange}
                    options={[
                      { value: "MOCK", label: "Demostración", icon: <Zap size={12} /> },
                      { value: "LIVE_API", label: "API real", icon: <Database size={12} /> },
                    ]}
                  />
                </div>
              </Surface>
            </section>

            {/* Perfiles demo */}
            <section className="lg:col-span-7" aria-labelledby="demo-profiles-title">
              {mode === "MOCK" ? (
                <>
                  <div className="mb-3">
                    <h2
                      id="demo-profiles-title"
                      className="text-[13px] font-bold uppercase tracking-[0.08em]"
                      style={{ color: "var(--sect-sub)" }}
                    >
                      Perfiles de demostración
                    </h2>
                    <p className="mt-1 text-[12.5px]" style={{ color: "var(--list-text-sub)" }}>
                      Ingresa con un clic para validar el aislamiento de datos, las guardas de ruta y el alcance por sede.
                    </p>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const Icon = acc.icon;
                      const rol = rolInfo(acc.rolCodigo);
                      const selected = currentEmail === acc.email;
                      return (
                        <li key={acc.email}>
                          <div
                            className="flex h-full flex-col gap-3 rounded-xl border p-4 transition-[border-color,box-shadow] duration-200"
                            style={{
                              background: "var(--card-bg)",
                              backdropFilter: "var(--card-blur)",
                              borderColor: selected ? "var(--card-border-hover)" : "var(--card-border)",
                              boxShadow: selected ? "var(--card-shadow-hover)" : "var(--card-shadow)",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setValue("email", acc.email);
                                setValue("password", DEMO_PASSWORD);
                              }}
                              className="flex items-start gap-3 text-left"
                            >
                              <span
                                aria-hidden="true"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                style={{ background: "var(--kpi-icon-info-bg)", color: "var(--kpi-icon-info-color)" }}
                              >
                                <Icon size={16} strokeWidth={1.8} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[13px] font-semibold" style={{ color: "var(--card-title)" }}>
                                    {acc.nombre}
                                  </span>
                                  <Badge size="sm" tone={rol.tone}>
                                    {rol.label}
                                  </Badge>
                                </span>
                                <span
                                  className="mt-0.5 block truncate text-[11.5px]"
                                  style={{ color: "var(--list-text-sub)", fontFamily: "var(--font-mono)" }}
                                >
                                  {acc.email}
                                </span>
                                <span className="mt-1 block text-[11.5px]" style={{ color: "var(--card-desc)" }}>
                                  {acc.alcance} · {acc.descripcion}
                                </span>
                              </span>
                            </button>
                            <Button
                              size="sm"
                              variant={selected ? "primary" : "secondary"}
                              className="mt-auto self-end"
                              loading={quickEmail === acc.email}
                              disabled={Boolean(quickEmail) && quickEmail !== acc.email}
                              onClick={() => handleQuickLogin(acc.email)}
                            >
                              Entrar
                              <ArrowRight size={13} />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-[11.5px]" style={{ color: "var(--result-text)" }}>
                    Contraseña de demostración: <code style={{ fontFamily: "var(--font-mono)" }}>{DEMO_PASSWORD}</code>
                  </p>
                </>
              ) : (
                <Alert variant="info" title="Modo API real">
                  La autenticación se realiza contra{" "}
                  <code style={{ fontFamily: "var(--font-mono)" }}>{apiBaseUrl}/auth/login</code>. Usa tus credenciales
                  corporativas. Para explorar la plataforma sin backend, cambia el origen de datos a “Demostración”.
                </Alert>
              )}
            </section>
          </div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 pb-2 text-[11px]" style={{ color: "var(--ft-text)" }}>
          <span>SWAC v1.0.0 — Multi-sede · RBAC</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>© {new Date().getFullYear()} PREBEL S.A.S. BIC</span>
        </footer>
      </div>
      <BrandBar />

      <RecoveryModal open={recoveryOpen} defaultEmail={getValues("email")} onClose={() => setRecoveryOpen(false)} />
    </div>
  );
}
