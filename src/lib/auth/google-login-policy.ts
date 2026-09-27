import { canUsePublicSignIn } from "./public-account-policy";

/**
 * Google ilə girişin hesab bağlama qərarları (#109) — saf funksiya, D1 olmadan test olunur.
 *
 * Qaydalar:
 * - Əməkdaş hesabı heç vaxt Google ilə açılmır: panel məcburi TOTP tələb edir.
 * - Google yalnız **təsdiqlənmiş** e-poçtu hesaba bağlaya bilər (`email_verified`).
 * - E-poçtu təsdiqlənməmiş mövcud hesaba bağlananda parol **ləğv olunur**: kimsə başqasının
 *   ünvanı ilə əvvəlcədən qeydiyyatdan keçibsə (pre-hijacking), onun parolu işləməz qalır.
 * - Hesab başqa Google kimliyinə bağlıdırsa, eyni e-poçtla ikinci kimlik bağlanmır.
 */

export type GoogleClaims = { sub: string; email: string; emailVerified: boolean };

type ExistingUser = {
  id: string;
  accountType: string;
  isActive: boolean;
  lockedUntil: Date | null;
  googleSub: string | null;
  emailVerifiedAt: Date | null;
  deletionRequestedAt: Date | null;
};

export type GoogleLinkDecision =
  | { action: "SIGN_IN"; userId: string }
  | { action: "LINK"; userId: string; revokePassword: boolean }
  | { action: "CREATE" }
  | { action: "REJECT"; reason: "UNVERIFIED_EMAIL" | "STAFF" | "INACTIVE" | "LOCKED" | "OTHER_GOOGLE_ACCOUNT" };

function blocked(user: ExistingUser, now: Date): GoogleLinkDecision | null {
  if (!canUsePublicSignIn(user.accountType)) return { action: "REJECT", reason: "STAFF" };
  if (!user.isActive || user.deletionRequestedAt) return { action: "REJECT", reason: "INACTIVE" };
  if (user.lockedUntil && user.lockedUntil > now) return { action: "REJECT", reason: "LOCKED" };
  return null;
}

export function googleLinkDecision(input: {
  claims: GoogleClaims;
  bySub: ExistingUser | null;
  byEmail: ExistingUser | null;
  now: Date;
}): GoogleLinkDecision {
  const { claims, bySub, byEmail, now } = input;
  if (bySub) return blocked(bySub, now) ?? { action: "SIGN_IN", userId: bySub.id };
  if (!claims.emailVerified) return { action: "REJECT", reason: "UNVERIFIED_EMAIL" };
  if (!byEmail) return { action: "CREATE" };
  const block = blocked(byEmail, now);
  if (block) return block;
  if (byEmail.googleSub && byEmail.googleSub !== claims.sub) return { action: "REJECT", reason: "OTHER_GOOGLE_ACCOUNT" };
  return { action: "LINK", userId: byEmail.id, revokePassword: byEmail.emailVerifiedAt === null };
}
