import { cookies } from "next/headers";
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { createRemoteJWKSet } from "jose/jwks/remote";
import { runtimeEnv } from "@/lib/runtime-env";
import { siteUrl } from "@/config/site";
import { toBase64Url } from "./crypto";
import {
  TELEGRAM_OAUTH_COOKIE,
  TELEGRAM_OAUTH_SUBJECT,
  TELEGRAM_PENDING_COOKIE,
  TELEGRAM_PENDING_SUBJECT,
  TOKEN_ISSUER,
} from "./cookie-names";
import { TELEGRAM_ISSUER, validateTelegramClaims, type TelegramOidcIdentity } from "./telegram-login-policy";

/**
 * Telegram ilə giriş — rəsmi OpenID Connect (https://core.telegram.org/bots/telegram-login):
 * Authorization Code + PKCE S256 + `state` + `nonce`, ID token serverdə Telegram-ın JWKS açarları ilə yoxlanılır
 * (`iss = https://oauth.telegram.org`, `aud` = bot ID / `TELEGRAM_CLIENT_ID`, `exp`). Telegram-da UserInfo endpoint-i
 * yoxdur — profil ID tokendədir. `TELEGRAM_CLIENT_ID`/`TELEGRAM_CLIENT_SECRET` olmayanda funksiya tam söndürülüdür.
 *
 * Google axını (`google-oauth.ts`) ilə eyni quruluş: state/verifier/nonce imzalı, 10 dəqiqəlik, yalnız
 * `/api/auth/telegram` yolunda görünən cookie-dədir və callback-də dərhal silinir.
 */

const AUTHORIZE_URL = "https://oauth.telegram.org/auth";
const TOKEN_URL = "https://oauth.telegram.org/token";
const JWKS_URL = new URL("https://oauth.telegram.org/.well-known/jwks.json");
/** `telegram:bot_access` — girişdən sonra botun istifadəçiyə yaza bilməsi üçün razılıq (bildirişlər yenə ayrıca açılır). */
const SCOPE = "openid profile telegram:bot_access";
const FLOW_SECONDS = 10 * 60;
const PENDING_SECONDS = 15 * 60;
const TIMEOUT_MS = 8000;
const COOKIE_PATH = "/api/auth/telegram";

export const TELEGRAM_CALLBACK_PATH = "/api/auth/telegram/callback";

export function isTelegramLoginConfigured(): boolean {
  return Boolean(runtimeEnv("TELEGRAM_CLIENT_ID") && runtimeEnv("TELEGRAM_CLIENT_SECRET"));
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET təyin edilməyib");
  return new TextEncoder().encode(secret);
}

const randomToken = () => toBase64Url(crypto.getRandomValues(new Uint8Array(32)));

async function pkceChallenge(verifier: string): Promise<string> {
  return toBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
}

export type TelegramFlow = { state: string; verifier: string; nonce: string; next?: string; locale: string };

export async function beginTelegramFlow(input: { next?: string; locale: string }): Promise<string> {
  const flow: TelegramFlow = { state: randomToken(), verifier: randomToken(), nonce: randomToken(), ...input };
  const token = await new SignJWT({ ...flow })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setSubject(TELEGRAM_OAUTH_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + FLOW_SECONDS)
    .sign(secretKey());
  (await cookies()).set(TELEGRAM_OAUTH_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: COOKIE_PATH, maxAge: FLOW_SECONDS });

  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: runtimeEnv("TELEGRAM_CLIENT_ID")!,
    redirect_uri: siteUrl(TELEGRAM_CALLBACK_PATH),
    response_type: "code",
    scope: SCOPE,
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: await pkceChallenge(flow.verifier),
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}

/** Callback-də axın oxunur və cookie dərhal silinir (təkrar istifadə yoxdur). */
export async function consumeTelegramFlow(state: string | null): Promise<TelegramFlow | null> {
  const store = await cookies();
  const token = store.get(TELEGRAM_OAUTH_COOKIE)?.value;
  store.delete({ name: TELEGRAM_OAUTH_COOKIE, path: COOKIE_PATH });
  if (!token || !state) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: TOKEN_ISSUER, subject: TELEGRAM_OAUTH_SUBJECT });
    const flow = payload as unknown as TelegramFlow;
    if (typeof flow.state !== "string" || flow.state !== state) return null;
    if (typeof flow.verifier !== "string" || typeof flow.nonce !== "string") return null;
    return { state: flow.state, verifier: flow.verifier, nonce: flow.nonce, locale: String(flow.locale ?? "az"), next: typeof flow.next === "string" ? flow.next : undefined };
  } catch {
    return null;
  }
}

/** Kodu tokenə dəyişir (Basic auth) və ID tokeni yoxlayır. Uğursuzluqda `null`. */
export async function exchangeTelegramCode(code: string, flow: TelegramFlow, now: Date = new Date()): Promise<{ identity: TelegramOidcIdentity; botAccess: boolean } | null> {
  const clientId = runtimeEnv("TELEGRAM_CLIENT_ID");
  const clientSecret = runtimeEnv("TELEGRAM_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: siteUrl(TELEGRAM_CALLBACK_PATH),
      client_id: clientId,
      code_verifier: flow.verifier,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) return null;
  const body = (await response.json().catch(() => null)) as { id_token?: unknown; scope?: unknown } | null;
  if (typeof body?.id_token !== "string") return null;

  try {
    // JWKS sorğu başına qurulur (#96): modul səviyyəsində paylaşılan keş workerd-də «hung» sorğuya səbəb ola bilər.
    const { payload } = await jwtVerify(body.id_token, createRemoteJWKSet(JWKS_URL), {
      issuer: TELEGRAM_ISSUER,
      // ES256K Web Crypto-da yoxdur — BotFather-də RS256 (defolt), ES256 və ya EdDSA seçilməlidir.
      algorithms: ["RS256", "ES256", "EdDSA"],
    });
    const identity = validateTelegramClaims(payload as Record<string, unknown>, { clientId, nonce: flow.nonce, now });
    if (!identity) return null;
    const botAccess = typeof body.scope === "string" && body.scope.split(/\s+/).includes("telegram:bot_access");
    return { identity, botAccess };
  } catch {
    return null;
  }
}

export type PendingTelegramSignup = TelegramOidcIdentity & { botAccess: boolean; locale: string; next?: string };

/** Yeni istifadəçi: təsdiqlənmiş kimlik e-poçt formasına qədər imzalı cookie-də saxlanılır. */
export async function setPendingTelegramSignup(pending: PendingTelegramSignup): Promise<void> {
  const token = await new SignJWT({ ...pending })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setSubject(TELEGRAM_PENDING_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + PENDING_SECONDS)
    .sign(secretKey());
  (await cookies()).set(TELEGRAM_PENDING_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: PENDING_SECONDS });
}

export async function readPendingTelegramSignup(): Promise<PendingTelegramSignup | null> {
  const token = (await cookies()).get(TELEGRAM_PENDING_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: TOKEN_ISSUER, subject: TELEGRAM_PENDING_SUBJECT });
    const value = payload as unknown as PendingTelegramSignup;
    if (typeof value.telegramUserId !== "string" || typeof value.sub !== "string") return null;
    return {
      telegramUserId: value.telegramUserId,
      sub: value.sub,
      name: typeof value.name === "string" ? value.name : null,
      username: typeof value.username === "string" ? value.username : null,
      botAccess: value.botAccess === true,
      locale: typeof value.locale === "string" ? value.locale : "az",
      next: typeof value.next === "string" ? value.next : undefined,
    };
  } catch {
    return null;
  }
}

export async function clearPendingTelegramSignup(): Promise<void> {
  (await cookies()).delete({ name: TELEGRAM_PENDING_COOKIE, path: "/" });
}
