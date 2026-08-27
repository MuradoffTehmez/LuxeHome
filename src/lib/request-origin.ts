import { headers } from "next/headers";

/**
 * Sorğunun mənbə yoxlaması (CSRF).
 *
 * Ayrıca leaf moduldur və qəsdən heç nə idxal etmir (`next/headers`-dən başqa):
 * `admin/guard.ts` içində qalsaydı, onu çağıran hər fayl auth qatını —
 * deməli `next/navigation`-ı və Prisma klientini — də yükləməli olardı.
 * İctimai əlaqə forması bunların heç birinə ehtiyac duymur.
 */

export class SameOriginError extends Error {}

/**
 * Sorğunun bizim mənşədən gəldiyini yoxlayır.
 *
 * Next.js Server Action-ları özü `Origin` yoxlayır, amma bu davranış
 * konfiqurasiyadan asılıdır — burada açıq yoxlama var.
 */
export async function assertSameOrigin(): Promise<void> {
  const requestHeaders = await headers();

  // Brauzer eyni-mənşəli sorğuda bu başlığı özü qoyur və JavaScript onu dəyişə bilmir
  const fetchSite = requestHeaders.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new SameOriginError("Sorğu kənar saytdan gəlib.");
  }

  const origin = requestHeaders.get("origin");
  if (!origin) return; // Sec-Fetch-Site yoxlaması artıq keçib

  const host = requestHeaders.get("host");
  if (!host) throw new SameOriginError("Host başlığı yoxdur.");

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new SameOriginError("Origin başlığı oxunmadı.");
  }

  if (originHost !== host) {
    throw new SameOriginError("Origin host ilə uyğun gəlmir.");
  }
}
