import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AGENCY_MEMBER_PERMISSIONS, AUTH_KINDS, type Locale } from "@/lib/constants";
import { getOptionalUser } from "@/lib/auth/guard";
import { getAgencyAccess, hasAgencyPermission } from "@/lib/accounts/agency-access";
import { getAgencyAnalytics, parseAnalyticsRange } from "@/lib/accounts/agency-analytics";
import { agencyReportSheets } from "@/lib/export/analytics-reports";
import { exportResponse, isExportFormat } from "@/lib/export/tabular";
import { isPublicApiBlocked, maintenanceApiResponse } from "@/lib/system-mode";

export const dynamic = "force-dynamic";

const NOT_FOUND = () => new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });

/**
 * Agentlik analitikasının ixracı (#238, PRD 11.6): `?format=csv|xlsx`, interval səhifə ilə eyni
 * (`?dovr=` və ya `?dan=&ad=`), dil `?l=`. Giriş səhifənin qaydasıdır — agentlik sahibi və `LEADS_MANAGE`;
 * icazəsiz sorğu 404 alır (hesabatın varlığı bildirilmir).
 */
export async function GET(request: Request) {
  if (await isPublicApiBlocked()) return maintenanceApiResponse();
  const user = await getOptionalUser(AUTH_KINDS.PUBLIC);
  if (!user) return NOT_FOUND();
  const access = await getAgencyAccess(user);
  if (!hasAgencyPermission(access, AGENCY_MEMBER_PERMISSIONS.LEADS_MANAGE)) return NOT_FOUND();

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  if (!isExportFormat(format)) return NOT_FOUND();
  const rawLocale = url.searchParams.get("l");
  const locale: Locale = rawLocale === "en" || rawLocale === "ru" ? rawLocale : "az";
  const range = parseAnalyticsRange({
    dovr: url.searchParams.get("dovr") ?? undefined,
    dan: url.searchParams.get("dan") ?? undefined,
    ad: url.searchParams.get("ad") ?? undefined,
  });

  const [t, data] = await Promise.all([
    getTranslations({ locale, namespace: "account.agencyAnalytics" }),
    getAgencyAnalytics({ agencyId: access.agencyId, ownerUserId: access.ownerUserId, range }),
  ]);
  const label = (key: string, values?: Record<string, string | number>) => t(key as Parameters<typeof t>[0], values);
  return exportResponse(agencyReportSheets(data, label), format, `agentlik-hesabati-${range.fromDay}-${range.toDay}`);
}
