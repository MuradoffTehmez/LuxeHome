import { runtimeEnv } from "@/lib/runtime-env";
import { siteUrl } from "@/config/site";
import { FACEBOOK_OAUTH_COOKIE, FACEBOOK_OAUTH_SUBJECT } from "./cookie-names";
import { beginOAuthFlow, consumeOAuthFlow, pkceS256, type FlowCookie, type OAuthFlowState } from "./oauth-flow";
import { facebookClaimsFromProfile, type SocialClaims } from "./social-login-policy";

/**
 * «Facebook ilə daxil ol» — Facebook Login (OAuth 2.0 authorization code + PKCE S256 + `state`). Profil Graph API-dən
 * (`/me?fields=id,name,email`) server tərəfdə oxunur; sorğu `appsecret_proof` (giriş tokeninin app secret ilə
 * HMAC-SHA256-sı) ilə imzalanır ki, oğurlanmış token başqa tətbiqdən istifadə olunmasın.
 *
 * Facebook e-poçtun təsdiq vəziyyətini bildirmir, ona görə e-poçt **təsdiqlənməmiş** sayılır: mövcud hesaba bağlanmır,
 * yeni hesab e-poçt linkindən sonra yaranır (`social-login-policy.ts`). `FACEBOOK_APP_ID`/`FACEBOOK_APP_SECRET`
 * olmayanda funksiya tam söndürülüdür.
 */

const GRAPH_VERSION = "v21.0";
const AUTHORIZE_URL = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;
const TOKEN_URL = `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`;
const ME_URL = `https://graph.facebook.com/${GRAPH_VERSION}/me`;
const TIMEOUT_MS = 8000;

export const FACEBOOK_CALLBACK_PATH = "/api/auth/facebook/callback";
const COOKIE: FlowCookie = { name: FACEBOOK_OAUTH_COOKIE, subject: FACEBOOK_OAUTH_SUBJECT, path: "/api/auth/facebook", sameSite: "lax" };

export function isFacebookLoginConfigured(): boolean {
  return Boolean(runtimeEnv("FACEBOOK_APP_ID") && runtimeEnv("FACEBOOK_APP_SECRET"));
}

export async function beginFacebookFlow(input: { next?: string; locale: string; linkUserId?: string }): Promise<string> {
  const flow = await beginOAuthFlow(COOKIE, input);
  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: runtimeEnv("FACEBOOK_APP_ID")!,
    redirect_uri: siteUrl(FACEBOOK_CALLBACK_PATH),
    response_type: "code",
    scope: "public_profile,email",
    state: flow.state,
    code_challenge: await pkceS256(flow.verifier),
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}

export function consumeFacebookFlow(state: string | null): Promise<OAuthFlowState | null> {
  return consumeOAuthFlow(COOKIE, state);
}

export async function appSecretProof(accessToken: string, appSecret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(accessToken));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function exchangeFacebookCode(code: string, flow: OAuthFlowState): Promise<SocialClaims | null> {
  const appId = runtimeEnv("FACEBOOK_APP_ID");
  const appSecret = runtimeEnv("FACEBOOK_APP_SECRET");
  if (!appId || !appSecret) return null;

  // Token mübadiləsi POST ilə — secret URL-də (və jurnallarda) görünməsin.
  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: siteUrl(FACEBOOK_CALLBACK_PATH), code, code_verifier: flow.verifier }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!tokenResponse.ok) return null;
  const token = (await tokenResponse.json().catch(() => null)) as { access_token?: unknown } | null;
  if (typeof token?.access_token !== "string") return null;

  const meUrl = new URL(ME_URL);
  meUrl.search = new URLSearchParams({ fields: "id,name,email", appsecret_proof: await appSecretProof(token.access_token, appSecret) }).toString();
  const meResponse = await fetch(meUrl, { headers: { authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!meResponse.ok) return null;
  return facebookClaimsFromProfile((await meResponse.json().catch(() => ({}))) as Record<string, unknown>);
}
