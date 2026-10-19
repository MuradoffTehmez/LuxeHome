/**
 * Cookie adları ayrıca fayldadır ki, `middleware.ts` onları `next/headers`-dən
 * asılı olan `cookies.ts` modulunu yükləmədən oxuya bilsin — middleware edge
 * runtime-ında işləyir və `next/headers` orada mövcud deyil.
 */

export const SESSION_COOKIE = "lhe_session";
export const STAGE_COOKIE = "lhe_2fa";
/** WebAuthn challenge-i (#109) — qısaömürlü, yalnız passkey mərasimi üçün. */
export const WEBAUTHN_COOKIE = "lhe_webauthn";
/** Google OAuth axınının state/PKCE/nonce dəyərləri (#109) — yalnız `/api/auth/google` altında. */
export const OAUTH_COOKIE = "lhe_oauth";
/** Telegram Login (OIDC) axınının state/PKCE/nonce dəyərləri — yalnız `/api/auth/telegram` altında. */
export const TELEGRAM_OAUTH_COOKIE = "lhe_tg_oauth";
/** Telegram ilə ilk giriş: təsdiqlənmiş Telegram kimliyi e-poçt formasına qədər (15 dəq) imzalı saxlanılır. */
export const TELEGRAM_PENDING_COOKIE = "lhe_tg_pending";
/** Apple və Facebook axınlarının state/PKCE/nonce dəyərləri — yalnız öz `/api/auth/<provayder>` yolunda. */
export const APPLE_OAUTH_COOKIE = "lhe_apple_oauth";
export const FACEBOOK_OAUTH_COOKIE = "lhe_fb_oauth";

/** JWT `iss`/`sub` dəyərləri — imza yoxlaması middleware-də də aparılır. */
export const TOKEN_ISSUER = "luxehomeestate";
export const SESSION_SUBJECT = "session";
export const STAGE_SUBJECT = "stage";
export const WEBAUTHN_SUBJECT = "webauthn";
export const OAUTH_SUBJECT = "oauth";
export const TELEGRAM_OAUTH_SUBJECT = "telegram-oauth";
export const TELEGRAM_PENDING_SUBJECT = "telegram-pending";
export const APPLE_OAUTH_SUBJECT = "apple-oauth";
export const FACEBOOK_OAUTH_SUBJECT = "facebook-oauth";
