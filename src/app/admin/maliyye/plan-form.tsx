"use client";

import { useTranslations } from "next-intl";
import { AdminForm } from "@/components/admin/form-shell";
import { AdminCheckbox, AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/form-fields";
import {
  CAPABILITY_LEVELS,
  PLAN_CAPABILITIES,
  PLAN_DESCRIPTION_MAX,
  PLAN_DURATIONS,
  PLAN_LIMITS,
  TRIAL_DAYS_MAX,
  type CapabilityLevel,
  type PlanCapabilities,
  type PlanLimits,
} from "@/lib/subscriptions/plan-policy";
import { saveSubscriptionPlan } from "./actions";

type PlanFormData = {
  id: string;
  description: string | null;
  isActive: boolean;
  trialDays: number;
  capabilities: PlanCapabilities;
  limits: PlanLimits;
  prices: { months: number; priceMinor: number }[];
};

const LEVELS = Object.keys(CAPABILITY_LEVELS) as CapabilityLevel[];

/** Bir abunə planının redaktəsi (#244, PRD 16.5): imkanlar, limitlər, tariflər və sınaq günləri. */
export function PlanForm({ plan }: { plan: PlanFormData }) {
  const t = useTranslations("admin");
  const levelOptions = LEVELS.map((level) => ({ value: level, label: t(`pages.finance.levels.${level}`) }));
  const priceOf = (months: number) => {
    const price = plan.prices.find((item) => item.months === months);
    return price ? (price.priceMinor / 100).toFixed(2).replace(/\.00$/, "") : "";
  };

  return (
    <AdminForm action={saveSubscriptionPlan}>
      <input type="hidden" name="id" value={plan.id} />
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <AdminCheckbox name="isActive" label={t("pages.finance.active")} defaultChecked={plan.isActive} />
        <AdminInput
          name="trialDays"
          type="number"
          inputMode="numeric"
          label={t("pages.finance.trialDays")}
          defaultValue={plan.trialDays}
          min={0}
          max={TRIAL_DAYS_MAX}
          required
        />
        <div className="sm:col-span-2">
          <AdminTextarea name="description" label={t("pages.finance.descriptionLabel")} defaultValue={plan.description ?? ""} maxLength={PLAN_DESCRIPTION_MAX} rows={2} />
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-semibold text-ink">{t("pages.finance.capabilities")}</legend>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLAN_CAPABILITIES.map((capability) => (
            <AdminSelect
              key={capability}
              name={`cap_${capability}`}
              label={t(`pages.finance.capabilityNames.${capability}`)}
              options={levelOptions}
              defaultValue={plan.capabilities[capability]}
              searchable={false}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-1 text-sm font-semibold text-ink">{t("pages.finance.limits")}</legend>
        <p className="mb-3 text-xs text-ink-muted">{t("pages.finance.limitHint")}</p>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_LIMITS.map((limit) => (
            <AdminInput
              key={limit}
              name={`limit_${limit}`}
              type="number"
              inputMode="numeric"
              min={0}
              label={t(`pages.finance.limitNames.${limit}`)}
              defaultValue={plan.limits[limit] ?? ""}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-1 text-sm font-semibold text-ink">{t("pages.finance.prices")}</legend>
        <p className="mb-3 text-xs text-ink-muted">{t("pages.finance.priceHint")}</p>
        <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
          {PLAN_DURATIONS.map((months) => (
            <AdminInput
              key={months}
              name={`price_${months}`}
              inputMode="decimal"
              label={t("pages.finance.months", { count: months })}
              defaultValue={priceOf(months)}
            />
          ))}
        </div>
      </fieldset>
    </AdminForm>
  );
}
