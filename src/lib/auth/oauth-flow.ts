import { cookies } from "next/headers";
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { toBase64Url } from "./crypto";
import { TOKEN_ISSUER } from "./cookie-names";

/**
 * Apple və Facebook axınlarının ortaq `state`/PKCE/`nonce` cookie-si (Google axını ilə eyni quruluş): imzalı JWT,
 * 10 dəqiqə, yalnız provayderin `/api/auth/<provayder>` yolunda görünür və callback-də dərhal silinir — CSRF, kod
 * oğurluğu və ID token təkrarına qarşı. Apple `form_post` ilə **kənar saytdan POST** qaytarır, ona görə onun cookie-si
 * `SameSite=None` olmalıdır (yenə `Secure` + `HttpOnly`).
 */

const FLOW_SECONDS = 10 * 60;

export type OAuthFlowState = { state: string; verifier: string; nonce: string; next?: string; locale: string };

export type FlowCookie = { name: string; subject: string; path: string; sameSite: "lax" | "none" };

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET təyin edilməyib");
  return new TextEncoder().encode(secret);
}

export const randomOAuthToken = () => toBase64Url(crypto.getRandomValues(new Uint8Array(32)));

export async function pkceS256(verifier: string): Promise<string> {
  return toBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
}

export async function beginOAuthFlow(cookie: FlowCookie, input: { next?: string; locale: string }): Promise<OAuthFlowState> {
  const flow: OAuthFlowState = { state: randomOAuthToken(), verifier: randomOAuthToken(), nonce: randomOAuthToken(), ...input };
  const token = await new SignJWT({ ...flow })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setSubject(cookie.subject)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + FLOW_SECONDS)
    .sign(secretKey());
  (await cookies()).set(cookie.name, token, { httpOnly: true, secure: true, sameSite: cookie.sameSite, path: cookie.path, maxAge: FLOW_SECONDS });
  return flow;
}

export async function consumeOAuthFlow(cookie: FlowCookie, state: string | null): Promise<OAuthFlowState | null> {
  const store = await cookies();
  const token = store.get(cookie.name)?.value;
  store.delete({ name: cookie.name, path: cookie.path });
  if (!token || !state) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: TOKEN_ISSUER, subject: cookie.subject });
    const flow = payload as unknown as OAuthFlowState;
    if (typeof flow.state !== "string" || flow.state !== state) return null;
    if (typeof flow.verifier !== "string" || typeof flow.nonce !== "string") return null;
    return { state: flow.state, verifier: flow.verifier, nonce: flow.nonce, locale: String(flow.locale ?? "az"), next: typeof flow.next === "string" ? flow.next : undefined };
  } catch {
    return null;
  }
}
