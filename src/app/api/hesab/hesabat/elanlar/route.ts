import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { ACCOUNT_TYPES, AUTH_KINDS, type Locale } from "@/lib/constants";
import { getOptionalUser } from "@/lib/auth/guard";
import { getListingAnalytics, parsePeriod } from "@/lib/accounts/listing-analytics";
import { listingReportSheets } from "@/lib/export/analytics-reports";
import { exportResponse, isExportFormat } from "@/lib/export/tabular";
import { isPublicApiBlocked, maintenanceApiResponse } from "@/lib/system-mode";

export const dynamic = "force-dynamic";

const NOT_FOUND = () => new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });

/**
 * Elan analitikasının ixracı (#238, PRD 11.6): `/kabinet/analitika` ilə eyni məlumat və giriş — öz
 * elanları, agentlik sahibinə agentlik elanları (`?agent=` filtri komandadan kənar id-ni nəzərə almır).
 */
export async function GET(request: Request) {
  if (await isPublicApiBlocked()) return maintenanceApiResponse();
  const user = await getOptionalUser(AUTH_KINDS.PUBLIC);
  // Elan yerləşdirə bilməyən adi istifadəçinin analitikası yoxdur.
  if (!user || user.accountType === ACCOUNT_TYPES.USER) return NOT_FOUND();

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  if (!isExportFormat(format)) return NOT_FOUND();
  const rawLocale = url.searchParams.get("l");
  const locale: Locale = rawLocale === "en" || rawLocale === "ru" ? rawLocale : "az";
  const period = parsePeriod(url.searchParams.get("dovr") ?? undefined);

  const [t, data] = await Promise.all([
    getTranslations({ locale, namespace: "account.analytics" }),
    getListingAnalytics({ userId: user.id, userName: user.name, period, agentUserId: url.searchParams.get("agent") ?? undefined }),
  ]);
  const label = (key: string, values?: Record<string, string | number>) => t(key as Parameters<typeof t>[0], values);
  return exportResponse(listingReportSheets(data, label), format, `elan-hesabati-${period}-gun`);
}
