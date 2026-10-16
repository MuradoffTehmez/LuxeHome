import type { Metadata } from "next";
import Link from "next/link";
import {
  Ban,
  CheckCheck,
  ExternalLink,
  Flag,
  UserCheck,
  MessageCircleQuestion,
  NotebookPen,
  Pencil,
  RotateCcw,
  ShieldOff,
  Tag,
  XCircle,
} from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { ReasonAction } from "@/components/admin/reason-action";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminI18n } from "@/lib/admin-i18n";
import { reportModeratorWhere } from "@/lib/admin/report-moderators";
import { getReportGroups, getReportQueueStats } from "@/lib/listing-reports";
import { localizePath } from "@/i18n/path-locale";
import {
  ACTIVE_REPORT_STATUSES,
  LISTING_TYPES,
  PERMISSIONS,
  PROPERTY_STATUSES,
  REPORT_STATUSES,
  isActiveReportStatus,
  type ReportResolution,
  type ReportStatus,
  type StoredReportReason,
} from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { AssignReportsSelect } from "./assign-select";
import { ReportNoteForm } from "./note-form";
import {
  addListingReportNote,
  archiveReportedListing,
  assignListingReports,
  closeListingReports,
  closeReportedListing,
  dismissListingReports,
  reopenListingReports,
  requestListingInfo,
  resolveListingReports,
  takeListingReports,
} from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminI18n();
  return { title: t("pages.reports.title") };
}
export const dynamic = "force-dynamic";

const ACTIVE_TAB = "ACTIVE";
type Tab = typeof ACTIVE_TAB | ReportStatus;
const TABS: Tab[] = [ACTIVE_TAB, ...Object.values(REPORT_STATUSES)];

const STATUS_TONE: Record<ReportStatus, "info" | "warning" | "success" | "neutral" | "danger"> = {
  OPEN: "danger",
  IN_REVIEW: "info",
  NEEDS_INFO: "warning",
  RESOLVED: "success",
  DISMISSED: "neutral",
  CLOSED: "neutral",
};

function tabHref(tab: Tab, mine: boolean): string {
  const params = new URLSearchParams();
  if (tab !== ACTIVE_TAB) params.set("status", tab);
  if (mine) params.set("menim", "1");
  const query = params.toString();
  return query ? `/admin/sikayetler?${query}` : "/admin/sikayetler";
}

/**
 * Elan şikayətləri (#159, iş axını #195). Şikayətlər elan üzrə qruplaşdırılıb: yüksək
 * prioritetli (beh tələbi, dələduzluq, çoxsaylı şikayət) elan yuxarıdadır. Moderator qrupu
 * götürür, sahibdən izahat istəyir və qərar verir; qərar elanın bütün aktiv şikayətlərinə aiddir.
 */
export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const { t, locale } = await getAdminI18n();
  const params = await searchParams;
  const tab: Tab = TABS.includes(params.status as Tab) ? (params.status as Tab) : ACTIVE_TAB;
  const mine = params.menim === "1";
  const statuses: readonly ReportStatus[] = tab === ACTIVE_TAB ? ACTIVE_REPORT_STATUSES : [tab];

  const [groups, stats, moderators] = await Promise.all([
    getReportGroups(statuses, mine ? { assigneeId: user.id } : {}),
    getReportQueueStats(),
    prisma.user.findMany({ where: reportModeratorWhere(), select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const activeCount = ACTIVE_REPORT_STATUSES.reduce((sum, status) => sum + stats.counts[status], 0);
  const countOf = (value: Tab) => (value === ACTIVE_TAB ? activeCount : stats.counts[value]);
  const tabLabel = (value: Tab) => (value === ACTIVE_TAB ? t("pages.reports.tabActive") : t(`labels.reportStatus.${value}`));
  const reasonLabel = (reason: StoredReportReason) => t(`labels.reportReason.${reason}`);

  const statCards = [
    { label: t("pages.reports.stats.total"), value: String(stats.total) },
    { label: t("pages.reports.stats.new"), value: String(stats.counts.OPEN) },
    { label: t("pages.reports.stats.highPriority"), value: String(stats.highPriority) },
    { label: t("pages.reports.stats.repeated"), value: String(stats.repeated) },
    {
      label: t("pages.reports.stats.confirmedRate"),
      value: stats.confirmedRate === null ? "—" : t("pages.reports.stats.percent", { value: stats.confirmedRate }),
    },
    {
      label: t("pages.reports.stats.averageResolution"),
      value: stats.averageResolutionHours === null
        ? "—"
        : stats.averageResolutionHours < 1
          ? t("pages.reports.stats.lessThanHour")
          : t("pages.reports.stats.hours", { value: Math.round(stats.averageResolutionHours) }),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={t("pages.reports.title")}
        description={t("pages.reports.description")}
        breadcrumbs={[{ label: t("pages.moderation.idarePaneli"), href: "/admin" }, { label: t("pages.reports.title") }]}
      />

      <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-line bg-paper px-4 py-3">
            <dt className="text-xs text-ink-muted">{card.label}</dt>
            <dd className="tabular mt-1 text-xl font-semibold text-ink">{card.value}</dd>
          </div>
        ))}
      </dl>
      <p className="-mt-3 mb-5 text-xs text-ink-muted">{t("pages.reports.stats.window")}</p>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label={t("pages.reports.tabsLabel")} className="flex flex-wrap gap-2">
          {TABS.map((value) => (
            <Link
              key={value}
              href={tabHref(value, mine)}
              aria-current={tab === value ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
                tab === value ? "border-gold bg-gold/10 font-medium text-ink" : "border-line bg-paper text-ink-soft hover:border-gold",
              )}
            >
              {tabLabel(value)}
              <span className="tabular text-xs text-ink-muted">{countOf(value)}</span>
            </Link>
          ))}
        </nav>
        <Link
          href={tabHref(tab, !mine)}
          aria-pressed={mine}
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center self-start whitespace-nowrap rounded-full border px-4 text-sm transition-colors",
            mine ? "border-gold bg-gold/10 font-medium text-ink" : "border-line bg-paper text-ink-soft hover:border-gold",
          )}
        >
          {t("pages.reports.mine")}
        </Link>
      </div>

      <p className="mb-4 text-xs text-ink-muted">{t("pages.reports.evidenceRule")}</p>

      {groups.length === 0 ? (
        <AdminCard>
          <EmptyState title={t("pages.reports.empty")} description={t("pages.reports.emptyDescription")} />
        </AdminCard>
      ) : (
        <AdminCard bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {groups.map((group) => {
              const { property } = group;
              const active = isActiveReportStatus(group.status);
              const isPublic = !property.deletedAt
                && ([PROPERTY_STATUSES.PUBLISHED, PROPERTY_STATUSES.RESERVED, PROPERTY_STATUSES.SOLD, PROPERTY_STATUSES.RENTED] as string[]).includes(property.status);
              const { decision } = group;
              const closeLabel = property.listingType === LISTING_TYPES.RENT ? t("pages.reports.markRented") : t("pages.reports.markSold");
              return (
                <li key={property.id} className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/emlaklar/${property.id}`} className="font-medium text-ink hover:text-gold-deep [overflow-wrap:anywhere]">
                          {property.title}
                        </Link>
                        <Badge tone={STATUS_TONE[group.status]}>{t(`labels.reportStatus.${group.status}`)}</Badge>
                        <Badge tone={group.priority === "high" && active ? "danger" : "warning"} className="gap-1">
                          <Flag className="size-3" aria-hidden="true" />
                          {t("pages.reports.count", { count: group.count })}
                        </Badge>
                        {active && group.priority === "high" && <Badge tone="danger">{t("pages.reports.urgent")}</Badge>}
                        <Badge tone="neutral">{t(`labels.propertyStatus.${property.status as keyof typeof PROPERTY_STATUSES}`)}</Badge>
                        {property.riskScore > 0 && (
                          <Badge tone={property.riskScore >= 50 ? "danger" : "neutral"}>{t("pages.reports.risk", { score: property.riskScore })}</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">
                        {property.author
                          ? `${property.author.name} · ${property.author.email} · ${t(`labels.accountType.${property.author.accountType as "USER"}`)}`
                          : t("pages.reports.companyListing")}
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t("pages.reports.reasons")}>
                        {group.reasons.map(([reason, count]) => (
                          <li key={reason}>
                            <Badge tone="neutral">
                              {reasonLabel(reason)}
                              {count > 1 ? ` × ${count}` : ""}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
                      {active ? (
                        <AssignReportsSelect
                          propertyId={property.id}
                          assigneeId={group.assignee?.id ?? null}
                          moderators={moderators}
                          action={assignListingReports}
                        />
                      ) : group.assignee ? (
                        <p className="text-xs text-ink-muted">{t("pages.reports.reviewedBy", { name: group.assignee.name })}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-1">
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
                        {active && group.assignee?.id !== user.id && (
                          <ConfirmAction
                            action={takeListingReports}
                            id={property.id}
                            label={t("pages.reports.take")}
                            title={t("pages.reports.take")}
                            description={t("pages.reports.takeDescription")}
                            confirmLabel={t("pages.reports.take")}
                            tone="neutral"
                          >
                            <UserCheck className="size-4" aria-hidden="true" />
                          </ConfirmAction>
                        )}
                        {!active && decision && (
                          <ConfirmAction
                            action={reopenListingReports}
                            id={decision.cycleId}
                            label={t("pages.reports.reopen")}
                            title={t("pages.reports.reopen")}
                            description={t("pages.reports.reopenDescription")}
                            confirmLabel={t("pages.reports.reopen")}
                            tone="neutral"
                            className="inline-flex min-h-11 w-auto items-center gap-1.5 px-3 text-sm"
                          >
                            <RotateCcw className="size-4" aria-hidden="true" />
                            {t("pages.reports.reopen")}
                          </ConfirmAction>
                        )}
                      </div>
                    </div>
                  </div>

                  {group.infoRequest && (
                    <p className="rounded-sm border border-warning/30 bg-warning-bg px-3 py-2 text-sm text-ink [overflow-wrap:anywhere]">
                      <span className="font-medium text-ink">{t("pages.reports.infoRequested")}</span>{" "}
                      {group.infoRequest.note}
                      {group.infoRequest.at && <span className="ml-2 text-xs text-ink-muted">{formatDateTime(group.infoRequest.at)}</span>}
                    </p>
                  )}

                  {group.reports.some((report) => report.message || report.evidence.length > 0) && (
                    <ul className="flex flex-col gap-2">
                      {group.reports
                        .filter((report) => report.message || report.evidence.length > 0)
                        .slice(0, 5)
                        .map((report) => (
                          <li key={report.id} className="rounded-sm border border-line bg-ivory px-3 py-2 text-sm text-ink-soft">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                              <span>{formatDateTime(report.createdAt)}</span>
                              <span>· {report.reasons.map(reasonLabel).join(", ")}</span>
                              <span>· {report.reporterUserId ? t("pages.reports.signedInReporter") : t("pages.reports.guestReporter")}</span>
                            </div>
                            {report.message && <p className="mt-1 [overflow-wrap:anywhere]">«{report.message}»</p>}
                            {report.evidence.length > 0 && (
                              <ul className="mt-2 flex flex-wrap gap-2" aria-label={t("pages.reports.evidence")}>
                                {report.evidence.map((evidenceId, index) => (
                                  <li key={evidenceId}>
                                    <a
                                      href={`/api/admin/sikayetler/subut/${evidenceId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block size-20 overflow-hidden rounded-sm border border-line bg-paper hover:border-gold"
                                    >
                                      {/* Məxfi, icazəli marşrut — `next/image` optimizasiyası (və keşi) qəsdən işlənmir. */}
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={`/api/admin/sikayetler/subut/${evidenceId}`}
                                        alt={t("pages.reports.evidenceAlt", { index: index + 1 })}
                                        loading="lazy"
                                        className="size-full object-cover"
                                      />
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                    </ul>
                  )}

                  <section aria-label={t("pages.reports.notesTitle")} className="flex flex-col gap-2 rounded-sm border border-dashed border-line-strong px-3 py-3">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      <NotebookPen className="size-3.5" aria-hidden="true" />
                      {t("pages.reports.notesTitle")}
                      <span className="font-normal normal-case tracking-normal">· {t("pages.reports.notesPrivate")}</span>
                    </h3>
                    {group.notes.length > 0 && (
                      <ul className="flex flex-col gap-1.5">
                        {group.notes.map((note) => (
                          <li key={note.id} className="text-sm text-ink-soft [overflow-wrap:anywhere]">
                            <span className="whitespace-pre-line">{note.body}</span>
                            <span className="ml-2 text-xs text-ink-muted">
                              {note.author?.name ?? t("pages.reports.noteDeletedAuthor")} · {formatDateTime(note.createdAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <ReportNoteForm propertyId={property.id} action={addListingReportNote} />
                  </section>

                  {!active && decision && (
                    <p className="text-xs text-ink-muted">
                      {decision.resolution ? t(`labels.reportResolution.${decision.resolution as ReportResolution}`) : tabLabel(group.status)}
                      {decision.by ? ` · ${decision.by}` : ""}
                      {` · ${formatDateTime(decision.at)}`}
                      {decision.note ? ` · ${decision.note}` : ""}
                    </p>
                  )}

                  {active && (
                    <div className="flex flex-wrap items-center gap-1 border-t border-line pt-3">
                      <ReasonAction
                        action={requestListingInfo}
                        id={property.id}
                        label={t("pages.reports.requestInfo")}
                        title={t("pages.reports.requestInfoTitle")}
                        description={t("pages.reports.requestInfoDescription", { title: property.title })}
                        confirmLabel={t("pages.reports.requestInfo")}
                        presets={[
                          t("pages.reports.infoPresets.documents"),
                          t("pages.reports.infoPresets.photos"),
                          t("pages.reports.infoPresets.price"),
                          t("pages.reports.infoPresets.availability"),
                        ]}
                        className="inline-flex min-h-11 w-auto items-center gap-1.5 px-3 text-sm"
                      >
                        <MessageCircleQuestion className="size-4" aria-hidden="true" />
                        {t("pages.reports.requestInfo")}
                      </ReasonAction>
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
                        label={closeLabel}
                        title={closeLabel}
                        description={t("pages.reports.markClosedDescription", { title: property.title })}
                        confirmLabel={t("pages.reports.confirm")}
                        tone="neutral"
                        className="inline-flex min-h-11 w-auto items-center gap-1.5 px-3 text-sm"
                      >
                        <Tag className="size-4" aria-hidden="true" />
                        {closeLabel}
                      </ConfirmAction>
                      <ConfirmAction
                        action={resolveListingReports}
                        id={property.id}
                        label={t("pages.reports.resolve")}
                        title={t("pages.reports.resolve")}
                        description={t("pages.reports.resolveDescription")}
                        confirmLabel={t("pages.reports.confirm")}
                        tone="neutral"
                        className="inline-flex min-h-11 w-auto items-center gap-1.5 px-3 text-sm"
                      >
                        <CheckCheck className="size-4" aria-hidden="true" />
                        {t("pages.reports.resolve")}
                      </ConfirmAction>
                      <ConfirmAction
                        action={dismissListingReports}
                        id={property.id}
                        label={t("pages.reports.dismiss")}
                        title={t("pages.reports.dismiss")}
                        description={t("pages.reports.dismissDescription")}
                        confirmLabel={t("pages.reports.dismiss")}
                        className="inline-flex min-h-11 w-auto items-center gap-1.5 px-3 text-sm"
                      >
                        <ShieldOff className="size-4" aria-hidden="true" />
                        {t("pages.reports.dismiss")}
                      </ConfirmAction>
                      <ConfirmAction
                        action={closeListingReports}
                        id={property.id}
                        label={t("pages.reports.closeReports")}
                        title={t("pages.reports.closeReports")}
                        description={t("pages.reports.closeReportsDescription")}
                        confirmLabel={t("pages.reports.closeReports")}
                        tone="neutral"
                        className="inline-flex min-h-11 w-auto items-center gap-1.5 px-3 text-sm"
                      >
                        <XCircle className="size-4" aria-hidden="true" />
                        {t("pages.reports.closeReports")}
                      </ConfirmAction>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </AdminCard>
      )}
    </>
  );
}
