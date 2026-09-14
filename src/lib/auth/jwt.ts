import type { Usuario } from "@/types";

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "="));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * JWT simulado (sin firma criptográfica real) para el modo MOCK.
 * En modo API real el token lo emite el backend.
 */
export function createSimulatedJwt(user: Usuario, permissions: string[], hours = 8): string {
  const iat = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      nombre: user.nombreCompleto,
      rol: user.rolCodigo,
      sedes: user.sedesAsignadasIds,
      nit: user.nit_proveedor ?? null,
      proveedorId: user.proveedorId ?? null,
      permsCount: permissions.length,
      iat,
      exp: iat + hours * 3600,
    })
  );
  const signature = base64UrlEncode(`swac_sig_${user.id}_${Date.now()}`).slice(0, 32);
  return `${header}.${payload}.${signature}`;
}

/** Decodifica el payload de un JWT (sin verificar la firma). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split(".");
    return payload ? (JSON.parse(base64UrlDecode(payload)) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
