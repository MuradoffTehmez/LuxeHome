import type { Metadata } from "next";
import { Ban, Clock, Crown, History } from "lucide-react";
import { getAdminI18n, getAdminT } from "@/lib/admin-i18n";
import { AdminCard, AdminPageHeader, StatCard } from "@/components/admin/admin-ui";
import { ReasonAction } from "@/components/admin/reason-action";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS, VIP_REQUEST_STATUSES } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { formatLocalizedDate } from "@/i18n/date";
import { localizePath } from "@/i18n/path-locale";
import { getVipDashboard } from "@/lib/vip";
import { rejectVipAction, revokeVipAction } from "./actions";
import { ApproveVipForm, ExtendVipForm, GrantVipForm } from "./vip-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.vip.title"), robots: { index: false, follow: false } };
}

const number = new Intl.NumberFormat("en-US");
const STATUS_TONE = { PENDING: "warning", APPROVED: "success", REJECTED: "danger", CANCELLED: "neutral", REVOKED: "danger", EXPIRED: "neutral" } as const;

/**
 * VIP idarəetmə paneli (#248, PRD 14.4): gözləyən sorğular, aktiv və bitmiş VIP elanlar, performans,
 * VIP verən administrator və təsdiq/rədd səbəbləri.
 */
export default async function VipPage() {
  const [t, { locale }] = await Promise.all([getAdminT(), getAdminI18n()]);
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const dashboard = await getVipDashboard();
  const date = (value: Date | null) => (value ? formatLocalizedDate(value, locale, "short") : "—");
  type Row = Awaited<ReturnType<typeof getVipDashboard>>["pending"][number];

  const listing = (row: Row) => (
    <div className="min-w-0">
      {row.property ? (
        <a href={localizePath(`/emlaklar/${row.property.slug}`, locale)} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-gold-deep [overflow-wrap:anywhere]">
          {row.property.title}
        </a>
      ) : <span className="text-ink-muted">—</span>}
      <p className="mt-0.5 text-xs text-ink-muted">
        {t(`pages.vip.source.${row.source as "OWNER"}`)}
        {row.requester ? ` · ${row.requester.name} (${row.requester.email})` : ""}
      </p>
    </div>
  );
  const performance = (row: Row) => row.performance && (
    <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      {(["views", "uniqueViews", "contactReveals", "leads"] as const).map((key) => (
        <div key={key} className="rounded-sm bg-ivory p-2">
          <dt className="text-ink-muted">{t(`pages.vip.metrics.${key}`)}</dt>
          <dd className="font-semibold tabular-nums text-ink">{number.format(row.performance![key])}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <>
      <AdminPageHeader title={t("pages.vip.title")} description={t("pages.vip.description")} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Clock} tone="warning" label={t("pages.vip.pending")} value={dashboard.pending.length} />
        <StatCard icon={Crown} tone="gold" label={t("pages.vip.active")} value={dashboard.active.length} />
        <StatCard icon={History} label={t("pages.vip.past")} value={dashboard.past.length} />
      </div>

      <AdminCard id="sorgular" title={t("pages.vip.pending")} description={t("pages.vip.pendingDescription")}>
        {dashboard.pending.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.vip.emptyPending")}</p> : (
          <ul className="flex flex-col gap-4">
            {dashboard.pending.map((row) => (
              <li key={row.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {listing(row)}
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <span>{date(row.createdAt)} · {t("pages.vip.days", { count: row.requestedDays })}</span>
                    <ReasonAction
                      action={rejectVipAction}
                      id={row.id}
                      label={t("pages.vip.reject")}
                      title={t("pages.vip.rejectTitle")}
                      description={t("pages.vip.rejectDescription")}
                      confirmLabel={t("pages.vip.reject")}
                      presets={[t("pages.vip.presets.quality"), t("pages.vip.presets.info"), t("pages.vip.presets.rules")]}
                    >
                      <Ban className="size-4" />
                    </ReasonAction>
                  </div>
                </div>
                {row.message && <p className="mt-2 rounded-sm bg-ivory p-2 text-sm text-ink-soft [overflow-wrap:anywhere]">{row.message}</p>}
                <div className="mt-3"><ApproveVipForm requestId={row.id} requestedDays={row.requestedDays} /></div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title={t("pages.vip.grantTitle")} description={t("pages.vip.grantDescription")} className="mt-6">
        <GrantVipForm />
      </AdminCard>

      <AdminCard id="aktiv" title={t("pages.vip.active")} className="mt-6">
        {dashboard.active.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.vip.emptyActive")}</p> : (
          <ul className="flex flex-col gap-4">
            {dashboard.active.map((row) => (
              <li key={row.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {listing(row)}
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <span>{date(row.startsAt)} — {date(row.endsAt)}{row.extendedCount > 0 ? ` · ${t("pages.vip.extendedCount", { count: row.extendedCount })}` : ""}</span>
                    <ReasonAction
                      action={revokeVipAction}
                      id={row.id}
                      label={t("pages.vip.revoke")}
                      title={t("pages.vip.revokeTitle")}
                      description={t("pages.vip.revokeDescription")}
                      confirmLabel={t("pages.vip.revoke")}
                    >
                      <Ban className="size-4" />
                    </ReasonAction>
                  </div>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  {t("pages.vip.decidedBy", { name: row.decidedBy?.name ?? t("pages.vip.system") })}
                  {row.decisionNote ? ` · ${row.decisionNote}` : ""}
                </p>
                {performance(row)}
                <div className="mt-3"><ExtendVipForm requestId={row.id} /></div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard id="tarixce" title={t("pages.vip.past")} description={t("pages.vip.pastDescription")} className="mt-6">
        {dashboard.past.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.vip.emptyPast")}</p> : (
          <ul className="flex flex-col gap-3">
            {dashboard.past.map((row) => {
              const status = row.status === VIP_REQUEST_STATUSES.APPROVED ? VIP_REQUEST_STATUSES.EXPIRED : row.status;
              return (
                <li key={row.id} className="rounded-lg border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {listing(row)}
                    <Badge tone={STATUS_TONE[status as keyof typeof STATUS_TONE] ?? "neutral"}>{t(`pages.vip.status.${status as "EXPIRED"}`)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {row.startsAt ? `${date(row.startsAt)} — ${date(row.endsAt)} · ` : ""}
                    {t("pages.vip.decidedBy", { name: row.decidedBy?.name ?? t("pages.vip.system") })}
                    {row.decisionNote ? ` · ${row.decisionNote}` : ""}
                  </p>
                  {performance(row)}
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
