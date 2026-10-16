"use client";

import { useTranslations } from "next-intl";
import { AdminForm } from "@/components/admin/form-shell";
import { AdminTextarea } from "@/components/admin/form-fields";
import { SAFETY_WARNING_MAX } from "@/lib/safety-warning";
import type { Locale } from "@/lib/constants";
import { saveSafetyWarnings } from "./actions";

/**
 * Beh xəbərdarlığının üç dildəki mətni (#199). Boş sahə həmin dildə defolt mətni saxlayır —
 * defolt mətn placeholder kimi görünür ki, redaktor nəyi əvəz etdiyini bilsin.
 */
export function SafetyWarningForm({
  locales,
  values,
  defaults,
}: {
  locales: Locale[];
  values: Partial<Record<Locale, string>>;
  defaults: Record<Locale, string>;
}) {
  const t = useTranslations("admin");

  return (
    <AdminForm action={saveSafetyWarnings}>
      <div className="flex flex-col gap-5">
        {locales.map((locale) => (
          <AdminTextarea
            key={locale}
            name={`warning_${locale}`}
            label={t(`pages.safety.label.${locale}`)}
            defaultValue={values[locale] ?? ""}
            placeholder={defaults[locale]}
            rows={3}
            maxLength={SAFETY_WARNING_MAX}
            hint={values[locale] ? t("pages.safety.customHint") : t("pages.safety.defaultHint")}
          />
        ))}
      </div>
    </AdminForm>
  );
}
