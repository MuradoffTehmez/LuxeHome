import { prisma } from "@/lib/prisma";
import { runtimeEnv } from "@/lib/runtime-env";
import { sha256Hex, timingSafeEqual, toBase64Url } from "@/lib/auth/crypto";
import { TELEGRAM_LINK_TTL_MS, telegramStartLink, type TelegramStartCommand } from "@/lib/telegram-link-policy";

/**
 * Şəxsi Telegram bildirişləri. Ofis çatına gedən lead bildirişi (`telegram.ts`) ilə eyni bot tokenini işlədir,
 * amma ayrıca iki dəyər tələb edir: `TELEGRAM_BOT_USERNAME` (link üçün) və `TELEGRAM_WEBHOOK_SECRET`
 * (webhook başlığı). Biri yoxdursa kanal kabinetdə «tezliklə» kimi deaktiv qalır və heç nə göndərilmir.
 */

const TELEGRAM_TIMEOUT_MS = 5000;

export function isTelegramNotificationsConfigured(): boolean {
  return Boolean(runtimeEnv("TELEGRAM_BOT_TOKEN") && runtimeEnv("TELEGRAM_BOT_USERNAME") && runtimeEnv("TELEGRAM_WEBHOOK_SECRET"));
}

/** Webhook başlığının yoxlanması (`X-Telegram-Bot-Api-Secret-Token`), sabit vaxtlı müqayisə. */
export function isValidWebhookSecret(header: string | null): boolean {
  const secret = runtimeEnv("TELEGRAM_WEBHOOK_SECRET");
  if (!secret || !header) return false;
  const encoder = new TextEncoder();
  return timingSafeEqual(encoder.encode(header), encoder.encode(secret));
}

/** Yeni bağlama linki: istifadəçinin köhnə tokenləri və bütün vaxtı keçmişlər silinir. */
export async function createTelegramLink(userId: string, now = new Date()): Promise<string | null> {
  const username = runtimeEnv("TELEGRAM_BOT_USERNAME");
  if (!username || !isTelegramNotificationsConfigured()) return null;
  const raw = toBase64Url(crypto.getRandomValues(new Uint8Array(24)));
  await prisma.telegramLinkToken.deleteMany({ where: { OR: [{ userId }, { expiresAt: { lt: now } }] } });
  await prisma.telegramLinkToken.create({
    data: { userId, tokenHash: await sha256Hex(raw), expiresAt: new Date(now.getTime() + TELEGRAM_LINK_TTL_MS) },
  });
  return telegramStartLink(username, raw);
}

export type LinkResult = "linked" | "invalid";

/**
 * `/start <token>` → hesaba bağlama. Token birdəfəlikdir (əvvəl silinir, sonra yazılır — eyni token iki
 * dəfə işlənmir). Çat başqa hesaba bağlı idisə ondan ayrılır: bir çat bir hesab (unikal indeks).
 */
export async function completeTelegramLink(command: TelegramStartCommand, now = new Date()): Promise<LinkResult> {
  const tokenHash = await sha256Hex(command.token);
  const token = await prisma.telegramLinkToken.findUnique({ where: { tokenHash } });
  if (!token) return "invalid";
  const { count } = await prisma.telegramLinkToken.deleteMany({ where: { id: token.id } });
  if (count === 0 || token.expiresAt < now) return "invalid";
  const user = await prisma.user.findUnique({ where: { id: token.userId }, select: { isActive: true } });
  if (!user?.isActive) return "invalid";
  await prisma.user.updateMany({ where: { telegramChatId: command.chatId, NOT: { id: token.userId } }, data: { telegramChatId: null, telegramLinkedAt: null } });
  await prisma.user.update({ where: { id: token.userId }, data: { telegramChatId: command.chatId, telegramLinkedAt: now } });
  return "linked";
}

export async function unlinkTelegram(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { telegramChatId: null, telegramLinkedAt: null } });
  await prisma.telegramLinkToken.deleteMany({ where: { userId } });
}

/**
 * Şəxsi çata mesaj. Heç vaxt atmır. İstifadəçi botu bloklayıbsa (403) bağlantı silinir ki, hər
 * bildirişdə boş cəhd olmasın.
 */
export async function sendTelegramToChat(chatId: string, html: string): Promise<boolean> {
  const token = runtimeEnv("TELEGRAM_BOT_TOKEN");
  if (!token || !isTelegramNotificationsConfigured()) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: "HTML", link_preview_options: { is_disabled: true } }),
      signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
    });
    if (response.status === 403) {
      await prisma.user.updateMany({ where: { telegramChatId: chatId }, data: { telegramChatId: null, telegramLinkedAt: null } }).catch(() => undefined);
      return false;
    }
    if (!response.ok) console.error(`[telegram] şəxsi bildiriş alınmadı: HTTP ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error("[telegram] şəxsi bildiriş alınmadı:", error instanceof Error ? error.name : "unknown");
    return false;
  }
}
