import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { createRemoteJWKSet } from "jose/jwks/remote";
import { importPKCS8 } from "jose/key/import";
import { runtimeEnv } from "@/lib/runtime-env";
import { siteUrl } from "@/config/site";
import { APPLE_OAUTH_COOKIE, APPLE_OAUTH_SUBJECT } from "./cookie-names";
import { beginOAuthFlow, consumeOAuthFlow, readLinkResult, writeLinkResult, type FlowCookie, type LinkResultPayload, type OAuthFlowState } from "./oauth-flow";
import { appleClaimsFromPayload, type SocialClaims } from "./social-login-policy";

/**
 * «Apple ilə daxil ol» — Sign in with Apple (OIDC, authorization code). Apple `name email` scope-u ilə qayıdışı
 * yalnız `response_mode=form_post` ilə edir: callback **POST** alır. `client_secret` statik deyil — `.p8` açarı ilə
 * imzalanan qısaömürlü ES256 JWT-dir (`APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`). ID token Apple-ın JWKS
 * açarları ilə yoxlanılır (`iss`, `aud` = Services ID, `exp`, `nonce`). Açarlar yoxdursa funksiya tam söndürülüdür.
 *
 * Apple istifadəçinin adını yalnız **ilk** icazədə, `user` form sahəsində göndərir (ID tokendə ad yoxdur).
 */

const AUTHORIZE_URL = "https://appleid.apple.com/auth/authorize";
const TOKEN_URL = "https://appleid.apple.com/auth/token";
const JWKS_URL = new URL("https://appleid.apple.com/auth/keys");
const ISSUER = "https://appleid.apple.com";
const TIMEOUT_MS = 8000;

export const APPLE_CALLBACK_PATH = "/api/auth/apple/callback";
const COOKIE: FlowCookie = { name: APPLE_OAUTH_COOKIE, subject: APPLE_OAUTH_SUBJECT, path: "/api/auth/apple", sameSite: "none" };

export function isAppleLoginConfigured(): boolean {
  return Boolean(runtimeEnv("APPLE_CLIENT_ID") && runtimeEnv("APPLE_TEAM_ID") && runtimeEnv("APPLE_KEY_ID") && runtimeEnv("APPLE_PRIVATE_KEY"));
}

export async function beginAppleFlow(input: { next?: string; locale: string; linkUserId?: string }): Promise<string> {
  const flow = await beginOAuthFlow(COOKIE, input);
  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: runtimeEnv("APPLE_CLIENT_ID")!,
    redirect_uri: siteUrl(APPLE_CALLBACK_PATH),
    response_type: "code",
    response_mode: "form_post",
    scope: "name email",
    state: flow.state,
    nonce: flow.nonce,
  }).toString();
  return url.toString();
}

export function consumeAppleFlow(state: string | null): Promise<OAuthFlowState | null> {
  return consumeOAuthFlow(COOKIE, state);
}

export function storeAppleLinkResult(payload: LinkResultPayload): Promise<void> {
  return writeLinkResult(COOKIE, payload);
}

export function takeAppleLinkResult(): Promise<LinkResultPayload | null> {
  return readLinkResult(COOKIE);
}

/** Secret-də `\n` mətn kimi saxlanıla bilər (Wrangler secret bir sətirdir) — PEM bərpa olunur. */
function privateKeyPem(): string {
  return (runtimeEnv("APPLE_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n");
}

/** Apple `client_secret`: ES256 JWT, 5 dəqiqəlik (Apple 6 aya qədər icazə verir — qısa ömür sızmanı məhdudlaşdırır). */
export async function appleClientSecret(now: Date = new Date()): Promise<string> {
  const key = await importPKCS8(privateKeyPem(), "ES256");
  const iat = Math.floor(now.getTime() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: runtimeEnv("APPLE_KEY_ID")! })
    .setIssuer(runtimeEnv("APPLE_TEAM_ID")!)
    .setSubject(runtimeEnv("APPLE_CLIENT_ID")!)
    .setAudience(ISSUER)
    .setIssuedAt(iat)
    .setExpirationTime(iat + 5 * 60)
    .sign(key);
}

export async function exchangeAppleCode(code: string, flow: OAuthFlowState): Promise<Omit<SocialClaims, "name"> | null> {
  const clientId = runtimeEnv("APPLE_CLIENT_ID");
  if (!clientId || !isAppleLoginConfigured()) return null;
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: await appleClientSecret(),
      code,
      grant_type: "authorization_code",
      redirect_uri: siteUrl(APPLE_CALLBACK_PATH),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) return null;
  const body = (await response.json().catch(() => null)) as { id_token?: unknown } | null;
  if (typeof body?.id_token !== "string") return null;
  try {
    // JWKS sorğu başına qurulur (#96) — modul səviyyəsində paylaşılan keş workerd-də «hung» sorğu yarada bilər.
    const { payload } = await jwtVerify(body.id_token, createRemoteJWKSet(JWKS_URL), { issuer: ISSUER, audience: clientId });
    return appleClaimsFromPayload(payload as Record<string, unknown>, flow.nonce);
  } catch {
    return null;
  }
}
