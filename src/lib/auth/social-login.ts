import { prisma } from "@/lib/prisma";
import { isUniqueViolation } from "@/lib/media/upload-record";
import { ACCOUNT_TYPES, ROLES, type Locale } from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";
import { siteUrl } from "@/config/site";
import { sendEmail } from "@/lib/email";
import { emailHref, escapeHtml } from "@/lib/email-html";
import { sha256Hex, toBase64Url } from "./crypto";
import { openPublicSession } from "./public-session";
import { revokeAllSessions } from "./session";
import { safePublicTarget } from "./public-account-policy";
import { socialFailureCode, socialLinkDecision, type SocialClaims, type SocialProvider } from "./social-login-policy";

/**
 * Apple və Facebook callback-lərinin ortaq hissəsi: bazadan oxu → `socialLinkDecision()` → tətbiq. Nəticə yönləndirmə
 * ünvanıdır (uğur — kabinet və ya `davam`, uğursuzluq — giriş səhifəsi ümumi səbəb kodu ilə). Heç bir yerdə hansı
 * hesabın mövcud olduğu açıq yazılmır.
 */

const USER_SELECT = { id: true, accountType: true, isActive: true, lockedUntil: true, emailVerifiedAt: true, deletionRequestedAt: true } as const;
const SIGNUP_TTL_MS = 30 * 60 * 1000;

export const PROVIDER_QUERY: Record<SocialProvider, string> = { APPLE: "apple", FACEBOOK: "facebook" };

export function socialFailurePath(provider: SocialProvider, code: string, locale: Locale): string {
  return localizePath(`/daxil-ol?${PROVIDER_QUERY[provider]}=${code}`, locale);
}

async function createSocialUser(provider: SocialProvider, claims: SocialClaims & { email: string }, locale: Locale, now: Date): Promise<string | null> {
  let userId: string;
  try {
    const user = await prisma.user.create({
      data: {
        name: claims.name ?? claims.email.split("@")[0],
        email: claims.email,
        // Parolsuz hesab: «disabled» heç bir parola uyğun gəlmir; sonradan «Parolu unutdum» ilə qurula bilər.
        passwordHash: "disabled",
        accountType: ACCOUNT_TYPES.USER,
        role: ROLES.EDITOR,
        isActive: true,
        themePreference: "light",
        mustChangePassword: false,
        locale,
        emailVerifiedAt: now,
      },
      select: { id: true },
    });
    userId = user.id;
  } catch {
    return null;
  }
  try {
    await prisma.authIdentity.create({ data: { userId, provider, subject: claims.subject, email: claims.email, emailVerified: true, lastUsedAt: now } });
  } catch {
    // D1-də tranzaksiya yoxdur: kimlik bu arada başqa hesaba bağlanıbsa yeni hesab geri silinir.
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    return null;
  }
  return userId;
}

/** Facebook kimi təsdiqsiz e-poçtda: birdəfəlik link e-poçta gedir, hesab yalnız ünvan sahibi təsdiqləyəndə yaranır. */
async function issueSocialSignup(provider: SocialProvider, claims: SocialClaims & { email: string }, locale: Locale, next: string | undefined, now: Date): Promise<boolean> {
  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  await prisma.oAuthSignupToken.create({
    data: {
      tokenHash: await sha256Hex(token),
      provider,
      payload: JSON.stringify({ subject: claims.subject, email: claims.email, name: claims.name, locale, next }),
      expiresAt: new Date(now.getTime() + SIGNUP_TTL_MS),
    },
  });
  const copy = SIGNUP_COPY[locale];
  const url = siteUrl(`${localizePath("/hesab/sosial-tesdiq", locale)}?token=${encodeURIComponent(token)}`);
  const result = await sendEmail({
    to: claims.email,
    subject: copy.subject,
    html: `<p>${escapeHtml(copy.text)}</p><p><a href="${emailHref(url)}">${escapeHtml(copy.button)}</a></p><p>${escapeHtml(copy.ignore)}</p>`,
  }).catch(() => null);
  return Boolean(result && "success" in result && result.success);
}

const SIGNUP_COPY: Record<Locale, { subject: string; text: string; button: string; ignore: string }> = {
  az: { subject: "Luxe Home Estate qeydiyyatını tamamlayın", text: "Hesabınızı Facebook ilə yaratmaq üçün e-poçtunuzu təsdiqləyin. Link 30 dəqiqə etibarlıdır.", button: "Qeydiyyatı tamamla", ignore: "Bu sorğunu siz etməmisinizsə, məktubu nəzərə almayın." },
  en: { subject: "Complete your Luxe Home Estate sign-up", text: "Confirm your email to create your account with Facebook. The link is valid for 30 minutes.", button: "Complete sign-up", ignore: "If you did not request this, you can ignore this email." },
  ru: { subject: "Завершите регистрацию в Luxe Home Estate", text: "Подтвердите e-mail, чтобы создать аккаунт через Facebook. Ссылка действует 30 минут.", button: "Завершить регистрацию", ignore: "Если вы не отправляли этот запрос, проигнорируйте письмо." },
};

export async function completeSocialLogin(input: {
  provider: SocialProvider;
  claims: SocialClaims;
  locale: Locale;
  next?: string;
  now?: Date;
}): Promise<string> {
  const { provider, claims, locale } = input;
  const now = input.now ?? new Date();
  const fail = (code: string) => socialFailurePath(provider, code, locale);

  const [identity, byEmail] = await Promise.all([
    prisma.authIdentity.findUnique({ where: { provider_subject: { provider, subject: claims.subject } }, select: { user: { select: USER_SELECT } } }),
    claims.email ? prisma.user.findUnique({ where: { email: claims.email }, select: { ...USER_SELECT, authIdentities: { where: { provider }, select: { subject: true } } } }) : null,
  ]);
  const decision = socialLinkDecision({
    claims,
    bySubject: identity?.user ?? null,
    byEmail,
    byEmailHasOtherIdentity: Boolean(byEmail?.authIdentities.some((row) => row.subject !== claims.subject)),
    now,
  });

  let userId: string;
  switch (decision.action) {
    case "REJECT":
      return fail(socialFailureCode(decision.reason));
    case "CONFIRM_EMAIL":
      if (!claims.email) return fail("epost");
      return (await issueSocialSignup(provider, { ...claims, email: claims.email }, locale, input.next, now))
        ? `${localizePath("/hesab/e-poct-gonderildi", locale)}?sosial=1`
        : fail("xeta");
    case "SIGN_IN":
      userId = decision.userId;
      await prisma.authIdentity.update({ where: { provider_subject: { provider, subject: claims.subject } }, data: { lastUsedAt: now } }).catch(() => undefined);
      break;
    case "LINK":
      try {
        await prisma.authIdentity.create({ data: { userId: decision.userId, provider, subject: claims.subject, email: claims.email, emailVerified: true, lastUsedAt: now } });
      } catch (error) {
        return fail(isUniqueViolation(error) ? "hesab" : "xeta");
      }
      await prisma.user.update({
        where: { id: decision.userId },
        data: {
          emailVerifiedAt: byEmail?.emailVerifiedAt ?? now,
          // Təsdiqlənməmiş hesabın parolu başqasına məxsus ola bilər — ləğv olunur (Google ilə eyni qayda).
          ...(decision.revokePassword ? { passwordHash: "disabled" } : {}),
        },
      });
      if (decision.revokePassword) await revokeAllSessions(decision.userId);
      userId = decision.userId;
      break;
    case "CREATE": {
      if (!claims.email) return fail("epost");
      const created = await createSocialUser(provider, { ...claims, email: claims.email }, locale, now);
      if (!created) return fail("xeta");
      userId = created;
      break;
    }
  }

  if (!(await openPublicSession(userId))) return fail("emekdas");
  return safePublicTarget(input.next) ?? localizePath("/kabinet", locale);
}

export type SocialSignupPayload = { subject: string; email: string; name: string | null; locale: string; next?: string };

async function readSignupToken(token: string, now: Date) {
  if (!/^[A-Za-z0-9_-]{32,60}$/.test(token)) return null;
  const record = await prisma.oAuthSignupToken.findUnique({ where: { tokenHash: await sha256Hex(token) }, select: { id: true, provider: true, payload: true, usedAt: true, expiresAt: true } });
  if (!record || record.usedAt || record.expiresAt <= now || !record.payload) return null;
  try {
    const payload = JSON.parse(record.payload) as SocialSignupPayload;
    if (typeof payload.subject !== "string" || typeof payload.email !== "string") return null;
    return { ...record, payload };
  } catch {
    return null;
  }
}

/** Təsdiq səhifəsi üçün — tokeni istifadə etmədən yoxlayır. */
export async function peekSocialSignup(token: string, now: Date = new Date()): Promise<{ email: string; provider: string } | null> {
  const record = await readSignupToken(token, now);
  return record ? { email: record.payload.email, provider: record.provider } : null;
}

export type SocialSignupResult = { ok: true; target: string } | { ok: false; reason: "expired" | "email-taken" | "identity-taken" | "failed" };

/** Təsdiq düyməsi (POST): token şərti götürülür, hesab təsdiqlənmiş e-poçtla yaranır, kimlik bağlanır, sessiya açılır. */
export async function completeSocialSignup(token: string, now: Date = new Date()): Promise<SocialSignupResult> {
  const record = await readSignupToken(token, now);
  if (!record) return { ok: false, reason: "expired" };
  const claimed = await prisma.oAuthSignupToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: now, payload: null } });
  if (claimed.count !== 1) return { ok: false, reason: "expired" };
  const provider = record.provider as SocialProvider;
  const { payload } = record;
  const locale = (payload.locale === "en" || payload.locale === "ru" ? payload.locale : "az") as Locale;

  const [emailOwner, identity] = await Promise.all([
    prisma.user.findUnique({ where: { email: payload.email }, select: { id: true } }),
    prisma.authIdentity.findUnique({ where: { provider_subject: { provider, subject: payload.subject } }, select: { id: true } }),
  ]);
  if (emailOwner) return { ok: false, reason: "email-taken" };
  if (identity) return { ok: false, reason: "identity-taken" };
  const userId = await createSocialUser(provider, { subject: payload.subject, email: payload.email, emailVerified: true, name: payload.name }, locale, now);
  if (!userId) return { ok: false, reason: "failed" };
  if (!(await openPublicSession(userId))) return { ok: false, reason: "failed" };
  return { ok: true, target: safePublicTarget(payload.next) ?? localizePath("/kabinet", locale) };
}

/** Baxım: müddəti bitmiş və istifadə olunmuş qeydiyyat tokenləri silinir. */
export async function purgeOAuthSignupTokens(now: Date = new Date()): Promise<number> {
  const result = await prisma.oAuthSignupToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] } });
  return result.count;
}
