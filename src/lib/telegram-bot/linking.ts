import { prisma } from "@/lib/prisma";
import { runtimeEnv } from "@/lib/runtime-env";
import { isUniqueViolation } from "@/lib/media/upload-record";
import { sha256Hex, toBase64Url } from "@/lib/auth/crypto";
import { canUsePublicSignIn } from "@/lib/auth/public-account-policy";
import { recordSecurityEvent } from "@/lib/security/security-events";
import { SECURITY_EVENT_KINDS } from "@/lib/security/security-event-kinds";
import { LINK_PAYLOAD_PREFIX, LINK_TOKEN_PURPOSES, LINK_TOKEN_TTL_MS } from "./policy";

/**
 * Telegram hesabının sayt hesabına bağlanması (deep-link):
 *
 * 1. Giriş etmiş istifadəçi kabinetdə «Telegram-ı bağla» seçir → `createLinkToken()` 32 baytlıq təsadüfi token yaradır,
 *    bazaya yalnız SHA-256 heşi yazılır (10 dəqiqə, birdəfəlik).
 * 2. İstifadəçi `https://t.me/<bot>?start=l_<token>` ünvanına keçir, Telegram `/start l_<token>` mesajını webhook-a göndərir.
 * 3. `consumeLinkToken()` tokeni şərti `updateMany` ilə götürür (təkrar istifadə olunmur) və kimliyi **webhook
 *    hadisəsindəki** `from.id`-dən götürür — brauzerdən gələn heç bir dəyərə etibar edilmir.
 *
 * Eyni Telegram ID iki hesaba bağlana bilmir (unikal indeks); hesabda başqa Telegram varsa, sahibin özünün başlatdığı
 * yeni bağlama köhnəsini əvəz edir və razılıq sıfırlanır.
 */

export function telegramBotUsername(): string {
  return runtimeEnv("TELEGRAM_BOT_USERNAME")?.replace(/^@/, "") || "luxehomeestatebot";
}

export function telegramBotUrl(payload?: string): string {
  const base = `https://t.me/${telegramBotUsername()}`;
  return payload ? `${base}?start=${payload}` : base;
}

export function randomLinkToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

/** Kabinetdən bağlama: köhnə istifadə olunmamış tokenlər silinir, yenisinin deep-link ünvanı qaytarılır. */
export async function createLinkToken(userId: string, now: Date = new Date()): Promise<string> {
  const token = randomLinkToken();
  await prisma.telegramLinkToken.deleteMany({ where: { userId, purpose: LINK_TOKEN_PURPOSES.LINK, usedAt: null } });
  await prisma.telegramLinkToken.create({
    data: { tokenHash: await sha256Hex(token), purpose: LINK_TOKEN_PURPOSES.LINK, userId, expiresAt: new Date(now.getTime() + LINK_TOKEN_TTL_MS) },
  });
  return telegramBotUrl(`${LINK_PAYLOAD_PREFIX}${token}`);
}

export type TelegramIdentity = { id: string; username?: string | null; firstName?: string | null };

export type LinkResult =
  | { ok: true; userId: string; userName: string; replaced: boolean }
  | { ok: false; reason: "expired" | "taken" | "unavailable" | "failed" };

export async function consumeLinkToken(token: string, identity: TelegramIdentity, chatId: string, now: Date = new Date()): Promise<LinkResult> {
  try {
    const record = await prisma.telegramLinkToken.findUnique({
      where: { tokenHash: await sha256Hex(token) },
      select: { id: true, userId: true, purpose: true, usedAt: true, expiresAt: true },
    });
    if (!record || record.purpose !== LINK_TOKEN_PURPOSES.LINK || !record.userId || record.usedAt || record.expiresAt <= now) {
      return { ok: false, reason: "expired" };
    }
    const userId = record.userId;
    const [user, holder, current] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, accountType: true, isActive: true, deletionRequestedAt: true } }),
      prisma.telegramAccount.findUnique({ where: { telegramUserId: identity.id }, select: { userId: true } }),
      prisma.telegramAccount.findUnique({ where: { userId }, select: { telegramUserId: true } }),
    ]);
    if (!user || !user.isActive || user.deletionRequestedAt || !canUsePublicSignIn(user.accountType)) return { ok: false, reason: "unavailable" };
    // Başqa hesaba bağlıdır — token götürülmür: sahib o hesabdan ayırıb eyni linklə yenidən cəhd edə bilər.
    if (holder && holder.userId !== userId) return { ok: false, reason: "taken" };

    const claimed = await prisma.telegramLinkToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: now } });
    if (claimed.count !== 1) return { ok: false, reason: "expired" };

    const replaced = Boolean(current && current.telegramUserId !== identity.id);
    const profile = { username: identity.username ?? null, firstName: identity.firstName ?? null, chatId, botAccess: true, blockedAt: null };
    try {
      await prisma.telegramAccount.upsert({
        where: { userId },
        create: { userId, telegramUserId: identity.id, ...profile },
        // Yeni Telegram hesabına keçid: OIDC kimliyi və razılıq köhnə hesaba aid idi — sıfırlanır.
        update: replaced ? { telegramUserId: identity.id, oidcSub: null, notificationsEnabled: false, ...profile } : profile,
      });
    } catch (error) {
      if (isUniqueViolation(error)) return { ok: false, reason: "taken" };
      throw error;
    }
    await recordSecurityEvent(SECURITY_EVENT_KINDS.TELEGRAM_LINKED, { userId, ip: null, userAgent: null, detail: { method: "deep-link", replaced } });
    return { ok: true, userId, userName: user.name, replaced };
  } catch (error) {
    console.error("[telegram] hesab bağlanmadı:", error instanceof Error ? error.name : "unknown");
    return { ok: false, reason: "failed" };
  }
}

/** Sessiya sahibinin təsdiqi ilə ayırma (çağıran action guard-ı keçib). */
export async function unlinkTelegram(userId: string): Promise<boolean> {
  const result = await prisma.telegramAccount.deleteMany({ where: { userId } });
  await prisma.telegramLinkToken.deleteMany({ where: { userId, usedAt: null } });
  if (result.count > 0) await recordSecurityEvent(SECURITY_EVENT_KINDS.TELEGRAM_UNLINKED, { userId, detail: { method: "cabinet" } });
  return result.count > 0;
}

/** Razılıq açarı. Bot bloklanıbsa açmaq mənasızdır — istifadəçi əvvəl botda `/start` yazmalıdır. */
export async function setTelegramNotifications(userId: string, enabled: boolean): Promise<boolean> {
  const result = await prisma.telegramAccount.updateMany({ where: { userId }, data: { notificationsEnabled: enabled } });
  return result.count > 0;
}

/** Baxım: müddəti bitmiş və istifadə olunmuş tokenlər silinir. */
export async function purgeTelegramLinkTokens(now: Date = new Date()): Promise<number> {
  const result = await prisma.telegramLinkToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] } });
  return result.count;
}
