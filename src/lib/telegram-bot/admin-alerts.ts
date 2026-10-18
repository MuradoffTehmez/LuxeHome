import { prisma } from "@/lib/prisma";
import { runtimeEnv } from "@/lib/runtime-env";
import { siteUrl } from "@/config/site";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { sendBotMessage, type InlineKeyboard } from "./api";
import { deliverTelegram } from "./delivery";
import {
  CHAT_STATUSES,
  DELIVERY_AUDIENCES,
  escapeTelegramHtml,
  parseChatCategories,
  parseTelegramConfig,
  truncateText,
  type AdminAlertKind,
  type TelegramConfig,
} from "./policy";

/**
 * Administrator xəbərdarlıqları: ofis çatı (`TELEGRAM_CHAT_ID`, köhnə müraciət bildirişi ilə eyni hədəf) və admin
 * tərəfindən təsdiqlənmiş, «ADMIN_ALERTS» kateqoriyalı qrup/kanallar. Hər növ (`ADMIN_ALERT_KINDS`) paneldə ayrıca
 * söndürülə bilir (`SETTING_KEYS.TELEGRAM_CONFIG`). Mesajda yalnız mənbə, status, vaxt və panel linki olur — tam
 * məlumat paneldə, `/admin` guard-ından sonra açılır; Telegram-dakı link rol yoxlamasını keçmir.
 */

export type AdminAlertResult = { sent: true } | { sent: false; reason: "not-configured" | "disabled" | "failed" };

export async function getTelegramConfig(): Promise<TelegramConfig> {
  return parseTelegramConfig(await getSetting(SETTING_KEYS.TELEGRAM_CONFIG).catch(() => null));
}

export function adminAlertsConfigured(): boolean {
  return Boolean(runtimeEnv("TELEGRAM_BOT_TOKEN") && runtimeEnv("TELEGRAM_CHAT_ID"));
}

/** Admin xəbərdarlığı alan təsdiqlənmiş qrup/kanalların ID-ləri. Oxuma xətası boş siyahıdır. */
async function approvedAlertChats(): Promise<string[]> {
  try {
    const chats = await prisma.telegramChat.findMany({
      where: { status: CHAT_STATUSES.APPROVED, canPost: true },
      select: { chatId: true, categories: true },
    });
    return chats.filter((chat) => parseChatCategories(chat.categories).includes("ADMIN_ALERTS")).map((chat) => chat.chatId);
  } catch {
    return [];
  }
}

/** Xəbərdarlıq mətni: başlıq, sətirlər (artıq kodlanmış) və «Paneldə aç» düyməsi. */
export function formatAdminAlert(input: { title: string; lines: string[]; adminPath: string }): { html: string; buttons: InlineKeyboard } {
  const html = [`<b>${escapeTelegramHtml(input.title)}</b>`, "", ...input.lines].join("\n");
  return { html, buttons: [[{ text: "Paneldə aç", url: siteUrl(input.adminPath) }]] };
}

export function alertLine(icon: string, value: string | null | undefined, limit = 200): string | null {
  return value ? `${icon} ${escapeTelegramHtml(truncateText(value.trim(), limit))}` : null;
}

/**
 * Xəbərdarlığı göndərir. Ofis çatı birbaşa (jurnalsız, köhnə davranış) gedir, əlavə qruplar `TelegramDelivery`
 * növbəsindən — təkrar cəhd və bloklanma idarəsi ilə. Heç vaxt atmır.
 */
export async function sendAdminAlert(
  kind: AdminAlertKind,
  message: { html: string; buttons?: InlineKeyboard; dedupeKey?: string },
  options: { config?: TelegramConfig } = {},
): Promise<AdminAlertResult> {
  try {
    if (!runtimeEnv("TELEGRAM_BOT_TOKEN")) return { sent: false, reason: "not-configured" };
    const config = options.config ?? (await getTelegramConfig());
    if (!config.adminAlerts[kind]) return { sent: false, reason: "disabled" };

    const officeChat = runtimeEnv("TELEGRAM_CHAT_ID");
    const extra = (await approvedAlertChats()).filter((chatId) => chatId !== officeChat);
    if (!officeChat && extra.length === 0) return { sent: false, reason: "not-configured" };

    let sent = false;
    // Təkrar açarı olan xəbərdarlıq (sistem xətası) ofis çatına da növbədən gedir ki, hər cron-da təkrarlanmasın.
    if (officeChat && !message.dedupeKey) {
      const result = await sendBotMessage({ chatId: officeChat, html: message.html, buttons: message.buttons });
      if (result.ok) sent = true;
      else console.error(`Telegram admin xəbərdarlığı alınmadı: HTTP ${result.code}`);
    }
    for (const chatId of message.dedupeKey && officeChat ? [officeChat, ...extra] : extra) {
      const result = await deliverTelegram({
        audience: DELIVERY_AUDIENCES.ADMIN,
        chatId,
        kind: `ADMIN_${kind}`,
        html: message.html,
        buttons: message.buttons,
        dedupeKey: message.dedupeKey ? `admin:${message.dedupeKey}:${chatId}` : null,
      });
      if (result === "sent" || result === "queued") sent = true;
    }
    return sent ? { sent: true } : { sent: false, reason: "failed" };
  } catch {
    return { sent: false, reason: "failed" };
  }
}

/** Moderasiya növbəsinə yeni elan düşdü. */
export async function alertModerationQueued(input: { propertyId: string; title: string; reason: "new" | "edit" | "risk" }): Promise<void> {
  const reasonLabel = { new: "Yeni elan", edit: "Redaktə olunmuş elan", risk: "Risk siqnalı ilə saxlanılıb" }[input.reason];
  const message = formatAdminAlert({
    title: "🛡 Moderasiya növbəsi",
    lines: [alertLine("🏠", input.title), `📌 ${reasonLabel}`].filter(Boolean) as string[],
    adminPath: `/admin/emlaklar/${input.propertyId}`,
  });
  await sendAdminAlert("MODERATION", { ...message, dedupeKey: `moderation:${input.propertyId}:${Date.now().toString(36)}` });
}

/** Elan şikayəti — yalnız səbəb kodu və elan başlığı, şikayətçi barədə heç nə. */
export async function alertListingReport(input: { reportId: string; propertyTitle: string; reasons: string[]; urgent: boolean }): Promise<void> {
  const message = formatAdminAlert({
    title: input.urgent ? "🚨 Təcili elan şikayəti" : "⚠️ Yeni elan şikayəti",
    lines: [alertLine("🏠", input.propertyTitle), `📌 ${escapeTelegramHtml(input.reasons.join(", ").slice(0, 200))}`].filter(Boolean) as string[],
    adminPath: "/admin/sikayetler",
  });
  await sendAdminAlert("REPORT", { ...message, dedupeKey: `report:${input.reportId}` });
}

/** Yeni dəstək müraciəti və ya mesajı. Mesaj mətni çata göndərilmir — paneldə oxunur. */
export async function alertSupportTicket(input: { ticketId: string; name: string | null; linked: boolean; isNew: boolean }): Promise<void> {
  const message = formatAdminAlert({
    title: input.isNew ? "💬 Yeni dəstək müraciəti" : "💬 Dəstək müraciətinə yeni mesaj",
    lines: [alertLine("👤", input.name ?? "Telegram istifadəçisi"), input.linked ? "🔗 Hesaba bağlıdır" : "❔ Hesaba bağlı deyil", `№ ${escapeTelegramHtml(input.ticketId.slice(-8))}`].filter(Boolean) as string[],
    adminPath: `/admin/destek/${input.ticketId}`,
  });
  await sendAdminAlert("SUPPORT", message);
}

/** Kritik əməliyyat xətası (cron işi alınmadı və s.). Xəta mətni yox, yalnız iş adı göndərilir. */
export async function alertSystemFailure(input: { job: string; at?: Date }): Promise<void> {
  const at = input.at ?? new Date();
  const message = formatAdminAlert({
    title: "🔥 Sistem xəbərdarlığı",
    lines: [`⚙️ ${escapeTelegramHtml(input.job)} işi alınmadı`, `🕒 ${at.toISOString().slice(0, 16).replace("T", " ")} UTC`],
    adminPath: "/admin/sistem",
  });
  // Eyni iş saat ərzində bir dəfə xəbər verilir — hər 10 dəqiqədə təkrarlanmasın.
  await sendAdminAlert("SYSTEM", { ...message, dedupeKey: `system:${input.job}:${at.toISOString().slice(0, 13)}` });
}
