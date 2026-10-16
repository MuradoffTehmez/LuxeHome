import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Flag, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Link } from "@/i18n/navigation";
import { formatLocalizedDate } from "@/i18n/date";
import { localizePath } from "@/i18n/path-locale";
import { requireAccount } from "@/lib/auth/guard";
import { getUserReports } from "@/lib/listing-reports";
import { buildManagedMetadata } from "@/lib/seo";
import { isActiveReportStatus, isReportReason, type Locale, type ReportStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.reports" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/sikayetlerim", noIndex: true, locale: locale as Locale });
}

const STATUS_TONE: Record<ReportStatus, "info" | "warning" | "success" | "neutral" | "danger"> = {
  OPEN: "info",
  IN_REVIEW: "info",
  NEEDS_INFO: "warning",
  RESOLVED: "success",
  DISMISSED: "neutral",
  CLOSED: "neutral",
};

/**
 * «Şikayətlərim» (#197): istifadəçinin öz şikayətləri və onların mərhələsi. Moderatorun adı,
 * daxili qeydlər, sahibə göndərilən sual və elan sahibinin məlumatı göstərilmir —
 * `getUserReports()` bu sahələri heç seçmir. Kabinet kənar keşə düşmür (`NEVER_CACHED_PREFIXES`).
 */
export default async function MyReportsPage() {
  const locale = (await getLocale()) as Locale;
  const user = await requireAccount(locale);
  const t = await getTranslations("account.reports");
  const reasonT = await getTranslations("property.report.reasons");
  const reports = await getUserReports(user.id);
  const activeCount = reports.filter((report) => isActiveReportStatus(report.status)).length;

  return (
    <div className="min-w-0">
      <PageHeader
        contained
        compact
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("count", { count: reports.length, active: activeCount })}
      />

      <div className="mt-8">
        {reports.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={{ label: t("emptyAction"), href: localizePath("/emlaklar", locale), localized: false }}
          />
        ) : (
          <ul className="flex flex-col gap-4">
            {reports.map((report) => {
              const decided = !isActiveReportStatus(report.status);
              return (
                <li key={report.id}>
                  <article className="min-w-0 rounded-xl border border-line bg-paper p-4 shadow-sm">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="font-sans text-base font-medium text-ink [overflow-wrap:anywhere]">
                          {report.propertySlug ? (
                            <Link href={`/emlaklar/${report.propertySlug}`} className="hover:text-gold-deep">
                              {report.propertyTitle}
                            </Link>
                          ) : (
                            report.propertyTitle ?? t("listingRemoved")
                          )}
                        </h2>
                        <p className="mt-1 text-xs text-ink-muted">
                          {t("sentAt", { date: formatLocalizedDate(report.createdAt, locale) ?? "" })}
                          {!report.propertySlug && report.propertyTitle ? ` · ${t("listingNotPublic")}` : ""}
                        </p>
                      </div>
                      <Badge tone={STATUS_TONE[report.status]} className="self-start">{t(`status.${report.status}`)}</Badge>
                    </div>

                    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t("reasons")}>
                      {report.reasons.map((reason) => (
                        <li key={reason}>
                          <Badge tone="neutral" className="gap-1">
                            <Flag className="size-3" aria-hidden="true" />
                            {isReportReason(reason) ? reasonT(reason) : t(`legacyReasons.${reason}`)}
                          </Badge>
                        </li>
                      ))}
                      {report.evidenceCount > 0 && (
                        <li>
                          <Badge tone="neutral" className="gap-1">
                            <ImageIcon className="size-3" aria-hidden="true" />
                            {t("evidence", { count: report.evidenceCount })}
                          </Badge>
                        </li>
                      )}
                    </ul>

                    <p className="mt-3 border-t border-line pt-3 text-sm text-ink-soft">
                      {decided
                        ? t(`outcome.${report.status as "RESOLVED" | "DISMISSED" | "CLOSED"}`)
                        : t(`stage.${report.status as "OPEN" | "IN_REVIEW" | "NEEDS_INFO"}`)}
                      {decided && report.resolvedAt
                        ? ` ${t("decidedAt", { date: formatLocalizedDate(report.resolvedAt, locale) ?? "" })}`
                        : ""}
                    </p>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-6 text-xs text-ink-muted">{t("privacy")}</p>
    </div>
  );
}
