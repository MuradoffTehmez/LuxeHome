import { headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requirePermission } from "@/lib/auth/guard";
import { clientIp } from "@/lib/auth/rate-limit";
import type { AuthUser } from "@/lib/auth/types";
import type { Permission } from "@/lib/constants";

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

/** Sorğunun bizim mənşədən gəldiyini yoxlayır. */
async function assertSameOrigin(): Promise<void> {
  const requestHeaders = await headers();

  // Brauzer eyni-mənşəli sorğuda bu başlığı özü qoyur və JavaScript onu dəyişə bilmir
  const fetchSite = requestHeaders.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new AdminGuardError("Sorğu kənar saytdan gəlib.");
  }

  const origin = requestHeaders.get("origin");
  if (!origin) return; // Sec-Fetch-Site yoxlaması artıq keçib

  const host = requestHeaders.get("host");
  if (!host) throw new AdminGuardError("Host başlığı yoxdur.");

  try {
    if (new URL(origin).host !== host) {
      throw new AdminGuardError("Origin host ilə uyğun gəlmir.");
    }
  } catch {
    throw new AdminGuardError("Origin başlığı oxunmadı.");
  }
}

async function assertWriteLimit(userId: string): Promise<void> {
  // Lokal `next dev` mühitində binding olmaya bilər — limit orada tətbiq edilmir
  const limiter = getCloudflareContext().env.ADMIN_LIMIT;
  if (!limiter) return;

  const { success } = await limiter.limit({ key: `admin:${userId}` });
  if (!success) {
    throw new AdminGuardError("Çox sayda əməliyyat oldu. Bir dəqiqə gözləyin.");
  }
}

export async function requireAdminAction(permission: Permission): Promise<AuthUser> {
  await assertSameOrigin();
  const user = await requirePermission(permission);
  await assertWriteLimit(user.id);
  return user;
}

/** Yalnız oxuma əməliyyatları üçün — sürət limiti və CSRF yoxlaması olmadan. */
export { requirePermission as requireAdminRead };

export async function requestIp(): Promise<string> {
  return clientIp(await headers());
}
