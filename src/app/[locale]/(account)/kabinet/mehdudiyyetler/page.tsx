import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAccount } from "@/lib/auth/guard";
import type { Locale } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildManagedMetadata } from "@/lib/seo";
import { formatLocalizedDate } from "@/i18n/date";
import { AppealForm } from "./appeal-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "account.restrictions" });
  return buildManagedMetadata({ title: t("title"), description: t("description"), path: "/kabinet/mehdudiyyetler", noIndex: true, locale });
}

/** Hesab tədbirləri və etiraz (#258, PRD 20.3/20.4). Etiraz başqa səlahiyyətli əməkdaşa gedir. */
export default async function RestrictionsPage() {
  const locale = (await getLocale()) as Locale;
  const user = await requireAccount(locale);
  const t = await getTranslations("account.restrictions");
  const now = new Date();
  const [rows, appeals] = await Promise.all([
    prisma.accountRestriction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.accountRestrictionAppeal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { restrictionId: true, status: true, decisionNote: true } }),
  ]);
  const appealOf = new Map<string, (typeof appeals)[number]>();
  for (const appeal of appeals) if (!appealOf.has(appeal.restrictionId)) appealOf.set(appeal.restrictionId, appeal);

  return (
    <div className="min-w-0">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      {rows.length === 0 ? (
        <div className="mt-8"><EmptyState title={t("emptyTitle")} description={t("emptyDescription")} /></div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {rows.map((row) => {
            const active = !row.liftedAt && (!row.endsAt || row.endsAt > now);
            const appeal = appealOf.get(row.id);
            return (
              <li key={row.id} className="rounded-xl border border-line bg-paper p-5 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{t(`kinds.${row.kind as "WARNING"}.label`)}</p>
                    <p className="text-sm text-ink-soft">{t(`kinds.${row.kind as "WARNING"}.hint`)}</p>
                  </div>
                  <Badge tone={active ? "danger" : "neutral"}>{active ? t("active") : t("inactive")}</Badge>
                </div>
                <p className="mt-3 text-sm text-ink [overflow-wrap:anywhere]">{t("reason", { reason: row.reason })}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {formatLocalizedDate(row.createdAt, locale, "long")}
                  {row.endsAt ? ` — ${formatLocalizedDate(row.endsAt, locale, "long")}` : ""}
                  {row.liftedAt && row.liftReason ? ` · ${t("lifted", { reason: row.liftReason })}` : ""}
                </p>
                {appeal && <p className="mt-2 text-sm text-ink-soft">{t(`appeal.${appeal.status as "OPEN"}`)}{appeal.decisionNote ? `: ${appeal.decisionNote}` : ""}</p>}
                {active && (!appeal || appeal.status !== "OPEN") && <div className="mt-4"><AppealForm restrictionId={row.id} /></div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
