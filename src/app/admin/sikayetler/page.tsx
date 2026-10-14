import type { Metadata } from "next";
import Link from "next/link";
import { Ban, CheckCheck, ExternalLink, Flag, Pencil, ShieldOff, Tag } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { ReasonAction } from "@/components/admin/reason-action";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminI18n } from "@/lib/admin-i18n";
import { getReportGroups } from "@/lib/listing-reports";
import { localizePath } from "@/i18n/path-locale";
import {
  LISTING_TYPES,
  PERMISSIONS,
  PROPERTY_STATUSES,
  REPORT_REASON_LABELS,
  REPORT_RESOLUTIONS,
  REPORT_STATUSES,
  REPORT_URGENT_THRESHOLD,
  type ReportStatus,
} from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { archiveReportedListing, closeReportedListing, dismissListingReports, resolveListingReports } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminI18n();
  return { title: t("pages.reports.title") };
}
export const dynamic = "force-dynamic";

const TABS: ReportStatus[] = [REPORT_STATUSES.OPEN, REPORT_STATUSES.RESOLVED, REPORT_STATUSES.DISMISSED];

/**
 * Elan şikayətləri (#159). Şikayətlər elan üzrə qruplaşdırılıb: ən çox şikayət alan elan
 * yuxarıdadır, `REPORT_URGENT_THRESHOLD` və daha çox açıq şikayət «təcili» nişanı alır.
 * Qərar elanın bütün açıq şikayətlərinə aiddir.
 */
export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const { t, locale } = await getAdminI18n();
  const params = await searchParams;
  const status = TABS.includes(params.status as ReportStatus) ? (params.status as ReportStatus) : REPORT_STATUSES.OPEN;
  const [groups, counts] = await Promise.all([
    getReportGroups(status),
    prisma.listingReport.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countOf = (value: ReportStatus) => counts.find((row) => row.status === value)?._count._all ?? 0;
  const tabLabel: Record<ReportStatus, string> = {
    OPEN: t("pages.reports.tabOpen"),
    RESOLVED: t("pages.reports.tabResolved"),
    DISMISSED: t("pages.reports.tabDismissed"),
  };
  const resolutionLabel = (value: string | null) =>
    value === REPORT_RESOLUTIONS.ARCHIVED
      ? t("pages.reports.resolutionArchived")
      : value === REPORT_RESOLUTIONS.MARKED_CLOSED
        ? t("pages.reports.resolutionClosed")
        : t("pages.reports.resolutionNone");

  return (
    <>
      <AdminPageHeader
        title={t("pages.reports.title")}
        description={t("pages.reports.description")}
        breadcrumbs={[{ label: t("pages.moderation.idarePaneli"), href: "/admin" }, { label: t("pages.reports.title") }]}
      />

      <nav aria-label={t("pages.reports.tabsLabel")} className="mb-5 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === REPORT_STATUSES.OPEN ? "/admin/sikayetler" : `/admin/sikayetler?status=${tab}`}
            aria-current={status === tab ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
              status === tab ? "border-gold bg-gold/10 font-medium text-ink" : "border-line bg-paper text-ink-soft hover:border-gold",
            )}
          >
            {tabLabel[tab]}
            <span className="tabular text-xs text-ink-muted">{countOf(tab)}</span>
          </Link>
        ))}
      </nav>

      {groups.length === 0 ? (
        <AdminCard>
          <EmptyState title={t("pages.reports.empty")} description={t("pages.reports.emptyDescription")} />
        </AdminCard>
      ) : (
        <AdminCard bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {groups.map((group) => {
              const { property } = group;
              const urgent = status === REPORT_STATUSES.OPEN && group.count >= REPORT_URGENT_THRESHOLD;
              const isPublic = !property.deletedAt
                && ([PROPERTY_STATUSES.PUBLISHED, PROPERTY_STATUSES.RESERVED, PROPERTY_STATUSES.SOLD, PROPERTY_STATUSES.RENTED] as string[]).includes(property.status);
              return (
                <li key={property.id} className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/emlaklar/${property.id}`} className="font-medium text-ink hover:text-gold-deep [overflow-wrap:anywhere]">
                        {property.title}
                      </Link>
                      <Badge tone={urgent ? "danger" : "warning"} className="gap-1">
                        <Flag className="size-3" aria-hidden="true" />
                        {t("pages.reports.count", { count: group.count })}
                      </Badge>
                      {urgent && <Badge tone="danger">{t("pages.reports.urgent")}</Badge>}
                      <Badge tone="neutral">{t(`labels.propertyStatus.${property.status as keyof typeof PROPERTY_STATUSES}`)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {property.author
                        ? `${property.author.name} · ${property.author.email} · ${t(`labels.accountType.${property.author.accountType as "USER"}`)}`
                        : t("pages.reports.companyListing")}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {group.reasons.map(([reason, count]) => (
                        <li key={reason}>
                          <Badge tone="neutral">
                            {t(`labels.reportReason.${reason as keyof typeof REPORT_REASON_LABELS}`)}
                            {count > 1 ? ` × ${count}` : ""}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                    {group.reports.some((report) => report.message) && (
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {group.reports.filter((report) => report.message).slice(0, 3).map((report) => (
                          <li key={report.id} className="rounded-sm border border-line bg-ivory px-3 py-2 text-sm text-ink-soft [overflow-wrap:anywhere]">
                            «{report.message}»
                            <span className="ml-2 text-xs text-ink-muted">{formatDateTime(report.createdAt)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {status !== REPORT_STATUSES.OPEN && (
                      <p className="mt-2 text-xs text-ink-muted">
                        {resolutionLabel(group.reports[0].resolution)}
                        {group.reports[0].resolvedBy ? ` · ${group.reports[0].resolvedBy.name}` : ""}
                        {group.reports[0].resolvedAt ? ` · ${formatDateTime(group.reports[0].resolvedAt)}` : ""}
                        {group.reports[0].resolutionNote ? ` · ${group.reports[0].resolutionNote}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    {isPublic && (
                      <a
                        href={localizePath(`/emlaklar/${property.slug}`, locale)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("pages.reports.viewListing")}
                        title={t("pages.reports.viewListing")}
                        className="inline-flex size-11 items-center justify-center rounded-xs text-ink-soft transition-colors hover:text-gold-deep"
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                      </a>
                    )}
                    <Link
                      href={`/admin/emlaklar/${property.id}`}
                      aria-label={t("pages.reports.editListing")}
                      title={t("pages.reports.editListing")}
                      className="inline-flex size-11 items-center justify-center rounded-xs text-ink-soft transition-colors hover:text-gold-deep"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Link>
                    {status === REPORT_STATUSES.OPEN && (
                      <>
                        <ReasonAction
                          action={archiveReportedListing}
                          id={property.id}
                          label={t("pages.reports.archive")}
                          title={t("pages.reports.archiveTitle")}
                          description={t("pages.reports.archiveDescription", { title: property.title })}
                          confirmLabel={t("pages.reports.archive")}
                          presets={[
                            t("pages.reports.presets.fake"),
                            t("pages.reports.presets.price"),
                            t("pages.reports.presets.info"),
                            t("pages.reports.presets.fraud"),
                          ]}
                          className="inline-flex min-h-11 w-auto items-center gap-1.5 px-3 text-sm"
                        >
                          <Ban className="size-4" aria-hidden="true" />
                          {t("pages.reports.archive")}
                        </ReasonAction>
                        <ConfirmAction
                          action={closeReportedListing}
                          id={property.id}
                          label={property.listingType === LISTING_TYPES.RENT ? t("pages.reports.markRented") : t("pages.reports.markSold")}
                          title={property.listingType === LISTING_TYPES.RENT ? t("pages.reports.markRented") : t("pages.reports.markSold")}
                          description={t("pages.reports.markClosedDescription", { title: property.title })}
                          confirmLabel={t("pages.reports.confirm")}
                          tone="neutral"
                          className="inline-flex min-h-11 w-auto items-center gap-1.5 px-3 text-sm"
                        >
                          <Tag className="size-4" aria-hidden="true" />
                          {property.listingType === LISTING_TYPES.RENT ? t("pages.reports.markRented") : t("pages.reports.markSold")}
                        </ConfirmAction>
                        <ConfirmAction
                          action={resolveListingReports}
                          id={property.id}
                          label={t("pages.reports.resolve")}
                          title={t("pages.reports.resolve")}
                          description={t("pages.reports.resolveDescription")}
                          confirmLabel={t("pages.reports.confirm")}
                          tone="neutral"
                        >
                          <CheckCheck className="size-4" aria-hidden="true" />
                        </ConfirmAction>
                        <ConfirmAction
                          action={dismissListingReports}
                          id={property.id}
                          label={t("pages.reports.dismiss")}
                          title={t("pages.reports.dismiss")}
                          description={t("pages.reports.dismissDescription")}
                          confirmLabel={t("pages.reports.dismiss")}
                        >
                          <ShieldOff className="size-4" aria-hidden="true" />
                        </ConfirmAction>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </AdminCard>
      )}
    </>
  );
}
