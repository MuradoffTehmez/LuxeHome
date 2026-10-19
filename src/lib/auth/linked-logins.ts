import { prisma } from "@/lib/prisma";
import { isUniqueViolation } from "@/lib/media/upload-record";
import { isSmsConfigured } from "@/lib/sms";
import { localizePath } from "@/i18n/path-locale";
import type { Locale } from "@/lib/constants";
import { recordSecurityEvent } from "@/lib/security/security-events";
import { SECURITY_EVENT_KINDS } from "@/lib/security/security-event-kinds";
import { canUnlinkLogin, linkDecision, linkResultQuery, type LinkOutcome, type LinkableProvider, type LoginMethods } from "./linked-logins-policy";

/**
 * «Bağlı giriş üsulları» (kabinet → Profil): Google (`User.googleSub`), Apple və Facebook (`AuthIdentity`) bağlama/ayırma.
 * Qaydalar `linked-logins-policy.ts`-dədir. Hər bağlama və ayırma təhlükəsizlik jurnalına yazılır.
 */

export type LinkedLoginsView = {
  methods: LoginMethods;
  identities: Partial<Record<"APPLE" | "FACEBOOK", { email: string | null; createdAt: Date; lastUsedAt: Date | null }>>;
};

export async function getLoginMethods(userId: string): Promise<LinkedLoginsView> {
  const [user, identities, telegram] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true, googleSub: true, verifiedPhone: true } }),
    prisma.authIdentity.findMany({ where: { userId }, select: { provider: true, email: true, createdAt: true, lastUsedAt: true } }),
    prisma.telegramAccount.findUnique({ where: { userId }, select: { id: true } }),
  ]);
  const byProvider = Object.fromEntries(identities.map((row) => [row.provider, row]));
  return {
    methods: {
      password: user.passwordHash !== "disabled",
      google: Boolean(user.googleSub),
      apple: Boolean(byProvider.APPLE),
      facebook: Boolean(byProvider.FACEBOOK),
      telegram: Boolean(telegram),
      phone: Boolean(user.verifiedPhone) && isSmsConfigured(),
    },
    identities: Object.fromEntries(
      identities.filter((row) => row.provider === "APPLE" || row.provider === "FACEBOOK").map((row) => [row.provider, { email: row.email, createdAt: row.createdAt, lastUsedAt: row.lastUsedAt }]),
    ),
  };
}

async function recordLink(userId: string, provider: LinkableProvider, kind: "LOGIN_METHOD_LINKED" | "LOGIN_METHOD_UNLINKED") {
  await recordSecurityEvent(SECURITY_EVENT_KINDS[kind], { userId, detail: { provider } });
}

export async function linkGoogleToUser(userId: string, sub: string): Promise<LinkOutcome> {
  try {
    const [holder, user] = await Promise.all([
      prisma.user.findUnique({ where: { googleSub: sub }, select: { id: true } }),
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { googleSub: true } }),
    ]);
    const decision = linkDecision({ userId, holderUserId: holder?.id ?? null, currentSubject: user.googleSub, subject: sub });
    if (decision !== "linked") return decision;
    // Şərti yazı: bu arada başqa Google bağlanıbsa üzərinə yazılmır.
    const updated = await prisma.user.updateMany({ where: { id: userId, googleSub: null }, data: { googleSub: sub } });
    if (updated.count !== 1) return "other";
    await recordLink(userId, "GOOGLE", "LOGIN_METHOD_LINKED");
    return "linked";
  } catch (error) {
    return isUniqueViolation(error) ? "taken" : "failed";
  }
}

export async function linkSocialToUser(userId: string, provider: "APPLE" | "FACEBOOK", claims: { subject: string; email: string | null; emailVerified: boolean }): Promise<LinkOutcome> {
  try {
    const [holder, current] = await Promise.all([
      prisma.authIdentity.findUnique({ where: { provider_subject: { provider, subject: claims.subject } }, select: { userId: true } }),
      prisma.authIdentity.findUnique({ where: { userId_provider: { userId, provider } }, select: { subject: true } }),
    ]);
    const decision = linkDecision({ userId, holderUserId: holder?.userId ?? null, currentSubject: current?.subject ?? null, subject: claims.subject });
    if (decision !== "linked") return decision;
    await prisma.authIdentity.create({ data: { userId, provider, subject: claims.subject, email: claims.email, emailVerified: claims.emailVerified } });
    await recordLink(userId, provider, "LOGIN_METHOD_LINKED");
    return "linked";
  } catch (error) {
    return isUniqueViolation(error) ? "taken" : "failed";
  }
}

export type UnlinkOutcome = "unlinked" | "last-method" | "not-linked";

export async function unlinkLoginMethod(userId: string, provider: LinkableProvider): Promise<UnlinkOutcome> {
  const { methods } = await getLoginMethods(userId);
  const linked = provider === "GOOGLE" ? methods.google : provider === "APPLE" ? methods.apple : methods.facebook;
  if (!linked) return "not-linked";
  if (!canUnlinkLogin(methods, provider)) return "last-method";
  if (provider === "GOOGLE") await prisma.user.update({ where: { id: userId }, data: { googleSub: null } });
  else await prisma.authIdentity.deleteMany({ where: { userId, provider } });
  await recordLink(userId, provider, "LOGIN_METHOD_UNLINKED");
  return "unlinked";
}

export function linkReturnPath(provider: LinkableProvider, outcome: LinkOutcome, locale: Locale): string {
  return `${localizePath("/kabinet/profil", locale)}?${linkResultQuery(provider, outcome)}#giris-usullari`;
}
