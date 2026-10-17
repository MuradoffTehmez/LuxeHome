"use client";

import { useTranslations } from "next-intl";
import { AdminForm } from "@/components/admin/form-shell";
import { AdminCheckbox, AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/form-fields";
import { PLAN_CODES, PLAN_DURATIONS } from "@/lib/subscriptions/plan-policy";
import { grantSubscriptionAction, saveCampaign, saveDiscountCode } from "./billing-actions";

/** Abunə təyini (#246): istifadəçinin e-poçtu, plan, müddət, istəyə bağlı sınaq. Ödəniş yaranmır. */
export function GrantSubscriptionForm({ plans }: { plans: { id: string; label: string }[] }) {
  const t = useTranslations("admin");
  return (
    <AdminForm action={grantSubscriptionAction}>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminInput name="email" type="email" label={t("pages.finance.subscriptions.email")} required autoComplete="off" />
        <AdminSelect name="planId" label={t("pages.finance.subscriptions.plan")} options={plans.map((plan) => ({ value: plan.id, label: plan.label }))} searchable={false} required />
        <AdminSelect
          name="months"
          label={t("pages.finance.subscriptions.duration")}
          options={PLAN_DURATIONS.map((months) => ({ value: String(months), label: t("pages.finance.months", { count: months }) }))}
          searchable={false}
          required
        />
        <div className="flex items-end pb-3">
          <AdminCheckbox name="withTrial" label={t("pages.finance.subscriptions.withTrial")} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <AdminInput name="note" label={t("pages.finance.subscriptions.note")} maxLength={300} />
        </div>
      </div>
    </AdminForm>
  );
}

/** Endirim kodu (#246, PRD 16.5): faiz və ya sabit məbləğ, müddət, limit, planlar. */
export function DiscountCodeForm() {
  const t = useTranslations("admin");
  return (
    <AdminForm action={saveDiscountCode}>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminInput name="code" label={t("pages.finance.discounts.code")} hint={t("pages.finance.discounts.codeHint")} required autoComplete="off" className="uppercase" />
        <AdminInput name="percentOff" type="number" inputMode="numeric" min={1} max={100} label={t("pages.finance.discounts.percentOff")} />
        <AdminInput name="amountOff" inputMode="decimal" label={t("pages.finance.discounts.amountOff")} hint={t("pages.finance.discounts.oneOf")} />
        <AdminInput name="validFrom" type="date" label={t("pages.finance.discounts.validFrom")} />
        <AdminInput name="validUntil" type="date" label={t("pages.finance.discounts.validUntil")} />
        <AdminInput name="maxRedemptions" type="number" inputMode="numeric" min={1} label={t("pages.finance.discounts.maxRedemptions")} />
      </div>
      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium text-ink">{t("pages.finance.discounts.plans")}</legend>
        <div className="flex flex-wrap gap-4">
          {PLAN_CODES.map((code) => <AdminCheckbox key={code} name="planCodes" value={code} label={t(`pages.finance.planNames.${code}`)} />)}
        </div>
        <p className="mt-1 text-xs text-ink-muted">{t("pages.finance.discounts.plansHint")}</p>
      </fieldset>
    </AdminForm>
  );
}

/** Tanıtım kampaniyası (#246, PRD 16.5): paket səhifəsində müddətli mesaj. */
export function CampaignForm() {
  const t = useTranslations("admin");
  return (
    <AdminForm action={saveCampaign}>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminInput name="name" label={t("pages.finance.campaigns.name")} required maxLength={120} />
        <AdminInput name="startsAt" type="date" label={t("pages.finance.campaigns.startsAt")} required />
        <AdminInput name="endsAt" type="date" label={t("pages.finance.campaigns.endsAt")} required />
        <div className="sm:col-span-3">
          <AdminTextarea name="messageAz" label={t("pages.finance.campaigns.messageAz")} required maxLength={300} rows={2} />
        </div>
        <div className="sm:col-span-3">
          <AdminTextarea name="messageEn" label={t("pages.finance.campaigns.messageEn")} maxLength={300} rows={2} />
        </div>
        <div className="sm:col-span-3">
          <AdminTextarea name="messageRu" label={t("pages.finance.campaigns.messageRu")} maxLength={300} rows={2} />
        </div>
      </div>
    </AdminForm>
  );
}
