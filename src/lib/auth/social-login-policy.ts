import { canUsePublicSignIn } from "./public-account-policy";

/**
 * Apple və Facebook ilə girişin hesab qərarları — saf funksiya, D1 olmadan test olunur. Google qaydalarının
 * (`google-login-policy.ts`) ümumiləşdirilmiş forması:
 *
 * - Kimlik provayderin dəyişməz `sub`/ID-sidir; ad, şəkil və istifadəçi adı hesab tapmaq üçün işlənmir.
 * - Mövcud hesaba e-poçt üzrə bağlama **yalnız provayder e-poçtu təsdiqləyibsə** (Apple). Təsdiqlənməmiş hesaba
 *   bağlananda parol ləğv olunur (pre-hijacking — Google ilə eyni qayda).
 * - E-poçtu təsdiq bayrağı ilə gəlməyən provayder (Facebook): mövcud e-poçta bağlanmır; yeni hesab yalnız e-poçta
 *   göndərilən linkdən sonra yaranır (`CONFIRM_EMAIL`).
 * - Əməkdaş, deaktiv, silinmədə olan və kilidli hesab rədd olunur; hesabda eyni provayderin başqa kimliyi varsa da.
 */

export const SOCIAL_PROVIDERS = { APPLE: "APPLE", FACEBOOK: "FACEBOOK" } as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[keyof typeof SOCIAL_PROVIDERS];

export type SocialClaims = { subject: string; email: string | null; emailVerified: boolean; name: string | null };

type ExistingUser = {
  id: string;
  accountType: string;
  isActive: boolean;
  lockedUntil: Date | null;
  emailVerifiedAt: Date | null;
  deletionRequestedAt: Date | null;
};

export type SocialLinkDecision =
  | { action: "SIGN_IN"; userId: string }
  | { action: "LINK"; userId: string; revokePassword: boolean }
  | { action: "CREATE" }
  | { action: "CONFIRM_EMAIL" }
  | { action: "REJECT"; reason: "NO_EMAIL" | "STAFF" | "INACTIVE" | "LOCKED" | "EMAIL_EXISTS" | "OTHER_IDENTITY" };

function blocked(user: ExistingUser, now: Date): SocialLinkDecision | null {
  if (!canUsePublicSignIn(user.accountType)) return { action: "REJECT", reason: "STAFF" };
  if (!user.isActive || user.deletionRequestedAt) return { action: "REJECT", reason: "INACTIVE" };
  if (user.lockedUntil && user.lockedUntil > now) return { action: "REJECT", reason: "LOCKED" };
  return null;
}

export function socialLinkDecision(input: {
  claims: SocialClaims;
  /** Bu provayder kimliyinə bağlı hesab. */
  bySubject: ExistingUser | null;
  /** Eyni e-poçtlu hesab (e-poçt yoxdursa `null`). */
  byEmail: ExistingUser | null;
  /** `byEmail` hesabında eyni provayderin **başqa** kimliyi var. */
  byEmailHasOtherIdentity: boolean;
  now: Date;
}): SocialLinkDecision {
  const { claims, bySubject, byEmail, now } = input;
  if (bySubject) return blocked(bySubject, now) ?? { action: "SIGN_IN", userId: bySubject.id };
  if (!claims.email) return { action: "REJECT", reason: "NO_EMAIL" };
  if (!claims.emailVerified) return byEmail ? { action: "REJECT", reason: "EMAIL_EXISTS" } : { action: "CONFIRM_EMAIL" };
  if (!byEmail) return { action: "CREATE" };
  const block = blocked(byEmail, now);
  if (block) return block;
  if (input.byEmailHasOtherIdentity) return { action: "REJECT", reason: "OTHER_IDENTITY" };
  return { action: "LINK", userId: byEmail.id, revokePassword: byEmail.emailVerifiedAt === null };
}

/** Apple `email_verified` sətir (`"true"`) və ya boolean gəlir. */
export function appleEmailVerified(value: unknown): boolean {
  return value === true || value === "true";
}

/** Callback-də giriş səhifəsinə qaytarılan ümumi səbəb kodu — hansı hesabın mövcud olduğu sızdırılmır. */
export function socialFailureCode(reason: Extract<SocialLinkDecision, { action: "REJECT" }>["reason"]): string {
  switch (reason) {
    case "STAFF":
      return "emekdas";
    case "NO_EMAIL":
      return "epost";
    case "EMAIL_EXISTS":
      return "movcud";
    default:
      return "hesab";
  }
}

/** Apple-ın ilk icazədə göndərdiyi `user` JSON-u: `{ name: { firstName, lastName } }`. Pozulmuşsa `null`. */
export function appleUserName(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string" || raw.length > 2000) return null;
  try {
    const value = JSON.parse(raw) as { name?: { firstName?: unknown; lastName?: unknown } };
    const parts = [value.name?.firstName, value.name?.lastName].filter((part): part is string => typeof part === "string" && part.trim().length > 0);
    return parts.length ? parts.join(" ").trim().slice(0, 120) : null;
  } catch {
    return null;
  }
}

/** ID token iddialarını yoxlanılmış payload-dan çıxarır (imza/issuer/audience `jwtVerify`-dadır). */
export function appleClaimsFromPayload(payload: Record<string, unknown>, nonce: string): Omit<SocialClaims, "name"> | null {
  if (payload.nonce !== nonce || typeof payload.sub !== "string" || !payload.sub) return null;
  const email = typeof payload.email === "string" && payload.email.includes("@") ? payload.email.trim().toLowerCase() : null;
  return { subject: payload.sub, email, emailVerified: email !== null && appleEmailVerified(payload.email_verified) };
}

/** Graph API cavabı → iddialar. ID yalnız rəqəmlərdir; e-poçt həmişə təsdiqlənməmiş sayılır. */
export function facebookClaimsFromProfile(profile: { id?: unknown; name?: unknown; email?: unknown }): SocialClaims | null {
  const subject = typeof profile.id === "string" && /^\d{1,32}$/.test(profile.id) ? profile.id : null;
  if (!subject) return null;
  const email = typeof profile.email === "string" && profile.email.includes("@") ? profile.email.trim().toLowerCase() : null;
  const name = typeof profile.name === "string" && profile.name.trim() ? profile.name.trim().slice(0, 120) : null;
  return { subject, email, emailVerified: false, name };
}
