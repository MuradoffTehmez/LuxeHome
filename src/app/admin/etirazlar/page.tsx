import type { Metadata } from "next";
import Link from "next/link";
import { Check, Scale, X } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ReasonAction } from "@/components/admin/reason-action";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminI18n } from "@/lib/admin-i18n";
import { appealRestoreStatus, getAppealQueue } from "@/lib/listing-appeals";
import { APPEAL_STATUSES, PERMISSIONS, PROPERTY_STATUS_LABELS, type AppealStatus, type PropertyStatus } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { acceptListingAppeal, rejectListingAppeal } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminI18n();
  return { title: t("pages.appeals.title") };
}
export const dynamic = "force-dynamic";

const TABS: AppealStatus[] = [APPEAL_STATUSES.OPEN, APPEAL_STATUSES.ACCEPTED, APPEAL_STATUSES.REJECTED, APPEAL_STATUSES.CLOSED];

/**
 * Etirazlar (#206, PRD 20.4). Hər etirazda qərarı verən moderator göstərilir; o, öz qərarına
 * baxa bilməz — düymələr ona görünmür, server də rədd edir (müstəqil baxış).
 */
export default async function AdminAppealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const { t } = await getAdminI18n();
  const params = await searchParams;
  const tab = TABS.includes(params.status as AppealStatus) ? (params.status as AppealStatus) : APPEAL_STATUSES.OPEN;
  const [appeals, counts] = await Promise.all([
    getAppealQueue(tab),
    prisma.listingAppeal.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countOf = (value: AppealStatus) => counts.find((row) => row.status === value)?._count._all ?? 0;
  const statusLabel = (value: string | null) =>
    value && Object.hasOwn(PROPERTY_STATUS_LABELS, value) ? t(`labels.propertyStatus.${value as PropertyStatus}`) : (value ?? "—");

  return (
    <>
      <AdminPageHeader
        title={t("pages.appeals.title")}
        description={t("pages.appeals.description")}
        breadcrumbs={[{ label: t("pages.moderation.idarePaneli"), href: "/admin" }, { label: t("pages.appeals.title") }]}
      />

      <nav aria-label={t("pages.appeals.tabsLabel")} className="mb-5 flex flex-wrap gap-2">
        {TABS.map((value) => (
          <Link
            key={value}
            href={value === APPEAL_STATUSES.OPEN ? "/admin/etirazlar" : `/admin/etirazlar?status=${value}`}
            aria-current={tab === value ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
              tab === value ? "border-gold bg-gold/10 font-medium text-ink" : "border-line bg-paper text-ink-soft hover:border-gold",
            )}
          >
            {t(`labels.appealStatus.${value}`)}
            <span className="tabular text-xs text-ink-muted">{countOf(value)}</span>
          </Link>
        ))}
      </nav>

      {appeals.length === 0 ? (
        <AdminCard>
          <EmptyState title={t("pages.appeals.empty")} description={t("pages.appeals.emptyDescription")} />
        </AdminCard>
      ) : (
        <AdminCard bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {appeals.map((appeal) => {
              const ownDecision = appeal.decidedById === user.id;
              return (
                <li key={appeal.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/emlaklar/${appeal.propertyId}`} className="font-medium text-ink hover:text-gold-deep [overflow-wrap:anywhere]">
                          {appeal.property.title}
                        </Link>
                        <Badge tone="danger">{statusLabel(appeal.appealedStatus)}</Badge>
                        {appeal.property.status !== appeal.appealedStatus && (
                          <Badge tone="neutral">{t("pages.appeals.nowStatus", { status: statusLabel(appeal.property.status) })}</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">
                        {appeal.author ? `${appeal.author.name} · ${appeal.author.email}` : t("pages.appeals.deletedAuthor")}
                        {" · "}
                        {formatDateTime(appeal.createdAt)}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {t("pages.appeals.decidedBy", { name: appeal.decidedBy ?? t("pages.appeals.unknown") })}
                        {" · "}
                        {t("pages.appeals.restoreTo", { status: statusLabel(appealRestoreStatus(appeal.previousStatus)) })}
                      </p>
                    </div>
                    {tab === APPEAL_STATUSES.OPEN && (
                      ownDecision ? (
                        <p className="max-w-xs text-xs text-warning">{t("pages.appeals.ownDecision")}</p>
                      ) : (
                        <div className="flex shrink-0 flex-wrap items-center gap-1">
                          <ReasonAction
                            action={acceptListingAppeal}
                            id={appeal.id}
                            required={false}
                            label={t("pages.appeals.accept")}
                            title={t("pages.appeals.acceptTitle")}
                            description={t("pages.appeals.acceptDescription", { title: appeal.property.title })}
                            confirmLabel={t("pages.appeals.accept")}
                            className="inline-flex min-h-11 w-auto items-center gap-1.5 px-3 text-sm hover:bg-success-bg hover:text-success"
                          >
                            <Check className="size-4" aria-hidden="true" />
                            {t("pages.appeals.accept")}
                          </ReasonAction>
                          <ReasonAction
                            action={rejectListingAppeal}
                            id={appeal.id}
                            label={t("pages.appeals.reject")}
                            title={t("pages.appeals.rejectTitle")}
                            description={t("pages.appeals.rejectDescription", { title: appeal.property.title })}
                            confirmLabel={t("pages.appeals.reject")}
                            className="inline-flex min-h-11 w-auto items-center gap-1.5 px-3 text-sm"
                          >
                            <X className="size-4" aria-hidden="true" />
                            {t("pages.appeals.reject")}
                          </ReasonAction>
                        </div>
                      )
                    )}
                  </div>

                  {appeal.property.moderationNote && (
                    <p className="text-sm text-ink-soft [overflow-wrap:anywhere]">
                      <span className="font-medium text-ink">{t("pages.appeals.moderationReason")}</span> {appeal.property.moderationNote}
                    </p>
                  )}
                  <blockquote className="flex items-start gap-2 rounded-sm border border-line bg-ivory px-3 py-2 text-sm text-ink whitespace-pre-line [overflow-wrap:anywhere]">
                    <Scale className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" />
                    <span>{appeal.message}</span>
                  </blockquote>
                  {tab !== APPEAL_STATUSES.OPEN && (
                    <p className="text-xs text-ink-muted">
                      {appeal.reviewer?.name ?? t("pages.appeals.unknown")}
                      {appeal.decidedAt ? ` · ${formatDateTime(appeal.decidedAt)}` : ""}
                      {appeal.decisionNote ? ` · ${appeal.decisionNote}` : ""}
                    </p>
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
