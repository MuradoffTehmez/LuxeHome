import { prisma } from "@/lib/prisma";
import { isUniqueViolation } from "@/lib/media/upload-record";
import { sha256Hex } from "@/lib/auth/crypto";
import { ACCOUNT_TYPES, ROLES } from "@/lib/constants";
import { composeName } from "@/lib/accounts/profile-fields";
import { recordSecurityEvent } from "@/lib/security/security-events";
import { SECURITY_EVENT_KINDS } from "@/lib/security/security-event-kinds";
import { randomLinkToken } from "./linking";
import { LINK_TOKEN_PURPOSES, SIGNUP_TOKEN_TTL_MS } from "./policy";

/**
 * Telegram ilə yeni hesab. Telegram e-poçt vermir, saxta/təsdiqlənməmiş e-poçtla hesab yaratmaq isə ünvanın əsl
 * sahibini kənarda qoyardı (pre-hijacking). Ona görə hesab **yalnız e-poçt təsdiqindən sonra** yaranır:
 *
 * 1. OIDC callback-i təsdiqlənmiş Telegram kimliyini imzalı cookie-yə yazır, istifadəçi ad və e-poçt daxil edir.
 * 2. `issueTelegramSignup()` birdəfəlik token (`SIGNUP`, 30 dəq) yaradır və kimliyi + forma dəyərlərini sətrin
 *    `payload`-ına yazır; link e-poçta gedir.
 * 3. Linki açan şəxs (yəni ünvanın sahibi) «Təsdiqlə» düyməsini seçir — `completeTelegramSignup()` tokeni şərti
 *    götürür, hesabı `emailVerifiedAt` ilə yaradır və Telegram kimliyini bağlayır. GET linki tokeni istifadə etmir —
 *    poçt skanerləri linki açsa da hesab yaranmır.
 */

export type SignupPayload = {
  telegramUserId: string;
  sub: string;
  username: string | null;
  botAccess: boolean;
  firstName: string;
  lastName: string;
  email: string;
  locale: string;
  next?: string;
};

export type IssueSignupResult = { ok: true; token: string } | { ok: false; reason: "email-taken" | "telegram-taken" };

export async function issueTelegramSignup(payload: SignupPayload, now: Date = new Date()): Promise<IssueSignupResult> {
  const [emailOwner, telegramOwner] = await Promise.all([
    prisma.user.findUnique({ where: { email: payload.email }, select: { id: true } }),
    prisma.telegramAccount.findUnique({ where: { telegramUserId: payload.telegramUserId }, select: { id: true } }),
  ]);
  if (telegramOwner) return { ok: false, reason: "telegram-taken" };
  if (emailOwner) return { ok: false, reason: "email-taken" };
  const token = randomLinkToken();
  await prisma.telegramLinkToken.create({
    data: {
      tokenHash: await sha256Hex(token),
      purpose: LINK_TOKEN_PURPOSES.SIGNUP,
      payload: JSON.stringify(payload),
      expiresAt: new Date(now.getTime() + SIGNUP_TOKEN_TTL_MS),
    },
  });
  return { ok: true, token };
}

function parsePayload(raw: string | null): SignupPayload | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<SignupPayload>;
    if (typeof value.telegramUserId !== "string" || typeof value.sub !== "string" || typeof value.email !== "string") return null;
    if (typeof value.firstName !== "string" || typeof value.lastName !== "string") return null;
    return {
      telegramUserId: value.telegramUserId,
      sub: value.sub,
      username: typeof value.username === "string" ? value.username : null,
      botAccess: value.botAccess === true,
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      locale: typeof value.locale === "string" ? value.locale : "az",
      next: typeof value.next === "string" ? value.next : undefined,
    };
  } catch {
    return null;
  }
}

/** Tokenin hələ etibarlı olduğunu yoxlayır (təsdiq səhifəsi üçün, tokeni istifadə etmədən). */
export async function peekTelegramSignup(token: string, now: Date = new Date()): Promise<{ email: string } | null> {
  if (!/^[A-Za-z0-9_-]{32,60}$/.test(token)) return null;
  const record = await prisma.telegramLinkToken.findUnique({ where: { tokenHash: await sha256Hex(token) }, select: { purpose: true, usedAt: true, expiresAt: true, payload: true } });
  if (!record || record.purpose !== LINK_TOKEN_PURPOSES.SIGNUP || record.usedAt || record.expiresAt <= now) return null;
  const payload = parsePayload(record.payload);
  return payload ? { email: payload.email } : null;
}

export type CompleteSignupResult =
  | { ok: true; userId: string; next?: string; locale: string }
  | { ok: false; reason: "expired" | "email-taken" | "telegram-taken" | "failed" };

export async function completeTelegramSignup(token: string, now: Date = new Date()): Promise<CompleteSignupResult> {
  if (!/^[A-Za-z0-9_-]{32,60}$/.test(token)) return { ok: false, reason: "expired" };
  const record = await prisma.telegramLinkToken.findUnique({ where: { tokenHash: await sha256Hex(token) }, select: { id: true, purpose: true, usedAt: true, expiresAt: true, payload: true } });
  if (!record || record.purpose !== LINK_TOKEN_PURPOSES.SIGNUP || record.usedAt || record.expiresAt <= now) return { ok: false, reason: "expired" };
  const payload = parsePayload(record.payload);
  if (!payload) return { ok: false, reason: "expired" };

  const claimed = await prisma.telegramLinkToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: now, payload: null } });
  if (claimed.count !== 1) return { ok: false, reason: "expired" };

  if (await prisma.telegramAccount.findUnique({ where: { telegramUserId: payload.telegramUserId }, select: { id: true } })) return { ok: false, reason: "telegram-taken" };

  let userId: string;
  try {
    const user = await prisma.user.create({
      data: {
        name: composeName(payload.firstName, payload.lastName),
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        // Parolsuz hesab: «disabled» heç bir parola uyğun gəlmir; sonradan «Parolu unutdum» ilə qurula bilər.
        passwordHash: "disabled",
        accountType: ACCOUNT_TYPES.USER,
        role: ROLES.EDITOR,
        isActive: true,
        themePreference: "light",
        mustChangePassword: false,
        locale: payload.locale,
        // Link bu ünvana göndərilib və sahibi onu açıb — e-poçt təsdiqlənib.
        emailVerifiedAt: now,
      },
      select: { id: true },
    });
    userId = user.id;
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: "email-taken" };
    return { ok: false, reason: "failed" };
  }

  try {
    await prisma.telegramAccount.create({
      data: {
        userId,
        telegramUserId: payload.telegramUserId,
        oidcSub: payload.sub,
        username: payload.username,
        // Şəxsi çatın ID-si istifadəçi ID-si ilə eynidir; bot yalnız `telegram:bot_access` razılığı ilə yaza bilər.
        chatId: payload.botAccess ? payload.telegramUserId : null,
        botAccess: payload.botAccess,
      },
    });
  } catch (error) {
    // D1-də tranzaksiya yoxdur — kimlik bu arada başqa hesaba bağlanıbsa yeni hesab geri silinir.
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    return { ok: false, reason: isUniqueViolation(error) ? "telegram-taken" : "failed" };
  }
  await recordSecurityEvent(SECURITY_EVENT_KINDS.TELEGRAM_LINKED, { userId, detail: { method: "signup" } });
  return { ok: true, userId, next: payload.next, locale: payload.locale };
}
