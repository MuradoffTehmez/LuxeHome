import type { Metadata } from "next";
import Link from "next/link";
import { getAdminI18n, getAdminT } from "@/lib/admin-i18n";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getSubscriptionPlans } from "@/lib/subscriptions/plans";
import { PLAN_AUDIENCES, pricingMode } from "@/lib/subscriptions/plan-policy";
import { localizePath } from "@/i18n/path-locale";
import { PlanForm } from "./plan-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.finance.title"), robots: { index: false, follow: false } };
}

/**
 * «Maliyyə və Monetizasiya» (#244, PRD 16.5) — abunə planları, tariflər, plan imkanları və xidmət
 * limitləri. Tanıtım mərhələsi bayraqlardan oxunur və yuxarıda göstərilir (`/admin/funksiyalar`).
 */
export default async function FinancePage() {
  const [t, { locale }] = await Promise.all([getAdminT(), getAdminI18n()]);
  await requireAdminRead(PERMISSIONS.BILLING_MANAGE);
  const [plans, flags] = await Promise.all([getSubscriptionPlans({ includeInactive: true }), getFeatureFlags()]);
  const mode = pricingMode(flags);

  return (
    <>
      <AdminPageHeader title={t("pages.finance.title")} description={t("pages.finance.description")} />
      <div role="note" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper p-4 text-sm">
        <p className="text-ink">{mode.promo ? t("pages.finance.promoOn") : t("pages.finance.promoOff")}</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin/funksiyalar" className="font-medium text-gold-deep hover:underline">{t("pages.finance.flagsLink")}</Link>
          <a href={localizePath("/paketler", locale)} target="_blank" rel="noreferrer" className="font-medium text-gold-deep hover:underline">{t("pages.finance.publicLink")}</a>
        </div>
      </div>
      <div className="flex flex-col gap-8">
        {PLAN_AUDIENCES.map((audience) => (
          <section key={audience} className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-ink">{t(`pages.finance.audiences.${audience}`)}</h2>
            {plans.filter((plan) => plan.audience === audience).map((plan) => (
              <AdminCard
                key={plan.id}
                title={t(`pages.finance.planNames.${plan.code}`)}
                actions={<Badge tone={plan.isActive ? "success" : "neutral"}>{plan.isActive ? t("pages.finance.active") : t("pages.finance.inactive")}</Badge>}
              >
                <PlanForm plan={plan} />
              </AdminCard>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
