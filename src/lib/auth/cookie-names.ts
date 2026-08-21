/**
 * Cookie adları ayrıca fayldadır ki, `middleware.ts` onları `next/headers`-dən
 * asılı olan `cookies.ts` modulunu yükləmədən oxuya bilsin — middleware edge
 * runtime-ında işləyir və `next/headers` orada mövcud deyil.
 */

export const SESSION_COOKIE = "lhe_session";
export const STAGE_COOKIE = "lhe_2fa";

/** JWT `iss`/`sub` dəyərləri — imza yoxlaması middleware-də də aparılır. */
export const TOKEN_ISSUER = "luxehomeestate";
export const SESSION_SUBJECT = "session";
export const STAGE_SUBJECT = "stage";
