import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, X } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ReasonAction } from "@/components/admin/reason-action";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminI18n } from "@/lib/admin-i18n";
import { getTransferQueue } from "@/lib/listing-transfers";
import { PERMISSIONS, TRANSFER_STATUSES, type TransferStatus } from "@/lib/constants";
import { findManyInChunks } from "@/lib/d1-chunks";
import { cn, formatDateTime } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { approveListingTransfer, rejectListingTransfer } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminI18n();
  return { title: t("pages.transfers.title") };
}
export const dynamic = "force-dynamic";

const TABS: TransferStatus[] = [
  TRANSFER_STATUSES.PENDING_ADMIN,
  TRANSFER_STATUSES.PENDING_SOURCE,
  TRANSFER_STATUSES.COMPLETED,
  TRANSFER_STATUSES.REJECTED,
  TRANSFER_STATUSES.CANCELLED,
];

/**
 * Agentliklər arası köçürmələr (#212, PRD 6.4). Admin yalnız elanın agentliyinin təsdiqlədiyi
 * sorğuya son qərar verir; `PENDING_SOURCE` sekmesi yalnız baxış üçündür.
 */
export default async function AdminTransfersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const { t } = await getAdminI18n();
  const params = await searchParams;
  const tab = TABS.includes(params.status as TransferStatus) ? (params.status as TransferStatus) : TRANSFER_STATUSES.PENDING_ADMIN;
  const [transfers, counts] = await Promise.all([
    getTransferQueue(tab),
    prisma.listingTransfer.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const targets = await findManyInChunks([...new Set(transfers.map((item) => item.targetUserId))], 0, (ids) =>
    prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
  );
  const targetName = new Map(targets.map((user) => [user.id, user.name]));
  const countOf = (value: TransferStatus) => counts.find((row) => row.status === value)?._count._all ?? 0;

  return (
    <>
      <AdminPageHeader
        title={t("pages.transfers.title")}
        description={t("pages.transfers.description")}
        breadcrumbs={[{ label: t("pages.moderation.idarePaneli"), href: "/admin" }, { label: t("pages.transfers.title") }]}
      />

      <nav aria-label={t("pages.transfers.tabsLabel")} className="mb-5 flex flex-wrap gap-2">
        {TABS.map((value) => (
          <Link
            key={value}
            href={value === TRANSFER_STATUSES.PENDING_ADMIN ? "/admin/kocurmeler" : `/admin/kocurmeler?status=${value}`}
            aria-current={tab === value ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
              tab === value ? "border-gold bg-gold/10 font-medium text-ink" : "border-line bg-paper text-ink-soft hover:border-gold",
            )}
          >
            {t(`pages.transfers.status.${value}`)}
            <span className="tabular text-xs text-ink-muted">{countOf(value)}</span>
          </Link>
        ))}
      </nav>

      {transfers.length === 0 ? (
        <AdminCard>
          <EmptyState title={t("pages.transfers.empty")} description={t("pages.transfers.emptyDescription")} />
        </AdminCard>
      ) : (
        <AdminCard bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {transfers.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <a href={`/az/emlaklar/${item.property.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-ink hover:text-gold-deep [overflow-wrap:anywhere]">
                      {item.property.title}
                    </a>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
                      <span>{item.fromAgency.name}</span>
                      <ArrowRight className="size-3.5 text-ink-muted" aria-hidden="true" />
                      <span className="font-medium text-ink">{item.toAgency.name}</span>
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {t("pages.transfers.requestedBy", { name: item.requestedBy?.name ?? t("pages.transfers.unknown") })}
                      {" · "}
                      {t("pages.transfers.target", { name: targetName.get(item.targetUserId) ?? t("pages.transfers.unknown") })}
                      {" · "}
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  {tab === TRANSFER_STATUSES.PENDING_ADMIN && (
                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                      <ReasonAction
                        action={approveListingTransfer}
                        id={item.id}
                        required={false}
                        label={t("pages.transfers.approve")}
                        title={t("pages.transfers.approveTitle")}
                        description={t("pages.transfers.approveDescription", { title: item.property.title, from: item.fromAgency.name, to: item.toAgency.name })}
                        confirmLabel={t("pages.transfers.approve")}
                        className="inline-flex min-h-11 w-auto items-center gap-1.5 px-3 text-sm hover:bg-success-bg hover:text-success"
                      >
                        <Check className="size-4" aria-hidden="true" />
                        {t("pages.transfers.approve")}
                      </ReasonAction>
                      <ReasonAction
                        action={rejectListingTransfer}
                        id={item.id}
                        label={t("pages.transfers.reject")}
                        title={t("pages.transfers.rejectTitle")}
                        description={t("pages.transfers.rejectDescription", { title: item.property.title })}
                        confirmLabel={t("pages.transfers.reject")}
                        className="inline-flex min-h-11 w-auto items-center gap-1.5 px-3 text-sm"
                      >
                        <X className="size-4" aria-hidden="true" />
                        {t("pages.transfers.reject")}
                      </ReasonAction>
                    </div>
                  )}
                </div>
                <p className="text-sm text-ink [overflow-wrap:anywhere]">{item.reason}</p>
                <p className="flex items-start gap-2 text-xs text-ink-muted [overflow-wrap:anywhere]">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
                  <span>
                    {item.ownerConsent ? t("pages.transfers.consentConfirmed") : t("pages.transfers.consentMissing")}
                    {item.ownerConsentNote ? ` · ${item.ownerConsentNote}` : ""}
                  </span>
                </p>
                {(item.sourceNote || item.sourceDecidedAt) && (
                  <p className="text-xs text-ink-muted [overflow-wrap:anywhere]">
                    {t("pages.transfers.sourceDecision", { date: item.sourceDecidedAt ? formatDateTime(item.sourceDecidedAt) : "—" })}
                    {item.sourceNote ? ` · ${item.sourceNote}` : ""}
                  </p>
                )}
                {item.adminDecidedAt && (
                  <p className="text-xs text-ink-muted [overflow-wrap:anywhere]">
                    {t("pages.transfers.adminDecision", { date: formatDateTime(item.adminDecidedAt) })}
                    {item.adminNote ? ` · ${item.adminNote}` : ""}
                  </p>
                )}
                {tab !== TRANSFER_STATUSES.PENDING_ADMIN && <Badge tone="neutral" className="self-start">{t(`pages.transfers.status.${item.status as TransferStatus}`)}</Badge>}
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
    </>
  );
}
