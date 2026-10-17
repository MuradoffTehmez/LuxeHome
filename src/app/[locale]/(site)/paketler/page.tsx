import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Check, Info, Minus } from "lucide-react";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { breadcrumbSchema, buildManagedMetadata, jsonLd } from "@/lib/seo";
import type { Locale } from "@/lib/constants";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getSubscriptionPlans, type SubscriptionPlanView } from "@/lib/subscriptions/plans";
import {
  PLAN_AUDIENCES,
  PLAN_CAPABILITIES,
  PLAN_LIMITS,
  durationSavingsPercent,
  pricingMode,
  type PlanAudience,
} from "@/lib/subscriptions/plan-policy";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

// Planlar və bayraqlar D1-dən oxunur — binding yalnız sorğu kontekstindədir.
export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const t = await getTranslations({ locale: resolved, namespace: "phase3.plans" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/paketler", locale: resolved });
}

/**
 * Abunə paketləri (#244, PRD 16.1–16.4). Tanıtım mərhələsində (monetizasiya bağlı) qiymət göstərilmir,
 * tanıtım mesajı çıxır və heç bir ödəniş düyməsi yoxdur — istifadəçi təsadüfən ödəniş yarada bilmir.
 * Ödənişli abunə açılanda tariflər görünür; onlayn ödəniş ayrıca bayraqdır (`PAYMENT_CHECKOUT_ENABLED`).
 */
export default async function PlansPage({ params }: Props) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const [t, navigation, flags, plans] = await Promise.all([
    getTranslations({ locale: resolved, namespace: "phase3.plans" }),
    getTranslations({ locale: resolved, namespace: "navigation" }),
    getFeatureFlags(),
    getSubscriptionPlans(),
  ]);
  // Abunə modulu söndürülübsə (#242) paket səhifəsi yoxdur — menyu, footer və sitemap da onu göstərmir.
  if (!flags.SUBSCRIPTIONS) notFound();
  const mode = pricingMode(flags);

  const audienceSection = (audience: PlanAudience) => {
    const items = plans.filter((plan) => plan.audience === audience);
    if (items.length === 0) return null;
    return (
      <section key={audience} aria-labelledby={`plans-${audience}`} className="flex flex-col gap-6">
        <h2 id={`plans-${audience}`} className="font-display text-3xl tracking-[-0.02em] text-ink">
          {t(audience === "AGENCY" ? "agency" : "individual")}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map(planCard)}
        </div>
        <div className="relative overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">{t(audience === "AGENCY" ? "agency" : "individual")}</caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="p-3 font-medium text-ink-muted">{t("feature")}</th>
                {items.map((plan) => <th key={plan.id} scope="col" className="p-3 font-semibold text-ink">{t(`plans.${plan.code}.name`)}</th>)}
              </tr>
            </thead>
            <tbody>
              {PLAN_CAPABILITIES.map((capability) => (
                <tr key={capability} className="border-b border-line last:border-0">
                  <th scope="row" className="p-3 text-left font-normal text-ink-soft">{t(`capabilities.${capability}`)}</th>
                  {items.map((plan) => {
                    const level = plan.capabilities[capability];
                    return (
                      <td key={plan.id} className="p-3 text-ink">
                        <span className="inline-flex items-center gap-1.5">
                          {level === "NONE"
                            ? <Minus className="size-4 text-ink-muted" aria-hidden="true" />
                            : <Check className="size-4 text-success" aria-hidden="true" />}
                          {t(`levels.${level}`)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const planCard = (plan: SubscriptionPlanView) => {
    const monthly = plan.prices.find((price) => price.months === 1)?.priceMinor ?? null;
    const limits = PLAN_LIMITS.filter((limit) => plan.limits[limit] != null);
    return (
      <article key={plan.id} className={cn("card-surface flex flex-col gap-4 rounded-xl border bg-paper p-6", plan.code === "PRO" ? "border-gold" : "border-line")}>
        <div>
          <h3 className="text-xl font-semibold text-ink">{t(`plans.${plan.code}.name`)}</h3>
          <p className="mt-1 text-sm text-ink-soft">{plan.description[resolved] || t(`plans.${plan.code}.tagline`)}</p>
        </div>
        {mode.showPrices && (
          plan.prices.length > 0 ? (
            <ul className="flex flex-col gap-1.5 text-sm">
              {plan.prices.map((price) => {
                const saving = durationSavingsPercent(monthly, price.priceMinor, price.months);
                return (
                  <li key={price.months} className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-lg text-ink tabular-nums">
                      {t("perPeriod", { price: `${money.format(price.priceMinor / 100)} ₼`, months: t("months", { count: price.months }) })}
                    </span>
                    {saving != null && <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">{t("save", { percent: saving })}</span>}
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-ink-muted">{t("priceOnRequest")}</p>
        )}
        {plan.trialDays > 0 && <p className="text-xs text-ink-muted">{t("trial", { days: plan.trialDays })}</p>}
        {limits.length > 0 && (
          <dl className="grid grid-cols-2 gap-2 text-xs">
            {limits.map((limit) => (
              <div key={limit} className="rounded-sm bg-ivory p-2">
                <dt className="text-ink-muted">{t(`limitNames.${limit}`)}</dt>
                <dd className="font-medium text-ink tabular-nums">{plan.limits[limit]}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-auto pt-2">
          {/* Onlayn ödəniş provayderi hələ qoşulmayıb (PRD 16.7) — ödənişli rejimdə də düymə yaranmır. */}
          {mode.promo
            ? <Link href="/elan-yerlesdir" className={buttonClassName(plan.code === "PRO" ? "primary" : "outline", "md", true)}>{t("freeCta")}</Link>
            : <p className="text-sm text-ink-muted">{t("checkoutSoon")}</p>}
        </div>
      </article>
    );
  };

  return (
    <>
      <script {...jsonLd(breadcrumbSchema([{ name: navigation("home"), path: "/" }, { name: t("eyebrow"), path: "/paketler" }], resolved))} />
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        breadcrumbs={[{ label: navigation("home"), href: "/" }, { label: t("eyebrow") }]}
      />
      <Section tone="ivory" spacing="cozy">
        <Container size="wide" className="flex flex-col gap-12">
          {mode.promo && (
            <div role="note" className="flex gap-3 rounded-xl border border-gold/40 bg-gold/10 p-5">
              <Info className="mt-0.5 size-5 shrink-0 text-gold-deep" aria-hidden="true" />
              <div>
                <p className="font-medium text-ink">{t("promo")}</p>
                <p className="mt-1 text-sm text-ink-soft">{t("promoHint")}</p>
              </div>
            </div>
          )}
          {plans.length === 0 ? <p className="text-ink-muted">{t("empty")}</p> : PLAN_AUDIENCES.map(audienceSection)}
          <p className="text-xs text-ink-muted">{t("note")}</p>
        </Container>
      </Section>
    </>
  );
}
