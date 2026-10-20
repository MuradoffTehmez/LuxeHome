import type { Metadata } from "next";
import { CheckCircle2, Send, Users, XCircle } from "lucide-react";
import { AdminCard, AdminPageHeader, StatCard } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { getAdminI18n } from "@/lib/admin-i18n";
import { requireAdminRead } from "@/lib/admin/guard";
import { PERMISSIONS } from "@/lib/constants";
import { formatLocalizedDateTime } from "@/i18n/date";
import { getTelegramConfig } from "@/lib/telegram-bot/admin-alerts";
import { expectedWebhookUrl, telegramDeliveryStats, telegramDiagnostics, telegramEnvStatus } from "@/lib/telegram-bot/admin-tools";
import { approvedChatsFor, listManagedChats } from "@/lib/telegram-bot/chats";
import { BroadcastForms, ChatForm, TelegramConfigForm, WebhookForms } from "./telegram-forms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminI18n();
  return { title: t("pages.telegram.title") };
}
export const dynamic = "force-dynamic";

/**
 * Telegram inteqrasiyası (`settings:manage`): secret-lərin vəziyyəti (dəyər yox, yalnız «qurulub»), bot və webhook
 * diaqnostikası (`getMe`, `getWebhookInfo`), quraşdırma, admin xəbərdarlıq növləri, çatdırılma statistikası, qrup/kanal
 * təsdiqi və yayım.
 */
export default async function TelegramAdminPage() {
  await requireAdminRead(PERMISSIONS.SETTINGS_MANAGE);
  const { t, locale } = await getAdminI18n();
  const env = telegramEnvStatus();
  const [diagnostics, config, stats, chats, broadcastTargets, listingTargets] = await Promise.all([
    telegramDiagnostics().catch(() => null),
    getTelegramConfig(),
    telegramDeliveryStats(),
    listManagedChats(),
    approvedChatsFor("BROADCAST"),
    approvedChatsFor("LISTINGS"),
  ]);
  const date = (value: Date | null) => (value ? formatLocalizedDateTime(value, locale, "short") ?? "" : "—");
  const webhook = diagnostics?.webhook;
  const flag = (ok: boolean) => (ok ? <Badge tone="success">{t("pages.telegram.configured")}</Badge> : <Badge tone="warning">{t("pages.telegram.missing")}</Badge>);
  const envRows = [
    ["TELEGRAM_BOT_TOKEN", env.botToken],
    ["TELEGRAM_WEBHOOK_SECRET", env.webhookSecret && env.webhookSecretValid],
    ["TELEGRAM_CHAT_ID", env.chatId],
    ["TELEGRAM_CLIENT_ID", env.clientId],
    ["TELEGRAM_CLIENT_SECRET", env.clientSecret],
  ] as const;

  return (
    <>
      <AdminPageHeader
        title={t("pages.telegram.title")}
        description={t("pages.telegram.description")}
        breadcrumbs={[{ label: t("pages.moderation.idarePaneli"), href: "/admin" }, { label: t("pages.telegram.title") }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("pages.telegram.stats.linked")} value={stats.accounts.linked} icon={Users} />
        <StatCard label={t("pages.telegram.stats.consenting")} value={stats.accounts.consenting} icon={CheckCircle2} tone="success" />
        <StatCard label={t("pages.telegram.stats.sent")} value={stats.counts.SENT ?? 0} hint={t("pages.telegram.stats.last7")} icon={Send} tone="gold" />
        <StatCard label={t("pages.telegram.stats.failed")} value={(stats.counts.FAILED ?? 0) + (stats.counts.PENDING ?? 0)} hint={t("pages.telegram.stats.failedHint", { pending: stats.counts.PENDING ?? 0 })} icon={XCircle} tone="warning" />
      </div>

      <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard title={t("pages.telegram.envTitle")} description={t("pages.telegram.envDescription")}>
          <dl className="flex flex-col divide-y divide-line text-sm">
            {envRows.map(([name, ok]) => (
              <div key={name} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <dt className="font-mono text-xs break-all text-ink-soft">{name}</dt>
                <dd>{flag(ok)}</dd>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2 py-2">
              <dt className="text-ink-soft">{t("pages.telegram.botUsername")}</dt>
              <dd className="font-medium text-ink">@{env.botUsername}</dd>
            </div>
          </dl>
          {env.webhookSecret && !env.webhookSecretValid ? <p className="mt-3 text-sm text-danger">{t("pages.telegram.secretInvalid")}</p> : null}
        </AdminCard>

        <AdminCard title={t("pages.telegram.healthTitle")}>
          {!diagnostics ? (
            <p className="text-sm text-ink-muted">{t("pages.telegram.notConfigured")}</p>
          ) : (
            <dl className="flex flex-col divide-y divide-line text-sm">
              <div className="flex flex-wrap justify-between gap-2 py-2">
                <dt className="text-ink-soft">{t("pages.telegram.bot")}</dt>
                <dd>{diagnostics.bot.ok ? <Badge tone="success">@{diagnostics.bot.username}</Badge> : <Badge tone="danger">{t("pages.telegram.apiError", { code: diagnostics.bot.code })}</Badge>}</dd>
              </div>
              {diagnostics.bot.ok && diagnostics.bot.readsAllGroupMessages ? (
                <p className="py-2 text-xs text-warning">{t("pages.telegram.privacyModeOff")}</p>
              ) : null}
              <div className="flex flex-col gap-1 py-2">
                <dt className="text-ink-soft">{t("pages.telegram.webhookUrl")}</dt>
                <dd className="font-mono text-xs break-all text-ink">{webhook?.ok ? webhook.url || t("pages.telegram.webhookNone") : "—"}</dd>
                <dd className="text-xs text-ink-muted">{t("pages.telegram.expectedUrl", { url: expectedWebhookUrl() })}</dd>
                {webhook?.ok ? <dd>{webhook.matches ? <Badge tone="success">{t("pages.telegram.webhookOk")}</Badge> : <Badge tone="warning">{t("pages.telegram.webhookMismatch")}</Badge>}</dd> : null}
              </div>
              {webhook?.ok ? (
                <>
                  <div className="flex flex-wrap justify-between gap-2 py-2">
                    <dt className="text-ink-soft">{t("pages.telegram.pending")}</dt>
                    <dd className="tabular font-medium text-ink">{webhook.pending}</dd>
                  </div>
                  <div className="flex flex-col gap-1 py-2">
                    <dt className="text-ink-soft">{t("pages.telegram.lastError")}</dt>
                    <dd className="text-xs break-words text-ink">{webhook.lastError ? `${date(webhook.lastErrorAt)} — ${webhook.lastError}` : t("pages.telegram.noErrors")}</dd>
                  </div>
                </>
              ) : null}
            </dl>
          )}
        </AdminCard>
      </div>

      <AdminCard className="mt-6" title={t("pages.telegram.setupTitle")} description={t("pages.telegram.setupDescription")}>
        <WebhookForms hasOtherUrl={Boolean(webhook?.ok && webhook.url && !webhook.matches)} />
      </AdminCard>

      <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard title={t("pages.telegram.configTitle")}>
          <TelegramConfigForm config={config} />
        </AdminCard>
        <AdminCard title={t("pages.telegram.failuresTitle")}>
          {stats.failures.length === 0 ? (
            <p className="text-sm text-ink-muted">{t("pages.telegram.noFailures")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line text-sm">
              {stats.failures.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="font-mono text-xs text-ink-soft">{row.audience} · {row.kind}</span>
                  <span className="text-xs text-ink-muted">{t("pages.telegram.failureLine", { error: row.lastError ?? "—", attempts: row.attempts, date: date(row.createdAt) })}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <AdminCard className="mt-6" title={t("pages.telegram.chatsTitle")} description={t("pages.telegram.chatsDescription")}>
        {chats.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("pages.telegram.noChats")}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {chats.map((chat) => (
              <li key={chat.id} className="rounded-lg border border-line p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{chat.title ?? chat.chatId}</span>
                  <Badge tone="neutral">{t(`pages.telegram.chatTypes.${chat.type === "channel" ? "channel" : "group"}`)}</Badge>
                  <Badge tone={chat.status === "APPROVED" ? "success" : chat.status === "DISABLED" ? "neutral" : "warning"}>{t(`pages.telegram.chatStatus.${chat.status === "APPROVED" ? "APPROVED" : chat.status === "DISABLED" ? "DISABLED" : "PENDING"}`)}</Badge>
                  {chat.canPost ? null : <Badge tone="danger">{t("pages.telegram.cannotPost")}</Badge>}
                </div>
                <ChatForm chat={{ id: chat.id, status: chat.status, categories: chat.categories }} />
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard className="mt-6" title={t("pages.telegram.broadcastTitle")} description={t("pages.telegram.broadcastDescription")}>
        <BroadcastForms broadcastTargets={broadcastTargets} listingTargets={listingTargets} />
      </AdminCard>
    </>
  );
}
