import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Link } from "@/i18n/navigation";
import { formatLocalizedDate } from "@/i18n/date";
import { requireAccount } from "@/lib/auth/guard";
import { buildManagedMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { listingAgencyFor } from "@/lib/accounts/agency-ownership";
import { getAgencyTransfers } from "@/lib/listing-transfers";
import {
  ACCOUNT_TYPES,
  AGENCY_EMPLOYEE_STATUSES,
  OPEN_TRANSFER_STATUSES,
  TRANSFER_STATUSES,
  type Locale,
  type TransferStatus,
} from "@/lib/constants";
import { CancelTransferButton, IncomingTransferActions, TransferRequestForm } from "./transfer-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.transfers" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/kocurmeler", noIndex: true, locale: locale as Locale });
}

const STATUS_TONE: Record<TransferStatus, "info" | "warning" | "success" | "neutral" | "danger"> = {
  PENDING_SOURCE: "warning",
  PENDING_ADMIN: "info",
  COMPLETED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

const isTransferStatus = (value: string): value is TransferStatus =>
  (Object.values(TRANSFER_STATUSES) as string[]).includes(value);

/**
 * Agentliklər arası köçürmələr (#212, PRD 6.4). Agentlik sahibi gələn sorğuları təsdiqləyir və
 * sorğu yaradır; təsdiqlənmiş agent yalnız özünə sorğu yaradır və öz sorğularını görür.
 */
export default async function TransfersPage() {
  const locale = (await getLocale()) as Locale;
  const user = await requireAccount(locale);
  if (user.accountType !== ACCOUNT_TYPES.AGENCY && user.accountType !== ACCOUNT_TYPES.AGENT) forbidden();
  const t = await getTranslations("account.transfers");
  const own = await listingAgencyFor(user);

  if (!own) {
    return (
      <div className="min-w-0">
        <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <div className="mt-8">
          <EmptyState title={t("noAgencyTitle")} description={t("noAgencyDescription")} />
        </div>
      </div>
    );
  }

  const [transfers, members] = await Promise.all([
    getAgencyTransfers(own.agencyId),
    own.isOwner
      ? prisma.agencyEmployee.findMany({
          where: { agencyId: own.agencyId, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
          select: { userId: true, user: { select: { name: true } } },
          orderBy: { approvedAt: "asc" },
        })
      : [],
  ]);
  const targets = own.isOwner
    ? [{ value: user.id, label: t("form.targetAgency", { name: own.agencyName }) }, ...members.map((member) => ({ value: member.userId, label: member.user.name }))]
    : null;
  // Agent agentliyin bütün sorğularını deyil, yalnız özününkünü görür.
  const outgoing = own.isOwner ? transfers.outgoing : transfers.outgoing.filter((item) => item.requestedById === user.id);
  const incoming = own.isOwner ? transfers.incoming : [];

  const meta = (item: (typeof outgoing)[number]) => (
    <p className="mt-1 text-xs text-ink-muted">
      {t("sentAt", { date: formatLocalizedDate(item.createdAt, locale) ?? "" })}
      {item.requestedBy ? ` · ${item.requestedBy.name}` : ""}
    </p>
  );
  const statusBadge = (status: string) =>
    isTransferStatus(status) ? <Badge tone={STATUS_TONE[status]} className="self-start">{t(`status.${status}`)}</Badge> : null;
  const notes = (item: (typeof outgoing)[number]) => (
    <>
      <p className="mt-3 text-sm text-ink-soft [overflow-wrap:anywhere]">{item.reason}</p>
      {item.sourceNote && <p className="mt-2 text-xs text-ink-muted [overflow-wrap:anywhere]">{t("sourceNote", { note: item.sourceNote })}</p>}
      {item.adminNote && <p className="mt-1 text-xs text-ink-muted [overflow-wrap:anywhere]">{t("adminNote", { note: item.adminNote })}</p>}
    </>
  );

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
        <h2 className="font-sans text-lg font-semibold text-ink">{t("form.title")}</h2>
        <p className="mt-1 mb-5 max-w-2xl text-sm leading-6 text-ink-soft">{t("form.description", { name: own.agencyName })}</p>
        <TransferRequestForm targets={targets} />
      </section>

      {own.isOwner && (
        <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
          <h2 className="font-sans text-lg font-semibold text-ink">{t("incomingTitle")}</h2>
          <p className="mt-1 mb-4 max-w-2xl text-sm leading-6 text-ink-soft">{t("incomingDescription")}</p>
          {incoming.length === 0 ? (
            <p className="text-sm text-ink-muted">{t("incomingEmpty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {incoming.map((item) => (
                <li key={item.id} className="rounded-lg border border-line p-4">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-ink [overflow-wrap:anywhere]">
                        <Link href={`/emlaklar/${item.property.slug}`} className="hover:text-gold-deep">{item.property.title}</Link>
                      </h3>
                      <p className="mt-0.5 text-xs text-ink-muted">{t("fromAgency", { name: item.toAgency.name })}</p>
                      {meta(item)}
                    </div>
                    {statusBadge(item.status)}
                  </div>
                  {notes(item)}
                  {item.ownerConsentNote && <p className="mt-1 text-xs text-ink-muted [overflow-wrap:anywhere]">{t("consentNote", { note: item.ownerConsentNote })}</p>}
                  {item.status === TRANSFER_STATUSES.PENDING_SOURCE && (
                    <div className="mt-3 border-t border-line pt-3">
                      <IncomingTransferActions id={item.id} title={item.property.title} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
        <h2 className="font-sans text-lg font-semibold text-ink">{t("outgoingTitle")}</h2>
        <p className="mt-1 mb-4 max-w-2xl text-sm leading-6 text-ink-soft">{t("outgoingDescription")}</p>
        {outgoing.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <ArrowLeftRight className="size-4" aria-hidden="true" />
            {t("outgoingEmpty")}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {outgoing.map((item) => (
              <li key={item.id} className="rounded-lg border border-line p-4">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-ink [overflow-wrap:anywhere]">
                      <Link href={`/emlaklar/${item.property.slug}`} className="hover:text-gold-deep">{item.property.title}</Link>
                    </h3>
                    <p className="mt-0.5 text-xs text-ink-muted">{t("toAgency", { name: item.fromAgency.name })}</p>
                    {meta(item)}
                  </div>
                  {statusBadge(item.status)}
                </div>
                {notes(item)}
                {(OPEN_TRANSFER_STATUSES as string[]).includes(item.status) && (
                  <div className="mt-3 border-t border-line pt-3">
                    <CancelTransferButton id={item.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
