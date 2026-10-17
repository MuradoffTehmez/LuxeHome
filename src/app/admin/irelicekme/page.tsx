import type { Metadata } from "next";
import { Ban, Clock, History, TrendingUp } from "lucide-react";
import { getAdminI18n, getAdminT } from "@/lib/admin-i18n";
import { AdminCard, AdminPageHeader, StatCard } from "@/components/admin/admin-ui";
import { ReasonAction } from "@/components/admin/reason-action";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS, PROMOTION_COOLDOWN_DAYS, PROMOTION_STATUSES } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { formatLocalizedDateTime } from "@/i18n/date";
import { localizePath } from "@/i18n/path-locale";
import { getPromotionDashboard } from "@/lib/promotion";
import { rejectPromotionAction, revokePromotionAction } from "./actions";
import { ApprovePromotionForm, GrantPromotionForm } from "./promotion-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.promotion.title"), robots: { index: false, follow: false } };
}

const number = new Intl.NumberFormat("en-US");
const STATUS_TONE = { PENDING: "warning", ACTIVE: "success", REJECTED: "danger", CANCELLED: "neutral", REVOKED: "danger", EXPIRED: "neutral" } as const;

/**
 * İrəli çəkmə kampaniyaları (#250, PRD Modul 13): gözləyən sorğular, aktiv kampaniyalar, tarixçə və kampaniya
 * statistikası. Tanıtım mərhələsində ödənişsizdir və administrator idarə edir.
 */
export default async function PromotionPage() {
  const [t, { locale }] = await Promise.all([getAdminT(), getAdminI18n()]);
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const dashboard = await getPromotionDashboard();
  const date = (value: Date | null) => (value ? formatLocalizedDateTime(value, locale) : "—");
  type Row = Awaited<ReturnType<typeof getPromotionDashboard>>["pending"][number];

  const listing = (row: Row) => (
    <div className="min-w-0">
      {row.property ? (
        <a href={localizePath(`/emlaklar/${row.property.slug}`, locale)} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-gold-deep [overflow-wrap:anywhere]">
          {row.property.title}
        </a>
      ) : <span className="text-ink-muted">—</span>}
      <p className="mt-0.5 text-xs text-ink-muted">
        {t(`pages.promotion.source.${row.source as "OWNER"}`)}
        {row.requester ? ` · ${row.requester.name} (${row.requester.email})` : ""}
      </p>
    </div>
  );
  const stats = (row: Row) => row.stats && (
    <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      {(["views", "uniqueViews", "contactReveals", "leads"] as const).map((key) => (
        <div key={key} className="rounded-sm bg-ivory p-2">
          <dt className="text-ink-muted">{t(`pages.promotion.metrics.${key}`)}</dt>
          <dd className="font-semibold tabular-nums text-ink">{number.format(row.stats![key])}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <>
      <AdminPageHeader title={t("pages.promotion.title")} description={t("pages.promotion.description", { days: PROMOTION_COOLDOWN_DAYS })} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Clock} tone="warning" label={t("pages.promotion.pending")} value={dashboard.pending.length} />
        <StatCard icon={TrendingUp} tone="gold" label={t("pages.promotion.active")} value={dashboard.active.length} />
        <StatCard icon={History} label={t("pages.promotion.past")} value={dashboard.past.length} />
      </div>

      <AdminCard title={t("pages.promotion.pending")}>
        {dashboard.pending.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.promotion.emptyPending")}</p> : (
          <ul className="flex flex-col gap-4">
            {dashboard.pending.map((row) => (
              <li key={row.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {listing(row)}
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <span>{date(row.createdAt)} · {t("pages.promotion.days", { count: row.days })}</span>
                    <ReasonAction
                      action={rejectPromotionAction}
                      id={row.id}
                      label={t("pages.promotion.reject")}
                      title={t("pages.promotion.rejectTitle")}
                      description={t("pages.promotion.rejectDescription")}
                      confirmLabel={t("pages.promotion.reject")}
                    >
                      <Ban className="size-4" />
                    </ReasonAction>
                  </div>
                </div>
                {row.message && <p className="mt-2 rounded-sm bg-ivory p-2 text-sm text-ink-soft [overflow-wrap:anywhere]">{row.message}</p>}
                <div className="mt-3"><ApprovePromotionForm campaignId={row.id} days={row.days} /></div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title={t("pages.promotion.grantTitle")} description={t("pages.promotion.grantDescription")} className="mt-6">
        <GrantPromotionForm />
      </AdminCard>

      <AdminCard title={t("pages.promotion.active")} className="mt-6">
        {dashboard.active.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.promotion.emptyActive")}</p> : (
          <ul className="flex flex-col gap-4">
            {dashboard.active.map((row) => (
              <li key={row.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {listing(row)}
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <span>{date(row.startsAt)} — {date(row.endsAt)}</span>
                    <ReasonAction
                      action={revokePromotionAction}
                      id={row.id}
                      label={t("pages.promotion.revoke")}
                      title={t("pages.promotion.revokeTitle")}
                      description={t("pages.promotion.revokeDescription")}
                      confirmLabel={t("pages.promotion.revoke")}
                    >
                      <Ban className="size-4" />
                    </ReasonAction>
                  </div>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{t("pages.promotion.decidedBy", { name: row.decidedBy?.name ?? t("pages.promotion.system") })}</p>
                {stats(row)}
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title={t("pages.promotion.past")} className="mt-6">
        {dashboard.past.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.promotion.emptyPast")}</p> : (
          <ul className="flex flex-col gap-3">
            {dashboard.past.map((row) => {
              const status = row.status === PROMOTION_STATUSES.ACTIVE ? PROMOTION_STATUSES.EXPIRED : row.status;
              return (
                <li key={row.id} className="rounded-lg border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {listing(row)}
                    <Badge tone={STATUS_TONE[status as keyof typeof STATUS_TONE] ?? "neutral"}>{t(`pages.promotion.status.${status as "EXPIRED"}`)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {row.startsAt ? `${date(row.startsAt)} — ${date(row.endsAt)} · ` : ""}
                    {t("pages.promotion.decidedBy", { name: row.decidedBy?.name ?? t("pages.promotion.system") })}
                    {row.decisionNote ? ` · ${row.decisionNote}` : ""}
                  </p>
                  {stats(row)}
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
