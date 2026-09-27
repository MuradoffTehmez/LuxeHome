import { cookies } from "next/headers";
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { createRemoteJWKSet } from "jose/jwks/remote";
import { runtimeEnv } from "@/lib/runtime-env";
import { siteUrl } from "@/config/site";
import { toBase64Url } from "./crypto";
import { OAUTH_COOKIE, OAUTH_SUBJECT, TOKEN_ISSUER } from "./cookie-names";
import type { GoogleClaims } from "./google-login-policy";

/**
 * Google ilə giriş (OpenID Connect, authorization code + PKCE) — #109.
 *
 * `GOOGLE_CLIENT_ID` və `GOOGLE_CLIENT_SECRET` secret-ləri olmayanda funksiya tam
 * söndürülüdür: düymə göstərilmir, marşrut isə 404 qaytarır.
 *
 * `state`, PKCE `code_verifier` və `nonce` imzalı, 10 dəqiqəlik cookie-də saxlanılır:
 * callback yalnız bu brauzerin başlatdığı axını qəbul edir (CSRF), kod oğurlansa belə
 * verifier olmadan dəyişdirilə bilmir, ID token isə təkrar işlədilə bilmir (nonce).
 */

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS_URL = new URL("https://www.googleapis.com/oauth2/v3/certs");
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const FLOW_SECONDS = 10 * 60;
const TIMEOUT_MS = 8000;

export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

export function isGoogleLoginConfigured(): boolean {
  return Boolean(runtimeEnv("GOOGLE_CLIENT_ID") && runtimeEnv("GOOGLE_CLIENT_SECRET"));
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

export type OAuthFlow = { state: string; verifier: string; nonce: string; next?: string; locale: string };

/** Axını başladır: cookie-ni yazır və Google-un icazə ünvanını qaytarır. */
export async function beginGoogleFlow(input: { next?: string; locale: string }): Promise<string> {
  const flow: OAuthFlow = { state: randomToken(), verifier: randomToken(), nonce: randomToken(), ...input };
  const token = await new SignJWT({ ...flow })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setSubject(OAUTH_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + FLOW_SECONDS)
    .sign(secretKey());
  // Lax: Google-dan qayıdış üst səviyyəli GET keçididir, cookie göndərilir.
  (await cookies()).set(OAUTH_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/auth/google", maxAge: FLOW_SECONDS });

  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: runtimeEnv("GOOGLE_CLIENT_ID")!,
    redirect_uri: siteUrl(GOOGLE_CALLBACK_PATH),
    response_type: "code",
    scope: "openid email profile",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: await pkceChallenge(flow.verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

/** Callback-də axını oxuyur və cookie-ni dərhal silir (təkrar istifadə yoxdur). */
export async function consumeGoogleFlow(state: string | null): Promise<OAuthFlow | null> {
  const store = await cookies();
  const token = store.get(OAUTH_COOKIE)?.value;
  store.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
  if (!token || !state) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: TOKEN_ISSUER, subject: OAUTH_SUBJECT });
    const flow = payload as unknown as OAuthFlow;
    if (typeof flow.state !== "string" || flow.state !== state) return null;
    if (typeof flow.verifier !== "string" || typeof flow.nonce !== "string") return null;
    return { state: flow.state, verifier: flow.verifier, nonce: flow.nonce, locale: String(flow.locale ?? "az"), next: typeof flow.next === "string" ? flow.next : undefined };
  } catch {
    return null;
  }
}

export type GoogleProfile = GoogleClaims & { name: string };

/** Kodu tokenə dəyişir və ID tokeni Google-un açıq açarları ilə yoxlayır. */
export async function exchangeGoogleCode(code: string, flow: OAuthFlow): Promise<GoogleProfile | null> {
  const clientId = runtimeEnv("GOOGLE_CLIENT_ID");
  const clientSecret = runtimeEnv("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: siteUrl(GOOGLE_CALLBACK_PATH),
      grant_type: "authorization_code",
      code_verifier: flow.verifier,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { id_token?: unknown };
  if (typeof body.id_token !== "string") return null;

  try {
    // JWKS sorğu başına qurulur: modul səviyyəsində paylaşılan keş başqa sorğunun
    // başlatdığı fetch-i gözləyə bilər, workerd isə bunu «hung» sayır (#96 ilə eyni səbəb).
    const { payload } = await jwtVerify(body.id_token, createRemoteJWKSet(JWKS_URL), { issuer: ISSUERS, audience: clientId });
    if (payload.nonce !== flow.nonce || typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    const email = payload.email.trim().toLowerCase();
    const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim().slice(0, 120) : email.split("@")[0];
    return { sub: payload.sub, email, emailVerified: payload.email_verified === true, name };
  } catch {
    return null;
  }
}
