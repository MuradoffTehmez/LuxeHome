import type { Metadata } from "next";
import { Power } from "lucide-react";
import { getAdminI18n, getAdminT } from "@/lib/admin-i18n";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { prisma } from "@/lib/prisma";
import { formatLocalizedDate } from "@/i18n/date";
import { parsePlanCodeList } from "@/lib/subscriptions/subscription-policy";
import { toggleDiscountCode } from "../billing-actions";
import { DiscountCodeForm } from "../billing-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.finance.discounts.title"), robots: { index: false, follow: false } };
}

const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** Endirim kodları (#246, PRD 16.5). Tanıtım mərhələsində ödəniş olmadığı üçün kod yalnız gələcək checkout-da işləyir. */
export default async function DiscountCodesPage() {
  const [t, { locale }] = await Promise.all([getAdminT(), getAdminI18n()]);
  await requireAdminRead(PERMISSIONS.BILLING_MANAGE);
  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <>
      <AdminPageHeader title={t("pages.finance.discounts.title")} description={t("pages.finance.discounts.description")} />
      <AdminCard title={t("pages.finance.discounts.formTitle")}>
        <DiscountCodeForm />
      </AdminCard>
      <AdminCard title={t("pages.finance.discounts.listTitle")} className="mt-6">
        {codes.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("pages.finance.discounts.empty")}</p>
        ) : (
          <AdminTable
            caption={t("pages.finance.discounts.listTitle")}
            headers={[
              { label: t("pages.finance.discounts.code") },
              { label: t("pages.finance.discounts.value") },
              { label: t("pages.finance.discounts.validity") },
              { label: t("pages.finance.discounts.usage") },
              { label: t("pages.finance.discounts.plans") },
              { label: t("pages.finance.subscriptions.actions"), srOnly: true },
            ]}
          >
            {codes.map((code) => {
              const plans = parsePlanCodeList(code.planCodes);
              return (
                <AdminTableRow key={code.id}>
                  <AdminTableCell>
                    <span className="font-mono font-semibold text-ink">{code.code}</span>{" "}
                    <Badge tone={code.isActive ? "success" : "neutral"}>{code.isActive ? t("pages.finance.active") : t("pages.finance.inactive")}</Badge>
                  </AdminTableCell>
                  <AdminTableCell>{code.percentOff != null ? `${code.percentOff}%` : `${money.format((code.amountOffMinor ?? 0) / 100)} ₼`}</AdminTableCell>
                  <AdminTableCell className="whitespace-nowrap text-xs">
                    {code.validFrom ? formatLocalizedDate(code.validFrom, locale, "short") : "…"} — {code.validUntil ? formatLocalizedDate(code.validUntil, locale, "short") : "…"}
                  </AdminTableCell>
                  <AdminTableCell className="tabular-nums">{code.redemptions}{code.maxRedemptions != null ? ` / ${code.maxRedemptions}` : ""}</AdminTableCell>
                  <AdminTableCell>{plans ? plans.map((plan) => t(`pages.finance.planNames.${plan}`)).join(", ") : t("pages.finance.discounts.allPlans")}</AdminTableCell>
                  <AdminTableCell align="right">
                    <ConfirmAction
                      action={toggleDiscountCode}
                      id={code.id}
                      tone="neutral"
                      label={t("pages.finance.toggle")}
                      title={code.isActive ? t("pages.finance.deactivateTitle") : t("pages.finance.activateTitle")}
                      description={code.code}
                      confirmLabel={t("pages.finance.toggle")}
                    >
                      <Power className="size-4" />
                    </ConfirmAction>
                  </AdminTableCell>
                </AdminTableRow>
              );
            })}
          </AdminTable>
        )}
      </AdminCard>
    </>
  );
}
