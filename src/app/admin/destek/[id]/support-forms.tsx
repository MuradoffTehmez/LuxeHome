"use client";

import { useTranslations } from "next-intl";
import { AdminForm } from "@/components/admin/form-shell";
import { AdminTextarea } from "@/components/admin/form-fields";
import { closeSupport, replySupport } from "../actions";

export function SupportForms({ ticketId, canDeliver }: { ticketId: string; canDeliver: boolean }) {
  const t = useTranslations("admin");
  return (
    <div className="flex flex-col gap-6">
      <AdminForm action={replySupport} submitLabel={t("pages.support.send")}>
        <input type="hidden" name="id" value={ticketId} />
        <AdminTextarea name="body" label={t("pages.support.reply")} rows={6} maxLength={4000} required hint={canDeliver ? t("pages.support.replyHint") : t("pages.support.noChat")} />
      </AdminForm>
      <AdminForm action={closeSupport} submitLabel={t("pages.support.close")}>
        <input type="hidden" name="id" value={ticketId} />
        <p className="text-sm text-ink-soft">{t("pages.support.closeHint")}</p>
      </AdminForm>
    </div>
  );
}
