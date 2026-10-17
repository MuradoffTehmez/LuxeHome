"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminForm } from "@/components/admin/form-shell";
import { CRITICAL_FLAGS, MODULE_FLAGS, MONETIZATION_FLAGS, type FeatureFlag, type FeatureFlags } from "@/lib/feature-flags-policy";
import { saveFeatureFlags } from "./actions";

/**
 * Funksiya bayraqları (#242, PRD 23, 16.6). Kritik açar (ödəniş, abunə, avtomatik moderasiya) dəyişəndə
 * təsdiq qutusu görünür — server də onsuz saxlamır.
 */
export function FeatureFlagsForm({ flags }: { flags: FeatureFlags }) {
  const t = useTranslations("admin");
  const [values, setValues] = useState<FeatureFlags>(flags);
  const criticalChanged = CRITICAL_FLAGS.some((flag) => values[flag] !== flags[flag]);

  const group = (title: string, items: readonly FeatureFlag[]) => (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-ink">{title}</legend>
      {items.map((flag) => (
        <label key={flag} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-sm border border-line p-3 has-[:checked]:border-gold">
          <input
            type="checkbox"
            name={flag}
            checked={values[flag]}
            onChange={(event) => setValues((current) => ({ ...current, [flag]: event.target.checked }))}
            className="mt-0.5 size-4 accent-gold"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">
              {t(`pages.featureFlags.flags.${flag}.label`)}
              {CRITICAL_FLAGS.includes(flag) && <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">{t("pages.featureFlags.critical")}</span>}
            </span>
            <span className="block text-xs text-ink-muted">{t(`pages.featureFlags.flags.${flag}.hint`)}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );

  return (
    <AdminForm action={saveFeatureFlags}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {group(t("pages.featureFlags.modules"), MODULE_FLAGS)}
        {group(t("pages.featureFlags.monetization"), MONETIZATION_FLAGS)}
      </div>
      {criticalChanged && (
        <label className="mt-4 flex items-start gap-3 rounded-sm border border-warning/50 bg-warning/10 p-3 text-sm text-ink">
          <input type="checkbox" name="confirmCritical" required className="mt-0.5 size-4 accent-gold" />
          {t("pages.featureFlags.confirmCritical")}
        </label>
      )}
    </AdminForm>
  );
}
