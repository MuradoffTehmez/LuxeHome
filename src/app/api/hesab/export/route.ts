import { NextResponse } from "next/server";
import { AUTH_KINDS } from "@/lib/constants";
import { getOptionalUser } from "@/lib/auth/guard";
import { checkDataExportLimit } from "@/lib/auth/rate-limit";
import { recordDomainEvent } from "@/lib/admin/events";
import { buildAccountExport } from "@/lib/accounts/data-export";
import { isPublicApiBlocked, maintenanceApiResponse } from "@/lib/system-mode";

export const dynamic = "force-dynamic";

const NO_STORE = "private, no-store, max-age=0";

/**
 * «Məlumatlarımı yüklə» (#157). Tərkib və gizli dəyərlərin çıxarılması qaydası
 * `lib/accounts/data-export.ts`-dədir; burada yalnız sessiya, limit və fayl başlıqları.
 */
export async function GET() {
  // Texniki xidmət rejimində ictimai hesab API-si də bağlanır —
  // middleware matcher-i `/api/*` yollarını əhatə etmir.
  if (await isPublicApiBlocked()) return maintenanceApiResponse();

  const sessionUser = await getOptionalUser(AUTH_KINDS.PUBLIC);
  if (!sessionUser) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401, headers: { "Cache-Control": NO_STORE } });
  if (!(await checkDataExportLimit(sessionUser.id))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Cache-Control": NO_STORE } });
  }

  const data = await buildAccountExport(sessionUser.id);
  if (!data) return NextResponse.json({ error: "Hesab tapılmadı" }, { status: 404, headers: { "Cache-Control": NO_STORE } });
  await recordDomainEvent("account.data_exported", "User", sessionUser.id, { version: data.version });

  const date = data.exportedAt.slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="luxehome-melumatlarim-${date}.json"`,
      "Cache-Control": NO_STORE,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
