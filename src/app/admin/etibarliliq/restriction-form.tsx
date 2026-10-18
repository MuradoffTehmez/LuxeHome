"use client";

import { useTranslations } from "next-intl";
import { AdminForm } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/form-fields";
import { ACCOUNT_RESTRICTION_KINDS, TRUST_REASON_MAX } from "@/lib/constants";
import { applyRestrictionAction } from "./actions";

/** Tədbir tətbiqi (#258): növ, əsaslandırma (məcburi), istəyə bağlı bitmə tarixi. */
export function RestrictionForm({ userId, suggested }: { userId: string; suggested: string | null }) {
  const t = useTranslations("admin");
  return (
    <AdminForm action={applyRestrictionAction} submitLabel={t("pages.trust.apply")}>
      <input type="hidden" name="userId" value={userId} />
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[12rem_10rem_minmax(0,1fr)]">
        <AdminSelect
          name="kind"
          label={t("pages.trust.kind")}
          options={ACCOUNT_RESTRICTION_KINDS.map((kind) => ({ value: kind, label: t(`pages.trust.kinds.${kind}`) }))}
          defaultValue={suggested ?? "WARNING"}
          searchable={false}
          required
        />
        <AdminInput name="endsAt" type="date" label={t("pages.trust.endsAt")} />
        <AdminTextarea name="reason" label={t("pages.trust.reason")} rows={2} maxLength={TRUST_REASON_MAX} required />
      </div>
    </AdminForm>
  );
}
