import { runtimeEnv } from "@/lib/runtime-env";
import { escapeHtml } from "@/lib/email-html";
import { siteUrl } from "@/config/site";
import { formatLocalizedDateTime } from "@/i18n/date";
import { SETTING_KEYS, getSetting } from "@/lib/settings";

/**
 * Telegram bot bildirişləri (MEMORY bölmə 2 qərarı — lead bildirişi Telegram-a).
 *
 * Secret-lər: `TELEGRAM_BOT_TOKEN` (@BotFather-dən) və `TELEGRAM_CHAT_ID` (qrup və ya
 * şəxsi çat). Biri yoxdursa göndərmə səssizcə buraxılır — müraciətin özü bazaya yazılıb
 * və e-poçt bildirişi ayrıca gedir, ona görə Telegram-ın olmaması axını sındırmamalıdır.
 */

const TELEGRAM_TIMEOUT_MS = 5000;
/** Telegram mesaj limiti 4096 simvoldur; uzun müraciət mətni qısaldılır. */
const MESSAGE_PREVIEW_LIMIT = 800;

export type TelegramResult = { sent: true } | { sent: false; reason: "not-configured" | "disabled" | "failed" };

export function isTelegramConfigured(): boolean {
  return Boolean(runtimeEnv("TELEGRAM_BOT_TOKEN") && runtimeEnv("TELEGRAM_CHAT_ID"));
}

/** HTML parse_mode ilə mesaj göndərir. Mətn çağıran tərəfdən artıq kodlanmış olmalıdır. */
export async function sendTelegramMessage(html: string): Promise<TelegramResult> {
  const token = runtimeEnv("TELEGRAM_BOT_TOKEN");
  const chatId = runtimeEnv("TELEGRAM_CHAT_ID");
  if (!token || !chatId) return { sent: false, reason: "not-configured" };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
      signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
    });
    if (!response.ok) {
      // Token URL-in içindədir — xəta jurnalına yalnız status yazılır.
      console.error(`Telegram bildirişi alınmadı: HTTP ${response.status}`);
      return { sent: false, reason: "failed" };
    }
    return { sent: true };
  } catch (error) {
    console.error("Telegram bildirişi alınmadı:", error instanceof Error ? error.name : "unknown");
    return { sent: false, reason: "failed" };
  }
}

function truncate(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

export type TelegramLeadPayload = {
  kind: "lead" | "reservation";
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  subject?: string | null;
  message?: string | null;
  source?: string | null;
  propertyTitle?: string | null;
  requestedFor?: Date | null;
};

/** Mesaj mətni ayrıca qurulur ki, test onu şəbəkəsiz yoxlaya bilsin. */
export function formatLeadTelegramMessage(payload: TelegramLeadPayload): string {
  const title = payload.kind === "reservation" ? "📅 <b>Yeni baxış sorğusu</b>" : "🔔 <b>Yeni müraciət</b>";
  const adminPath = payload.kind === "reservation" ? "/admin/rezervasiyalar" : `/admin/muracietler/${payload.id}`;
  const lines = [
    title,
    "",
    `👤 ${escapeHtml(payload.name)}`,
    `📞 ${escapeHtml(payload.phone)}`,
  ];
  if (payload.email) lines.push(`✉️ ${escapeHtml(payload.email)}`);
  if (payload.propertyTitle) lines.push(`🏠 ${escapeHtml(payload.propertyTitle)}`);
  if (payload.requestedFor) {
    const when = formatLocalizedDateTime(payload.requestedFor, "az", "short") ?? "";
    lines.push(`🕒 ${escapeHtml(when)}`);
  }
  if (payload.subject) lines.push(`📌 ${escapeHtml(payload.subject)}`);
  if (payload.message) lines.push("", `<i>${escapeHtml(truncate(payload.message.trim(), MESSAGE_PREVIEW_LIMIT))}</i>`);
  if (payload.source) lines.push("", `Mənbə: ${escapeHtml(payload.source)}`);
  lines.push(`<a href="${escapeHtml(siteUrl(adminPath))}">Paneldə aç</a>`);
  return lines.join("\n");
}

/**
 * Yeni müraciət/rezervasiya bildirişi. Paneldəki «bildirişlər» açarı söndürülübsə
 * (`lead.notify_enabled = 0`) e-poçt kimi Telegram da susur.
 */
export async function notifyLeadOnTelegram(payload: TelegramLeadPayload): Promise<TelegramResult> {
  if (!isTelegramConfigured()) return { sent: false, reason: "not-configured" };
  try {
    if ((await getSetting(SETTING_KEYS.LEAD_NOTIFY_ENABLED)) === "0") return { sent: false, reason: "disabled" };
    return await sendTelegramMessage(formatLeadTelegramMessage(payload));
  } catch {
    // Çağıran action-da müraciət artıq yazılıb — bildiriş xətası onu uğursuz göstərməməlidir.
    return { sent: false, reason: "failed" };
  }
}
