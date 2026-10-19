import { runtimeEnv } from "@/lib/runtime-env";
import { escapeHtml } from "@/lib/email-html";
import { siteUrl } from "@/config/site";
import { formatLocalizedDateTime } from "@/i18n/date";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { sendBotMessage } from "@/lib/telegram-bot/api";
import { getTelegramConfig, sendAdminAlert } from "@/lib/telegram-bot/admin-alerts";
import { maskPhoneForChat } from "@/lib/telegram-bot/policy";

/**
 * Telegram bot bildirişləri (MEMORY bölmə 2 qərarı — lead bildirişi Telegram-a).
 *
 * Secret-lər: `TELEGRAM_BOT_TOKEN` (@BotFather-dən) və `TELEGRAM_CHAT_ID` (qrup və ya
 * şəxsi çat). Biri yoxdursa göndərmə səssizcə buraxılır — müraciətin özü bazaya yazılıb
 * və e-poçt bildirişi ayrıca gedir, ona görə Telegram-ın olmaması axını sındırmamalıdır.
 *
 * Bot API klienti, admin xəbərdarlıqları və istifadəçi bildirişləri `src/lib/telegram-bot/`-dadır;
 * bu modul köhnə çağıranlar üçün (`notifyLeadOnTelegram`, `sendTelegramMessage`) eyni imzanı saxlayır.
 */

/** Telegram mesaj limiti 4096 simvoldur; uzun müraciət mətni qısaldılır. */
const MESSAGE_PREVIEW_LIMIT = 800;

export type TelegramResult = { sent: true } | { sent: false; reason: "not-configured" | "disabled" | "failed" };

export function isTelegramConfigured(): boolean {
  return Boolean(runtimeEnv("TELEGRAM_BOT_TOKEN") && runtimeEnv("TELEGRAM_CHAT_ID"));
}

/** HTML parse_mode ilə ofis çatına mesaj göndərir. Mətn çağıran tərəfdən artıq kodlanmış olmalıdır. */
export async function sendTelegramMessage(html: string): Promise<TelegramResult> {
  const chatId = runtimeEnv("TELEGRAM_CHAT_ID");
  if (!runtimeEnv("TELEGRAM_BOT_TOKEN") || !chatId) return { sent: false, reason: "not-configured" };
  const result = await sendBotMessage({ chatId, html });
  if (result.ok) return { sent: true };
  // Token URL-in içindədir — xəta jurnalına yalnız status yazılır.
  console.error(`Telegram bildirişi alınmadı: HTTP ${result.code}`);
  return { sent: false, reason: "failed" };
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

/**
 * Mesaj mətni ayrıca qurulur ki, test onu şəbəkəsiz yoxlaya bilsin. `contactInChat: false` olanda ad, e-poçt və
 * mesaj mətni çata düşmür, nömrə maskalanır — tam məlumat paneldə, rol yoxlamasından sonra açılır.
 */
export function formatLeadTelegramMessage(payload: TelegramLeadPayload, options: { contactInChat?: boolean } = {}): string {
  const contactInChat = options.contactInChat ?? true;
  const title = payload.kind === "reservation" ? "📅 <b>Yeni baxış sorğusu</b>" : "🔔 <b>Yeni müraciət</b>";
  const adminPath = payload.kind === "reservation" ? "/admin/rezervasiyalar" : `/admin/muracietler/${payload.id}`;
  const lines = [
    title,
    "",
    ...(contactInChat ? [`👤 ${escapeHtml(payload.name)}`] : []),
    `📞 ${escapeHtml(contactInChat ? payload.phone : maskPhoneForChat(payload.phone))}`,
  ];
  if (payload.email && contactInChat) lines.push(`✉️ ${escapeHtml(payload.email)}`);
  if (payload.propertyTitle) lines.push(`🏠 ${escapeHtml(payload.propertyTitle)}`);
  if (payload.requestedFor) {
    const when = formatLocalizedDateTime(payload.requestedFor, "az", "short") ?? "";
    lines.push(`🕒 ${escapeHtml(when)}`);
  }
  if (payload.subject) lines.push(`📌 ${escapeHtml(payload.subject)}`);
  if (payload.message && contactInChat) lines.push("", `<i>${escapeHtml(truncate(payload.message.trim(), MESSAGE_PREVIEW_LIMIT))}</i>`);
  if (payload.source) lines.push("", `Mənbə: ${escapeHtml(payload.source)}`);
  lines.push(`<a href="${escapeHtml(siteUrl(adminPath))}">Paneldə aç</a>`);
  return lines.join("\n");
}

/**
 * Yeni müraciət/rezervasiya bildirişi. Paneldəki «bildirişlər» açarı söndürülübsə
 * (`lead.notify_enabled = 0`) e-poçt kimi Telegram da susur; Telegram parametrlərində
 * müraciət/baxış xəbərdarlığı ayrıca söndürülə bilər. Ofis çatından əlavə, admin təsdiqli
 * «ADMIN_ALERTS» qruplarına da gedir.
 */
export async function notifyLeadOnTelegram(payload: TelegramLeadPayload): Promise<TelegramResult> {
  if (!isTelegramConfigured()) return { sent: false, reason: "not-configured" };
  try {
    if ((await getSetting(SETTING_KEYS.LEAD_NOTIFY_ENABLED)) === "0") return { sent: false, reason: "disabled" };
    const config = await getTelegramConfig();
    return await sendAdminAlert(payload.kind === "reservation" ? "RESERVATION" : "LEAD", {
      html: formatLeadTelegramMessage(payload, { contactInChat: config.leadContactInChat }),
    }, { config });
  } catch {
    // Çağıran action-da müraciət artıq yazılıb — bildiriş xətası onu uğursuz göstərməməlidir.
    return { sent: false, reason: "failed" };
  }
}
