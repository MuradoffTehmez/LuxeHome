import type { Metadata } from "next";
import { Ban, Check, RefreshCw, Undo2 } from "lucide-react";
import { getAdminI18n, getAdminT } from "@/lib/admin-i18n";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { ReasonAction } from "@/components/admin/reason-action";
import { Badge } from "@/components/ui/badge";
import { ACCOUNT_TYPES, PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { formatLocalizedDateTime } from "@/i18n/date";
import { parseTrustFlags, suggestedRestriction, trustLevel } from "@/lib/moderation/trust-signals";
import { acceptAppealAction, liftRestrictionAction, recalculateTrustAction, rejectAppealAction } from "./actions";
import { RestrictionForm } from "./restriction-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.trust.title"), robots: { index: false, follow: false } };
}

/**
 * Hesab etibarlılığı (#258, PRD Modul 18): riskli hesablar (davranış siqnalları), tətbiq olunan tədbirlər,
 * etirazlar və qərar tarixçəsi. Tədbir həmişə əsaslandırılır; etirazı tədbiri verəndən başqa əməkdaş həll edir.
 */
export default async function TrustPage() {
  const [t, { locale }] = await Promise.all([getAdminT(), getAdminI18n()]);
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const [risky, restrictions, appeals] = await Promise.all([
    prisma.user.findMany({
      where: { accountType: { not: ACCOUNT_TYPES.STAFF }, trustScore: { gte: 30 } },
      orderBy: { trustScore: "desc" },
      take: 50,
      select: { id: true, name: true, email: true, trustScore: true, trustFlags: true, trustCheckedAt: true },
    }),
    prisma.accountRestriction.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.accountRestrictionAppeal.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "asc" }, take: 50 }),
  ]);
  const userIds = [...new Set([...restrictions.flatMap((row) => [row.userId, row.createdById, row.liftedById]), ...appeals.map((row) => row.userId)].filter((id): id is string => Boolean(id)))];
  const users = await findManyInChunks(userIds, 0, (chunk) => prisma.user.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true, email: true } }));
  const userOf = new Map(users.map((row) => [row.id, row]));
  const restrictionOf = new Map(restrictions.map((row) => [row.id, row]));
  const now = new Date();
  const name = (id: string | null) => (id ? userOf.get(id)?.name ?? "—" : "—");

  return (
    <>
      <AdminPageHeader title={t("pages.trust.title")} description={t("pages.trust.description")} />

      <AdminCard title={t("pages.trust.appeals")} description={t("pages.trust.appealsDescription")}>
        {appeals.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.trust.emptyAppeals")}</p> : (
          <ul className="flex flex-col gap-3">
            {appeals.map((appeal) => {
              const restriction = restrictionOf.get(appeal.restrictionId);
              return (
                <li key={appeal.id} className="rounded-lg border border-line p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{name(appeal.userId)} · {restriction ? t(`pages.trust.kinds.${restriction.kind as "WARNING"}`) : "—"}</p>
                      <p className="mt-1 text-ink-soft [overflow-wrap:anywhere]">{appeal.message}</p>
                      <p className="mt-1 text-xs text-ink-muted">{t("pages.trust.appliedBy", { name: name(restriction?.createdById ?? null) })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ReasonAction action={acceptAppealAction} id={appeal.id} label={t("pages.trust.accept")} title={t("pages.trust.acceptTitle")} description={t("pages.trust.acceptDescription")} confirmLabel={t("pages.trust.accept")}>
                        <Check className="size-4" />
                      </ReasonAction>
                      <ReasonAction action={rejectAppealAction} id={appeal.id} label={t("pages.trust.reject")} title={t("pages.trust.rejectTitle")} description={t("pages.trust.rejectDescription")} confirmLabel={t("pages.trust.reject")}>
                        <Ban className="size-4" />
                      </ReasonAction>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

      <AdminCard title={t("pages.trust.risky")} description={t("pages.trust.riskyDescription")} className="mt-6">
        {risky.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.trust.emptyRisky")}</p> : (
          <ul className="flex flex-col gap-4">
            {risky.map((account) => {
              const flags = parseTrustFlags(account.trustFlags);
              const level = trustLevel(account.trustScore ?? 0);
              return (
                <li key={account.id} className="rounded-lg border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{account.name} <span className="text-xs text-ink-muted">({account.email})</span></p>
                      <p className="mt-1 flex flex-wrap gap-1.5">
                        <Badge tone={level === "high" ? "danger" : "warning"}>{t("pages.trust.score", { score: account.trustScore ?? 0 })}</Badge>
                        {flags.map((flag) => <Badge key={flag.code} tone="neutral">{t(`pages.trust.signals.${flag.code}`, { value: flag.value })}</Badge>)}
                      </p>
                    </div>
                    <ConfirmAction action={recalculateTrustAction} id={account.id} tone="neutral" label={t("pages.trust.recalculate")} title={t("pages.trust.recalculate")} description={account.email} confirmLabel={t("pages.trust.recalculate")}>
                      <RefreshCw className="size-4" />
                    </ConfirmAction>
                  </div>
                  <div className="mt-3"><RestrictionForm userId={account.id} suggested={suggestedRestriction(flags)} /></div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

      <AdminCard title={t("pages.trust.history")} description={t("pages.trust.historyDescription")} className="mt-6">
        {restrictions.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.trust.emptyHistory")}</p> : (
          <ul className="divide-y divide-line text-sm">
            {restrictions.map((row) => {
              const active = !row.liftedAt && (!row.endsAt || row.endsAt > now);
              return (
                <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{name(row.userId)} · {t(`pages.trust.kinds.${row.kind as "WARNING"}`)}</p>
                    <p className="text-xs text-ink-soft [overflow-wrap:anywhere]">{row.reason}</p>
                    <p className="text-xs text-ink-muted">
                      {formatLocalizedDateTime(row.createdAt, locale)} · {t("pages.trust.appliedBy", { name: name(row.createdById) })}
                      {row.liftedAt ? ` · ${t("pages.trust.liftedBy", { name: name(row.liftedById) })}: ${row.liftReason ?? ""}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={active ? "danger" : "neutral"}>{active ? t("pages.trust.active") : t("pages.trust.inactive")}</Badge>
                    {active && (
                      <ReasonAction action={liftRestrictionAction} id={row.id} label={t("pages.trust.lift")} title={t("pages.trust.liftTitle")} description={t("pages.trust.liftDescription")} confirmLabel={t("pages.trust.lift")}>
                        <Undo2 className="size-4" />
                      </ReasonAction>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
