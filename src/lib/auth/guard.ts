import { forbidden, redirect } from "next/navigation";
import type { Permission } from "@/lib/constants";
import { readSessionCookie, verifySessionToken } from "./cookies";
import { hasPermission } from "./permissions";
import { resolveSession, touchSession } from "./session";
import type { AuthUser } from "./types";

/**
 * Səlahiyyət yoxlaması.
 *
 * Middleware yalnız cookie imzasını yoxlayır — ucuzdur, amma ləğv edilmiş sessiyanı
 * görmür. Həqiqi yoxlama buradadır və **hər server action-ın ilk sətrində** çağırılmalıdır:
 * action-lar layout-dan keçmir, birbaşa POST ilə çağırıla bilir.
 */

export async function getOptionalUser(): Promise<AuthUser | null> {
  const token = await readSessionCookie();
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const user = await resolveSession(claims.sid);
  if (!user) return null;

  await touchSession(claims.sid);
  return user;
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getOptionalUser();
  if (!user) redirect("/giris");
  return user;
}

export async function requirePermission(permission: Permission): Promise<AuthUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) forbidden();
  return user;
}

/** Cari sessiyanın ID-si — «bu cihazdan başqa hamısını bağla» üçün lazımdır. */
export async function currentSessionId(): Promise<string | null> {
  const token = await readSessionCookie();
  if (!token) return null;
  const claims = await verifySessionToken(token);
  return claims?.sid ?? null;
}
