import { prisma } from "@/lib/prisma";
import { runtimeEnv } from "@/lib/runtime-env";
import { siteUrl } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";
import { formatPrice } from "@/lib/utils";
import { publicPropertyWhere } from "@/lib/queries";
import { isTelegramLoginConfigured } from "@/lib/auth/telegram-oidc";
import { callTelegram, type BotIdentity, type InlineKeyboard, type WebhookInfo } from "./api";
import { BOT_COMMANDS } from "./copy";
import { deliverTelegram, type DeliveryResult } from "./delivery";
import { approvedChatsFor } from "./chats";
import { telegramBotUsername } from "./linking";
import { CHAT_CATEGORIES, DELIVERY_AUDIENCES, DELIVERY_STATUSES, escapeTelegramHtml, isValidWebhookSecret, truncateText, type ChatCategory } from "./policy";

/**
 * Panel üçün Telegram diaqnostikası və quraşdırma əməliyyatları. Secret dəyərləri heç vaxt qaytarılmır — yalnız
 * «qurulub/qurulmayıb». Webhook yalnız bu mühitin `siteUrl()` ünvanına qurulur; botda başqa ünvan varsa (məs.
 * staging eyni tokenlə production-un webhook-unu əvəz etməsin) açıq təsdiq tələb olunur.
 */

export const WEBHOOK_PATH = "/api/telegram/webhook";
/** Botun emal etdiyi update növləri — qalanı Telegram-dan heç gəlmir. */
export const ALLOWED_UPDATES = ["message", "callback_query", "my_chat_member"] as const;

export function expectedWebhookUrl(): string {
  return siteUrl(WEBHOOK_PATH);
}

export type TelegramEnvStatus = Record<"botToken" | "chatId" | "clientId" | "clientSecret" | "webhookSecret", boolean> & {
  webhookSecretValid: boolean;
  botUsername: string;
  loginEnabled: boolean;
};

export function telegramEnvStatus(): TelegramEnvStatus {
  return {
    botToken: Boolean(runtimeEnv("TELEGRAM_BOT_TOKEN")),
    chatId: Boolean(runtimeEnv("TELEGRAM_CHAT_ID")),
    clientId: Boolean(runtimeEnv("TELEGRAM_CLIENT_ID")),
    clientSecret: Boolean(runtimeEnv("TELEGRAM_CLIENT_SECRET")),
    webhookSecret: Boolean(runtimeEnv("TELEGRAM_WEBHOOK_SECRET")),
    webhookSecretValid: isValidWebhookSecret(runtimeEnv("TELEGRAM_WEBHOOK_SECRET")),
    botUsername: telegramBotUsername(),
    loginEnabled: isTelegramLoginConfigured(),
  };
}

export type TelegramDiagnostics = {
  bot: { ok: true; username: string | null; canJoinGroups: boolean; readsAllGroupMessages: boolean } | { ok: false; code: number };
  webhook:
    | { ok: true; url: string; matches: boolean; pending: number; lastErrorAt: Date | null; lastError: string | null; allowedUpdates: string[] }
    | { ok: false; code: number };
};

/** `getMe` + `getWebhookInfo` — paneldə canlı vəziyyət. */
export async function telegramDiagnostics(): Promise<TelegramDiagnostics | null> {
  if (!runtimeEnv("TELEGRAM_BOT_TOKEN")) return null;
  const [me, info] = await Promise.all([callTelegram<BotIdentity>("getMe", {}), callTelegram<WebhookInfo>("getWebhookInfo", {})]);
  return {
    bot: me.ok
      ? { ok: true, username: me.result.username ?? null, canJoinGroups: me.result.can_join_groups === true, readsAllGroupMessages: me.result.can_read_all_group_messages === true }
      : { ok: false, code: me.code },
    webhook: info.ok
      ? {
          ok: true,
          url: info.result.url,
          matches: info.result.url === expectedWebhookUrl(),
          pending: info.result.pending_update_count,
          lastErrorAt: info.result.last_error_date ? new Date(info.result.last_error_date * 1000) : null,
          lastError: info.result.last_error_message?.slice(0, 200) ?? null,
          allowedUpdates: info.result.allowed_updates ?? [],
        }
      : { ok: false, code: info.code },
  };
}

export type WebhookSetupResult = { ok: true } | { ok: false; reason: "not-configured" | "invalid-secret" | "other-url" | "not-https" | "api"; code?: number; currentUrl?: string };

/**
 * `setWebhook`: URL bu mühitin ünvanıdır, `secret_token` — `TELEGRAM_WEBHOOK_SECRET`. Gözləyən update-lər
 * **silinmir** (`drop_pending_updates: false`) — əks halda webhook qurulmazdan əvvəl gələn mesajlar itərdi.
 */
export async function setupTelegramWebhook(input: { overrideOtherUrl: boolean }): Promise<WebhookSetupResult> {
  const secret = runtimeEnv("TELEGRAM_WEBHOOK_SECRET");
  if (!runtimeEnv("TELEGRAM_BOT_TOKEN")) return { ok: false, reason: "not-configured" };
  if (!isValidWebhookSecret(secret)) return { ok: false, reason: "invalid-secret" };
  const url = expectedWebhookUrl();
  if (!url.startsWith("https://")) return { ok: false, reason: "not-https" };
  const info = await callTelegram<WebhookInfo>("getWebhookInfo", {});
  if (info.ok && info.result.url && info.result.url !== url && !input.overrideOtherUrl) return { ok: false, reason: "other-url", currentUrl: info.result.url };
  const result = await callTelegram("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ALLOWED_UPDATES,
    drop_pending_updates: false,
    max_connections: 20,
  });
  return result.ok ? { ok: true } : { ok: false, reason: "api", code: result.code };
}

/** Rollback: webhook silinir, gözləyən update-lər Telegram-da qalır (24 saat). */
export async function removeTelegramWebhook(): Promise<{ ok: boolean; code?: number }> {
  const result = await callTelegram("deleteWebhook", { drop_pending_updates: false });
  return result.ok ? { ok: true } : { ok: false, code: result.code };
}

/** `setMyCommands` — defolt (AZ) və `en`/`ru` dil kodları üçün; BotFather-dəki siyahı ilə eyni. */
export async function syncBotCommands(): Promise<{ ok: boolean; failed: string[] }> {
  const failed: string[] = [];
  const defaults = await callTelegram("setMyCommands", { commands: BOT_COMMANDS.az });
  if (!defaults.ok) failed.push("default");
  for (const locale of ["az", "en", "ru"] as const) {
    const result = await callTelegram("setMyCommands", { commands: BOT_COMMANDS[locale], language_code: locale });
    if (!result.ok) failed.push(locale);
  }
  return { ok: failed.length === 0, failed };
}

export async function telegramDeliveryStats(now: Date = new Date()) {
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [byStatus, failures, linked, consenting, blocked] = await Promise.all([
    prisma.telegramDelivery.groupBy({ by: ["status"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.telegramDelivery.findMany({
      where: { status: DELIVERY_STATUSES.FAILED, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, audience: true, kind: true, lastError: true, attempts: true, createdAt: true },
    }),
    prisma.telegramAccount.count(),
    prisma.telegramAccount.count({ where: { notificationsEnabled: true, blockedAt: null, botAccess: true } }),
    prisma.telegramAccount.count({ where: { blockedAt: { not: null } } }),
  ]);
  const counts = Object.fromEntries(Object.values(DELIVERY_STATUSES).map((status) => [status, 0])) as Record<string, number>;
  for (const row of byStatus) counts[row.status] = row._count._all;
  return { counts, failures, accounts: { linked, consenting, blocked } };
}

export function isChatCategory(value: string): value is ChatCategory {
  return (CHAT_CATEGORIES as readonly string[]).includes(value);
}

async function sendToChats(chatIds: string[], category: ChatCategory, kind: string, message: { html: string; buttons?: InlineKeyboard }) {
  const allowed = new Set((await approvedChatsFor(category)).map((chat) => chat.chatId));
  const targets = chatIds.filter((chatId) => allowed.has(chatId));
  const results: DeliveryResult[] = [];
  for (const chatId of targets) {
    results.push(await deliverTelegram({ audience: DELIVERY_AUDIENCES.CHAT, chatId, kind, html: message.html, buttons: message.buttons }));
  }
  return { targets: targets.length, sent: results.filter((result) => result === "sent" || result === "queued").length };
}

/** Admin yayımı: yalnız təsdiqlənmiş «BROADCAST» hədəflərinə; mətn kodlanır (HTML inyeksiyası yoxdur). */
export async function broadcastToChats(chatIds: string[], text: string) {
  return sendToChats(chatIds, "BROADCAST", "BROADCAST", { html: escapeTelegramHtml(truncateText(text.trim(), 3500)) });
}

/** İctimai elanın paylaşımı — yalnız dərc olunmuş, silinməmiş elan (`publicPropertyWhere`) və «LISTINGS» hədəfləri. */
export async function shareListingToChats(chatIds: string[], slugOrId: string) {
  const key = slugOrId.trim().replace(/^.*\/emlaklar\//, "").split(/[?#/]/)[0];
  if (!key) return null;
  const property = await prisma.property.findFirst({
    where: { ...(await publicPropertyWhere()), OR: [{ slug: key }, { id: key }] },
    select: { title: true, slug: true, price: true, currency: true, rooms: true, area: true, city: { select: { name: true } }, district: { select: { name: true } } },
  });
  if (!property) return null;
  const place = [property.city.name, property.district?.name].filter(Boolean).join(", ");
  const facts = [property.rooms ? `${property.rooms} otaq` : null, property.area ? `${property.area} m²` : null].filter(Boolean).join(" · ");
  const lines = [
    "🏠 <b>Yeni əmlak elanı</b>",
    "",
    `<b>${escapeTelegramHtml(truncateText(property.title, 200))}</b>`,
    place ? `📍 ${escapeTelegramHtml(place)}` : null,
    facts ? `📐 ${escapeTelegramHtml(facts)}` : null,
    `💰 ${escapeTelegramHtml(formatPrice(property.price, property.currency))}`,
  ].filter((line): line is string => line !== null);
  const url = siteUrl(localizePath(`/emlaklar/${property.slug}`, "az"));
  const result = await sendToChats(chatIds, "LISTINGS", "LISTING_SHARE", { html: lines.join("\n"), buttons: [[{ text: "Elana bax", url }]] });
  return { ...result, title: property.title };
}
