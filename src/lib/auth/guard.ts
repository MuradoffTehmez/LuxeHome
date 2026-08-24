import { forbidden, redirect } from "next/navigation";
import {
  AUTH_KINDS,
  DEFAULT_LOCALE,
  LISTING_ACCOUNT_TYPES,
  type AuthKind,
  type Locale,
  type Permission,
} from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";
import { readSessionCookie, verifySessionToken } from "./cookies";
import { hasPermission } from "./permissions";
import { canAccessAdmin } from "./public-account-policy";
import { matchesSessionProjection } from "./session-projection";
import { resolveSession, touchSession } from "./session";
import type { AuthUser } from "./types";

/**
 * Səlahiyyət yoxlaması.
 *
 * Middleware yalnız cookie imzasını yoxlayır — ucuzdur, amma ləğv edilmiş sessiyanı
 * görmür. Həqiqi yoxlama buradadır və **hər server action-ın ilk sətrində** çağırılmalıdır:
 * action-lar layout-dan keçmir, birbaşa POST ilə çağırıla bilir.
 */

export async function getOptionalUser(expectedAuthKind?: AuthKind): Promise<AuthUser | null> {
  const token = await readSessionCookie();
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const session = await resolveSession(claims.sid);
  if (!session || !matchesSessionProjection(claims, session)) return null;
  if (expectedAuthKind && session.sessionAuthKind !== expectedAuthKind) return null;

  await touchSession(claims.sid);
  return session;
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getOptionalUser();
  if (!user) redirect("/giris");
  return user;
}

export async function requirePermission(permission: Permission): Promise<AuthUser> {
  const user = await requireStaff();
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

/**
 * Panel yalnız şirkət əməkdaşları üçündür.
 *
 * `requireUser()` burada kifayət deyil: ictimai qeydiyyatdan keçən hesab da etibarlı
 * sessiya daşıyır və middleware yalnız cookie imzasına baxır. Hesab növü yoxlanmasa,
 * adi istifadəçi `/admin` ünvanını açıq yaza bilərdi.
 *
 * İkinci yoxlama 2FA-dır: əməkdaş hesabı ictimai giriş ekranından açılsaydı, iki
 * mərhələli doğrulama yan keçilərdi. Sessiya `/giris` axınından gəlməlidir.
 */
export async function requireStaff(): Promise<AuthUser> {
  const user = await getOptionalUser(AUTH_KINDS.STAFF_2FA);
  if (!user) redirect("/giris?yeniden=1");
  if (!canAccessAdmin(user.accountType)) forbidden();
  return user;
}

/** İctimai kabinet — yalnız aktiv qeyri-əməkdaş hesabları üçündür. */
export async function requireAccount(locale: Locale = DEFAULT_LOCALE): Promise<AuthUser> {
  const user = await getOptionalUser(AUTH_KINDS.PUBLIC);
  if (!user) redirect(localizePath("/daxil-ol?yeniden=1", locale));
  if (canAccessAdmin(user.accountType)) redirect("/admin");
  return user;
}

/** Elan yerləşdirə bilən hesab növü (mülk sahibi və ya agentlik). */
export async function requireLister(locale: Locale = DEFAULT_LOCALE): Promise<AuthUser> {
  const user = await requireAccount(locale);
  if (!LISTING_ACCOUNT_TYPES.includes(user.accountType)) forbidden();
  return user;
}
