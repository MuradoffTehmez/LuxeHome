"use client";

import { useTranslations } from "next-intl";
import { AdminForm } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect } from "@/components/admin/form-fields";
import { VIP_DURATIONS_DAYS } from "@/lib/constants";
import { approveVipAction, extendVipAction, grantVipAction } from "./actions";

function useDayOptions() {
  const t = useTranslations("admin");
  return VIP_DURATIONS_DAYS.map((days) => ({ value: String(days), label: t("pages.vip.days", { count: days }) }));
}

/** Gözləyən sorğunun təsdiqi: müddət (sorğudakı defolt) və istəyə bağlı qeyd. */
export function ApproveVipForm({ requestId, requestedDays }: { requestId: string; requestedDays: number }) {
  const t = useTranslations("admin");
  const options = useDayOptions();
  return (
    <AdminForm action={approveVipAction} submitLabel={t("pages.vip.approve")}>
      <input type="hidden" name="requestId" value={requestId} />
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <AdminSelect name="days" label={t("pages.vip.duration")} options={options} defaultValue={String(requestedDays)} searchable={false} required />
        <AdminInput name="note" label={t("pages.vip.note")} maxLength={500} />
      </div>
    </AdminForm>
  );
}

export function ExtendVipForm({ requestId }: { requestId: string }) {
  const t = useTranslations("admin");
  const options = useDayOptions();
  return (
    <AdminForm action={extendVipAction} submitLabel={t("pages.vip.extend")}>
      <input type="hidden" name="requestId" value={requestId} />
      <AdminSelect name="days" label={t("pages.vip.extendBy")} options={options} defaultValue="7" searchable={false} required />
    </AdminForm>
  );
}

/** Sorğusuz VIP — elan linki və ya slug. */
export function GrantVipForm() {
  const t = useTranslations("admin");
  const options = useDayOptions();
  return (
    <AdminForm action={grantVipAction} submitLabel={t("pages.vip.grant")}>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_10rem_minmax(0,1fr)]">
        <AdminInput name="listing" label={t("pages.vip.listing")} hint={t("pages.vip.listingHint")} required />
        <AdminSelect name="days" label={t("pages.vip.duration")} options={options} defaultValue="30" searchable={false} required />
        <AdminInput name="note" label={t("pages.vip.note")} maxLength={500} />
      </div>
    </AdminForm>
  );
}
