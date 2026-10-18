"use client";

import { useTranslations } from "next-intl";
import { AdminForm } from "@/components/admin/form-shell";
import { AdminInput, AdminTextarea } from "@/components/admin/form-fields";
import { ADMIN_ALERT_KINDS, CHAT_CATEGORIES, type TelegramConfig } from "@/lib/telegram-bot/policy";
import {
  broadcastTelegram,
  configureTelegramWebhook,
  deleteTelegramWebhook,
  saveTelegramConfig,
  shareListingTelegram,
  syncTelegramCommands,
  updateTelegramChat,
} from "./actions";

const checkboxRow = "flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink";

export function TelegramConfigForm({ config }: { config: TelegramConfig }) {
  const t = useTranslations("admin");
  return (
    <AdminForm action={saveTelegramConfig}>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-2 text-sm font-semibold text-ink">{t("pages.telegram.alertsLegend")}</legend>
        {ADMIN_ALERT_KINDS.map((kind) => (
          <label key={kind} className={checkboxRow}>
            <input type="checkbox" name={`alert_${kind}`} defaultChecked={config.adminAlerts[kind]} className="mt-0.5 size-5 accent-gold" />
            <span>
              <span className="font-medium">{t(`pages.telegram.alerts.${kind}.label`)}</span>
              <span className="block text-xs text-ink-muted">{t(`pages.telegram.alerts.${kind}.hint`)}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <label className={checkboxRow}>
        <input type="checkbox" name="leadContactInChat" defaultChecked={config.leadContactInChat} className="mt-0.5 size-5 accent-gold" />
        <span>
          <span className="font-medium">{t("pages.telegram.leadContact")}</span>
          <span className="block text-xs text-ink-muted">{t("pages.telegram.leadContactHint")}</span>
        </span>
      </label>
    </AdminForm>
  );
}

export function WebhookForms({ hasOtherUrl }: { hasOtherUrl: boolean }) {
  const t = useTranslations("admin");
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <AdminForm action={configureTelegramWebhook} submitLabel={t("pages.telegram.setWebhook")}>
        <p className="text-sm text-ink-soft">{t("pages.telegram.setWebhookHint")}</p>
        {hasOtherUrl ? (
          <label className={checkboxRow}>
            <input type="checkbox" name="override" className="mt-0.5 size-5 accent-gold" />
            <span className="text-warning">{t("pages.telegram.overrideOther")}</span>
          </label>
        ) : null}
      </AdminForm>
      <AdminForm action={syncTelegramCommands} submitLabel={t("pages.telegram.syncCommands")}>
        <p className="text-sm text-ink-soft">{t("pages.telegram.syncCommandsHint")}</p>
      </AdminForm>
      <AdminForm action={deleteTelegramWebhook} submitLabel={t("pages.telegram.deleteWebhook")}>
        <p className="text-sm text-ink-soft">{t("pages.telegram.deleteWebhookHint")}</p>
        <label className={checkboxRow}>
          <input type="checkbox" name="confirm" className="mt-0.5 size-5 accent-gold" />
          <span>{t("pages.telegram.deleteConfirm")}</span>
        </label>
      </AdminForm>
    </div>
  );
}

export function ChatForm({ chat }: { chat: { id: string; status: string; categories: string[] } }) {
  const t = useTranslations("admin");
  return (
    <AdminForm action={updateTelegramChat} submitLabel={t("actions.save")}>
      <input type="hidden" name="id" value={chat.id} />
      <div className="flex flex-wrap gap-x-5">
        {CHAT_CATEGORIES.map((category) => (
          <label key={category} className={checkboxRow}>
            <input type="checkbox" name="categories" value={category} defaultChecked={chat.categories.includes(category)} className="mt-0.5 size-5 accent-gold" />
            <span>{t(`pages.telegram.categories.${category}`)}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5">
        {(["APPROVED", "DISABLED"] as const).map((status) => (
          <label key={status} className={checkboxRow}>
            <input type="radio" name="status" value={status} defaultChecked={chat.status === status} className="mt-0.5 size-5 accent-gold" required />
            <span>{t(`pages.telegram.chatStatus.${status}`)}</span>
          </label>
        ))}
      </div>
    </AdminForm>
  );
}

type Target = { chatId: string; title: string | null };

function TargetList({ targets, emptyKey }: { targets: Target[]; emptyKey: "pages.telegram.noBroadcastTargets" | "pages.telegram.noListingTargets" }) {
  const t = useTranslations("admin");
  if (targets.length === 0) return <p className="text-sm text-ink-muted">{t(emptyKey)}</p>;
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-sm font-semibold text-ink">{t("pages.telegram.targets")}</legend>
      {targets.map((target) => (
        <label key={target.chatId} className={checkboxRow}>
          <input type="checkbox" name="chatIds" value={target.chatId} defaultChecked className="mt-0.5 size-5 accent-gold" />
          <span>{target.title ?? target.chatId}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function BroadcastForms({ broadcastTargets, listingTargets }: { broadcastTargets: Target[]; listingTargets: Target[] }) {
  const t = useTranslations("admin");
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <AdminForm action={broadcastTelegram} submitLabel={t("pages.telegram.send")}>
        <TargetList targets={broadcastTargets} emptyKey="pages.telegram.noBroadcastTargets" />
        <AdminTextarea name="text" label={t("pages.telegram.broadcastText")} rows={5} maxLength={3500} required />
      </AdminForm>
      <AdminForm action={shareListingTelegram} submitLabel={t("pages.telegram.share")}>
        <TargetList targets={listingTargets} emptyKey="pages.telegram.noListingTargets" />
        <AdminInput name="listing" label={t("pages.telegram.listing")} hint={t("pages.telegram.listingHint")} required />
      </AdminForm>
    </div>
  );
}
