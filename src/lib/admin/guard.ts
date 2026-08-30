import { headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAccount, requireLister, requirePermission } from "@/lib/auth/guard";
import { clientIp } from "@/lib/auth/rate-limit";
import {
  SameOriginError,
  assertSameOrigin as assertRequestSameOrigin,
} from "@/lib/request-origin";
import type { AuthUser } from "@/lib/auth/types";
import type { Permission } from "@/lib/constants";
import { DEFAULT_LOCALE, type Locale } from "@/lib/constants";

/**
 * Paneldəki hər yazma əməliyyatının giriş qapısı.
 *
 * Server action-lar layout-dan keçmir — birbaşa POST ilə çağırıla bilir. Buna görə
 * hər action ilk sətrində bu funksiyanı çağırmalıdır. Üç yoxlama bir yerdədir:
 *
 * 1. **Mənbə (CSRF).** Next.js Server Action-ları özü `Origin` yoxlayır, amma bu
 *    davranış konfiqurasiyadan asılıdır. Burada açıq yoxlama var: kənar saytdan
 *    göndərilən sorğu istifadəçinin sessiya cookie-si ilə gəlsə belə rədd edilir.
 * 2. **Səlahiyyət.** `requirePermission()` sessiyanı D1-dən oxuyur — ləğv edilmiş
 *    sessiya və deaktiv istifadəçi burada tutulur.
 * 3. **Sürət limiti.** Oğurlanmış sessiya ilə minlərlə qeydin bir dəqiqədə
 *    dəyişdirilməsinin qarşısını alır.
 */

export class AdminGuardError extends Error {}

/**
 * Mənbə yoxlaması. Məntiq `@/lib/request-origin`-dədir — ictimai formalar onu
 * auth qatını yükləmədən çağıra bilsin deyə. Burada yalnız xəta tipi panelin
 * gözlədiyi `AdminGuardError`-a çevrilir.
 */
export async function assertSameOrigin(): Promise<void> {
  try {
    await assertRequestSameOrigin();
  } catch (error) {
    if (error instanceof SameOriginError) throw new AdminGuardError(error.message);
    throw error;
  }
}

async function assertWriteLimit(userId: string, scope: string): Promise<void> {
  // Lokal `next dev` mühitində binding olmaya bilər — limit orada tətbiq edilmir
  const limiter = getCloudflareContext().env.ADMIN_LIMIT;
  if (!limiter) return;

  const { success } = await limiter.limit({ key: `${scope}:${userId}` });
  if (!success) {
    throw new AdminGuardError("Çox sayda əməliyyat oldu. Bir dəqiqə gözləyin.");
  }
}

export async function requireAdminAction(permission: Permission): Promise<AuthUser> {
  await assertSameOrigin();
  const user = await requirePermission(permission);
  await assertWriteLimit(user.id, "admin");
  return user;
}

/** İctimai kabinet yazıları üçün CSRF, hesab növü və ayrıca sürət limiti qapısı. */
export async function requirePublicAction(
  scope: "media" | "property" | "review" | "reservation" | "preferences" | "push",
  locale: Locale = DEFAULT_LOCALE,
): Promise<AuthUser> {
  await assertSameOrigin();
  const user = scope === "media" || scope === "property"
    ? await requireLister(locale)
    : await requireAccount(locale);
  await assertWriteLimit(user.id, `public:${scope}`);
  return user;
}

/** Yalnız oxuma əməliyyatları üçün — sürət limiti və CSRF yoxlaması olmadan. */
export { requirePermission as requireAdminRead };

export async function requestIp(): Promise<string> {
  return clientIp(await headers());
}
