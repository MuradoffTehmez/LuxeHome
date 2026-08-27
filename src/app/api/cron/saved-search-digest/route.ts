import { NextResponse } from "next/server";
import { timingSafeEqual } from "@/lib/auth/crypto";
import { runSavedSearchDigest } from "@/lib/saved-search-digest";
import { savedSearchDigestStore } from "@/lib/queries";

/**
 * «Gündəlik» / «Həftəlik» saxlanmış axtarış digest-inin işə salma nöqtəsi.
 *
 * **Niyə route, `scheduled()` handler deyil.** OpenNext-in yaratdığı worker
 * (`.open-next/worker.js`) yalnız `fetch` ixrac edir; ora `scheduled` əlavə
 * etmək generasiya olunan giriş nöqtəsini əl ilə sarımaq deməkdir və hər
 * OpenNext yeniləməsində sınma riski yaradır. Ona görə iş adi marşrut kimi
 * yazılıb və kənardan çağırılır — çağıran tərəf `CRON_SECRET` daşımalıdır.
 *
 * Cron qoşulması (bir dəfəlik, əl ilə):
 *
 * 1. `npx wrangler secret put CRON_SECRET` (staging üçün `--env staging`).
 * 2. Cloudflare-də kiçik ayrıca worker yaradılır, cron trigger-i olur
 *    (`0 8 * * *`) və `scheduled()` içindən bu ünvana `POST` atır:
 *    `https://luxehomeestate.az/api/cron/saved-search-digest`
 *    `Authorization: Bearer <CRON_SECRET>` başlığı ilə.
 *
 * İş idempotentdir: göndərilmiş uyğunluqlar `notifiedAt` ilə möhürlənir, ona
 * görə təsadüfən iki dəfə çağırılsa da təkrar məktub getmir.
 */

export const dynamic = "force-dynamic";

/** `Authorization: Bearer <secret>` başlığını yoxlayır. */
function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  // Sirr təyin edilməyibsə marşrut bağlıdır — «boş sirr = hamıya açıq» olmamalıdır
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;

  const encoder = new TextEncoder();
  return timingSafeEqual(encoder.encode(header.slice(prefix.length)), encoder.encode(expected));
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    // İşin varlığını kənara bildirməmək üçün 404 — 401 marşrutun mövcudluğunu təsdiqləyərdi
    return new NextResponse(null, { status: 404 });
  }

  try {
    const result = await runSavedSearchDigest(savedSearchDigestStore);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("[cron] saxlanmış axtarış digest-i işləmədi:", error);
    return NextResponse.json({ error: "digest failed" }, { status: 500 });
  }
}
