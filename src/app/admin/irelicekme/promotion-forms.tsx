"use client";

import { useTranslations } from "next-intl";
import { AdminForm } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect } from "@/components/admin/form-fields";
import { PROMOTION_DURATIONS_DAYS } from "@/lib/constants";
import { approvePromotionAction, grantPromotionAction } from "./actions";

function useDayOptions() {
  const t = useTranslations("admin");
  return PROMOTION_DURATIONS_DAYS.map((days) => ({ value: String(days), label: t("pages.promotion.days", { count: days }) }));
}

/** Gözləyən sorğunun təsdiqi — kampaniya dərhal başlayır. */
export function ApprovePromotionForm({ campaignId, days }: { campaignId: string; days: number }) {
  const t = useTranslations("admin");
  const options = useDayOptions();
  return (
    <AdminForm action={approvePromotionAction} submitLabel={t("pages.promotion.approve")}>
      <input type="hidden" name="requestId" value={campaignId} />
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <AdminSelect name="days" label={t("pages.promotion.duration")} options={options} defaultValue={String(days)} searchable={false} required />
        <AdminInput name="note" label={t("pages.promotion.note")} maxLength={500} />
      </div>
    </AdminForm>
  );
}

/** Sorğusuz kampaniya — elan linki və ya slug. */
export function GrantPromotionForm() {
  const t = useTranslations("admin");
  const options = useDayOptions();
  return (
    <AdminForm action={grantPromotionAction} submitLabel={t("pages.promotion.grant")}>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_10rem_minmax(0,1fr)]">
        <AdminInput name="listing" label={t("pages.promotion.listing")} hint={t("pages.promotion.listingHint")} required />
        <AdminSelect name="days" label={t("pages.promotion.duration")} options={options} defaultValue="7" searchable={false} required />
        <AdminInput name="note" label={t("pages.promotion.note")} maxLength={500} />
      </div>
    </AdminForm>
  );
}
