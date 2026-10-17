import type { Metadata } from "next";
import { Ban, CalendarClock, CircleCheck, Hourglass, Layers } from "lucide-react";
import { getAdminI18n, getAdminT } from "@/lib/admin-i18n";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow, StatCard } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS, SUBSCRIPTION_STATUSES } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { formatLocalizedDate } from "@/i18n/date";
import { getSubscriptionPlans } from "@/lib/subscriptions/plans";
import { getSubscriptionReport } from "@/lib/subscriptions/subscriptions";
import { isActiveSubscriptionStatus } from "@/lib/subscriptions/subscription-policy";
import { cancelSubscriptionAction } from "../billing-actions";
import { GrantSubscriptionForm } from "../billing-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.finance.subscriptions.title"), robots: { index: false, follow: false } };
}

const STATUS_TONE = { TRIALING: "info", ACTIVE: "success", PAST_DUE: "warning", CANCELLED: "neutral", EXPIRED: "neutral" } as const;

/** Abunə hesabatları və panel təyini (#246, PRD 16.5). */
export default async function SubscriptionsPage() {
  const [t, { locale }] = await Promise.all([getAdminT(), getAdminI18n()]);
  await requireAdminRead(PERMISSIONS.BILLING_MANAGE);
  const [report, plans] = await Promise.all([getSubscriptionReport(), getSubscriptionPlans()]);
  const planLabel = (audience: string, code: string) =>
    `${t(`pages.finance.planNames.${code as "BASIC"}`)} · ${t(`pages.finance.audiences.${audience as "AGENCY"}`)}`;

  return (
    <>
      <AdminPageHeader title={t("pages.finance.subscriptions.title")} description={t("pages.finance.subscriptions.description")} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={Layers} label={t("pages.finance.subscriptions.total")} value={report.total} />
        <StatCard icon={CircleCheck} tone="success" label={t("pages.finance.subscriptionStatus.ACTIVE")} value={report.byStatus.ACTIVE} />
        <StatCard icon={Hourglass} tone="gold" label={t("pages.finance.subscriptionStatus.TRIALING")} value={report.byStatus.TRIALING} />
        <StatCard icon={CalendarClock} tone="warning" label={t("pages.finance.subscriptionStatus.PAST_DUE")} value={report.byStatus.PAST_DUE} />
        <StatCard icon={Ban} label={t("pages.finance.subscriptionStatus.EXPIRED")} value={report.byStatus.EXPIRED + report.byStatus.CANCELLED} />
      </div>

      <AdminCard title={t("pages.finance.subscriptions.grantTitle")} description={t("pages.finance.subscriptions.grantDescription")}>
        <GrantSubscriptionForm plans={plans.map((plan) => ({ id: plan.id, label: planLabel(plan.audience, plan.code) }))} />
      </AdminCard>

      {report.byPlan.length > 0 && (
        <AdminCard title={t("pages.finance.subscriptions.byPlan")} className="mt-6">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {report.byPlan.map((row) => {
              const [audience, code] = row.key.split(":");
              return (
                <li key={row.key} className="flex items-center justify-between rounded-sm border border-line p-3 text-sm">
                  <span>{planLabel(audience, code)}</span>
                  <span className="font-semibold tabular-nums">{row.count}</span>
                </li>
              );
            })}
          </ul>
        </AdminCard>
      )}

      <AdminCard title={t("pages.finance.subscriptions.recent")} className="mt-6">
        {report.recent.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("pages.finance.subscriptions.empty")}</p>
        ) : (
          <AdminTable
            caption={t("pages.finance.subscriptions.recent")}
            headers={[
              { label: t("pages.finance.subscriptions.account") },
              { label: t("pages.finance.subscriptions.plan") },
              { label: t("pages.finance.subscriptions.statusLabel") },
              { label: t("pages.finance.subscriptions.period") },
              { label: t("pages.finance.subscriptions.source") },
              { label: t("pages.finance.subscriptions.actions"), srOnly: true },
            ]}
          >
            {report.recent.map((row) => (
              <AdminTableRow key={row.id}>
                <AdminTableCell>
                  <span className="block font-medium text-ink">{row.user?.name ?? "—"}</span>
                  <span className="block text-xs text-ink-muted">{row.user?.email}</span>
                </AdminTableCell>
                <AdminTableCell>{planLabel(row.audience, row.planCode)} · {t("pages.finance.months", { count: row.months })}</AdminTableCell>
                <AdminTableCell><Badge tone={STATUS_TONE[row.effectiveStatus]}>{t(`pages.finance.subscriptionStatus.${row.effectiveStatus}`)}</Badge></AdminTableCell>
                <AdminTableCell className="whitespace-nowrap text-xs">
                  {formatLocalizedDate(row.startsAt, locale, "short")} — {formatLocalizedDate(row.endsAt, locale, "short")}
                </AdminTableCell>
                <AdminTableCell>{t(`pages.finance.subscriptionSource.${row.source as "ADMIN"}`)}</AdminTableCell>
                <AdminTableCell align="right">
                  {isActiveSubscriptionStatus(row.effectiveStatus) && row.effectiveStatus !== SUBSCRIPTION_STATUSES.CANCELLED && (
                    <ConfirmAction
                      action={cancelSubscriptionAction}
                      id={row.id}
                      label={t("pages.finance.subscriptions.cancel")}
                      title={t("pages.finance.subscriptions.cancelTitle")}
                      description={t("pages.finance.subscriptions.cancelDescription")}
                      confirmLabel={t("pages.finance.subscriptions.cancel")}
                    >
                      <Ban className="size-4" />
                    </ConfirmAction>
                  )}
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </AdminCard>
    </>
  );
}
