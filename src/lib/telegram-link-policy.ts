/**
 * Telegram bildiriş botunun saf qaydaları (Prisma və şəbəkə yoxdur — test və webhook eyni yoldan keçir).
 *
 * Axın: istifadəçi kabinetdə «Telegram-ı qoş» basır → birdəfəlik token yaranır və `t.me/<bot>?start=<token>`
 * açılır → Telegram botu `/start <token>` mesajını webhook-a göndərir → token tanınırsa şəxsi çatın ID-si
 * hesaba yazılır. Token yalnız şəxsi çatda qəbul olunur (qrupda başqası bildirişləri oxuyardı).
 */

/** Token 15 dəqiqə yaşayır — istifadəçi linki dərhal açır; uzun ömür sızmış linkin riskini artırardı. */
export const TELEGRAM_LINK_TTL_MS = 15 * 60 * 1000;

/** Telegram `start` parametri: 1–64 simvol, `A-Za-z0-9_-`. Base64url token buna uyğundur. */
const START_TOKEN = /^[A-Za-z0-9_-]{16,64}$/;

export type TelegramStartCommand = { chatId: string; token: string };

type TelegramUpdate = {
  message?: {
    text?: unknown;
    chat?: { id?: unknown; type?: unknown };
  };
};

/** Webhook yeniləməsindən `/start <token>` əmrini çıxarır; başqa hər şey `null`-dur. */
export function parseStartCommand(update: unknown): TelegramStartCommand | null {
  const message = (update as TelegramUpdate | null)?.message;
  if (!message || typeof message.text !== "string") return null;
  if (message.chat?.type !== "private") return null;
  const chatId = message.chat.id;
  if (typeof chatId !== "number" && typeof chatId !== "string") return null;
  const match = /^\/start(?:@\w+)?\s+(\S+)\s*$/.exec(message.text.trim());
  if (!match || !START_TOKEN.test(match[1])) return null;
  return { chatId: String(chatId), token: match[1] };
}

/** Bot istifadəçi adı `@`-sız saxlanılır; link `https://t.me/<bot>?start=<token>`. */
export function telegramStartLink(botUsername: string, token: string): string {
  return `https://t.me/${encodeURIComponent(botUsername.replace(/^@/, ""))}?start=${encodeURIComponent(token)}`;
}

/** Bildiriş mətni Telegram-ın HTML rejimi üçün: başlıq qalın, məzmun və keçid. */
export function formatTelegramNotice(input: { title: string; content: string; url: string; open: string }): string {
  const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `<b>${escape(input.title)}</b>\n${escape(input.content)}\n\n<a href="${escape(input.url)}">${escape(input.open)}</a>`;
}
