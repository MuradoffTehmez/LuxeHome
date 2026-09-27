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

/** JWT `iss`/`sub` dəyərləri — imza yoxlaması middleware-də də aparılır. */
export const TOKEN_ISSUER = "luxehomeestate";
export const SESSION_SUBJECT = "session";
export const STAGE_SUBJECT = "stage";
export const WEBAUTHN_SUBJECT = "webauthn";
export const OAUTH_SUBJECT = "oauth";
