import { canUsePublicSignIn } from "./public-account-policy";

export const TELEGRAM_ISSUER = "https://oauth.telegram.org";

/**
 * Telegram ilə girişin hesab qərarları — saf funksiya, D1 olmadan test olunur.
 *
 * Qaydalar:
 * - Kimlik **dəyişməz** Telegram ID-sidir (`id` iddiası, webhook-dakı `from.id` ilə eyni) və OIDC `sub`-dır — istifadəçi
 *   adı, ad və şəkil heç vaxt hesab tapmaq və ya birləşdirmək üçün işlənmir.
 * - Telegram e-poçt vermir, ona görə mövcud hesaba avtomatik bağlama **yoxdur**: tanınmayan kimlik yeni hesab
 *   axınına (`ONBOARD`, e-poçt təsdiqi ilə) gedir; mövcud hesab sahibi Telegram-ı kabinetdən bağlayır.
 * - Əməkdaş hesabı Telegram ilə açılmır (panel məcburi TOTP tələb edir); deaktiv, silinmədə olan və kilidli hesab rədd olunur.
 * - `sub` və Telegram ID iki fərqli hesabı göstərirsə giriş rədd olunur (ziddiyyət).
 */

export type TelegramOidcIdentity = {
  /** OIDC `sub`. */
  sub: string;
  /** Rəqəmli Telegram ID mətn kimi. `id` iddiası yoxdursa `sub` rəqəmdirsə ondan götürülür. */
  telegramUserId: string;
  name: string | null;
  username: string | null;
};

export function telegramIdentityFromClaims(payload: Record<string, unknown>): TelegramOidcIdentity | null {
  const sub = typeof payload.sub === "string" && payload.sub ? payload.sub : typeof payload.sub === "number" ? String(payload.sub) : null;
  if (!sub) return null;
  const rawId = payload.id ?? (/^\d{1,20}$/.test(sub) ? sub : null);
  const telegramUserId = typeof rawId === "number" && Number.isSafeInteger(rawId) && rawId > 0 ? String(rawId) : typeof rawId === "string" && /^\d{1,20}$/.test(rawId) ? rawId : null;
  if (!telegramUserId) return null;
  const name = typeof payload.name === "string" && payload.name.trim()
    ? payload.name.trim().slice(0, 120)
    : [payload.given_name, payload.family_name].filter((part) => typeof part === "string" && part.trim()).join(" ").slice(0, 120) || null;
  const username = typeof payload.preferred_username === "string" && /^[A-Za-z0-9_]{3,32}$/.test(payload.preferred_username) ? payload.preferred_username : null;
  return { sub, telegramUserId, name, username };
}

type LinkedUser = {
  userId: string;
  accountType: string;
  isActive: boolean;
  lockedUntil: Date | null;
  deletionRequestedAt: Date | null;
};

export type TelegramLoginDecision =
  | { action: "SIGN_IN"; userId: string; storeSub: boolean }
  | { action: "ONBOARD" }
  | { action: "REJECT"; reason: "STAFF" | "INACTIVE" | "LOCKED" | "CONFLICT" };

function blocked(user: LinkedUser, now: Date): TelegramLoginDecision | null {
  if (!canUsePublicSignIn(user.accountType)) return { action: "REJECT", reason: "STAFF" };
  if (!user.isActive || user.deletionRequestedAt) return { action: "REJECT", reason: "INACTIVE" };
  if (user.lockedUntil && user.lockedUntil > now) return { action: "REJECT", reason: "LOCKED" };
  return null;
}

export function telegramLoginDecision(input: {
  bySub: (LinkedUser & { oidcSub: string | null }) | null;
  byTelegramId: (LinkedUser & { oidcSub: string | null }) | null;
  sub: string;
  now: Date;
}): TelegramLoginDecision {
  const { bySub, byTelegramId, now } = input;
  if (bySub && byTelegramId && bySub.userId !== byTelegramId.userId) return { action: "REJECT", reason: "CONFLICT" };
  const found = bySub ?? byTelegramId;
  if (!found) return { action: "ONBOARD" };
  // Hesabda başqa OIDC kimliyi yazılıbsa (eyni Telegram ID, fərqli `sub`) — ziddiyyət, avtomatik əvəzlənmir.
  if (found.oidcSub && found.oidcSub !== input.sub) return { action: "REJECT", reason: "CONFLICT" };
  return blocked(found, now) ?? { action: "SIGN_IN", userId: found.userId, storeSub: found.oidcSub === null };
}

/**
 * ID tokenin iddialarını yoxlayır. `aud` Telegram-da bot ID-sidir və rəqəm kimi də gələ bilər, ona görə `jose`-nin
 * sətir müqayisəsi əvəzinə mətnə çevrilib müqayisə olunur. `nonce` göndərilib — tokendə varsa uyğun olmalıdır; state
 * və PKCE verifier ilə birlikdə təkrar istifadəni bağlayır.
 */
export function validateTelegramClaims(payload: Record<string, unknown>, input: { clientId: string; nonce: string; now: Date }): TelegramOidcIdentity | null {
  if (payload.iss !== TELEGRAM_ISSUER) return null;
  const audiences = Array.isArray(payload.aud) ? payload.aud.map(String) : payload.aud == null ? [] : [String(payload.aud)];
  if (!audiences.includes(input.clientId)) return null;
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= input.now.getTime()) return null;
  if (payload.nonce !== undefined && payload.nonce !== input.nonce) return null;
  return telegramIdentityFromClaims(payload);
}
