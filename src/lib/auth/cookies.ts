import { cookies } from "next/headers";
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import {
  SESSION_COOKIE,
  SESSION_SUBJECT,
  STAGE_COOKIE,
  STAGE_SUBJECT,
  TOKEN_ISSUER,
  WEBAUTHN_COOKIE,
  WEBAUTHN_SUBJECT,
} from "./cookie-names";
import type { AuthStage } from "./types";
import { isAccountType, type AccountType, type AuthKind } from "@/lib/constants";

/**
 * Cookie qatı.
 *
 * Sessiya cookie-si yalnız imzalanmış sessiya ID-si daşıyır — səlahiyyət hər sorğuda
 * bazadan oxunur. JWT-nin rolu məlumat daşımaq deyil, dəyəri saxtalaşdırılmaqdan qorumaqdır.
 *
 * Ara-cookie ayrıca `stage` sahəsi ilə işarələnir və `subject` fərqlidir, ona görə
 * sessiya kimi qəbul edilə bilmir: ikinci addımı keçmədən panelə düşmək mümkün deyil.
 */

export { SESSION_COOKIE, STAGE_COOKIE };

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET təyin edilməyib");
  return new TextEncoder().encode(secret);
}

export type SessionClaims = {
  sid: string;
  uid: string;
  role: string;
  accountType: AccountType;
  authKind: AuthKind;
};
/** `next` — girişdən sonra qayıdılacaq panel marşrutu (`?davam=` parametrindən gəlir). */
export type StageClaims = { uid: string; stage: AuthStage; secret?: string; next?: string };

export async function signSessionToken(claims: SessionClaims, expiresAt: Date): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setSubject(SESSION_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: TOKEN_ISSUER,
      subject: SESSION_SUBJECT,
    });
    const { sid, uid, role, accountType, authKind } = payload as Record<string, unknown>;
    if (
      typeof sid !== "string" ||
      typeof uid !== "string" ||
      typeof role !== "string" ||
      !isAccountType(accountType) ||
      (authKind !== "STAFF_2FA" && authKind !== "PUBLIC")
    ) {
      return null;
    }
    return { sid, uid, role, accountType, authKind };
  } catch {
    return null;
  }
}

export async function signStageToken(claims: StageClaims, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setSubject(STAGE_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .sign(secretKey());
}

export async function verifyStageToken(token: string): Promise<StageClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: TOKEN_ISSUER,
      subject: STAGE_SUBJECT,
    });
    const { uid, stage, secret, next } = payload as Record<string, unknown>;
    if (typeof uid !== "string") return null;
    if (stage !== "totp" && stage !== "enroll") return null;
    return {
      uid,
      stage,
      secret: typeof secret === "string" ? secret : undefined,
      next: typeof next === "string" ? next : undefined,
    };
  } catch {
    return null;
  }
}

const BASE_COOKIE = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
} as const;

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, { ...BASE_COOKIE, expires: expiresAt });
}

export async function readSessionCookie(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function setStageCookie(token: string, maxAgeSeconds: number): Promise<void> {
  (await cookies()).set(STAGE_COOKIE, token, { ...BASE_COOKIE, maxAge: maxAgeSeconds });
}

export async function readStageCookie(): Promise<string | null> {
  return (await cookies()).get(STAGE_COOKIE)?.value ?? null;
}

export async function clearStageCookie(): Promise<void> {
  (await cookies()).delete(STAGE_COOKIE);
}

// ---------------------------------------------------------------------------
// WEBAUTHN CHALLENGE (#109)
// ---------------------------------------------------------------------------

/**
 * Passkey mərasiminin challenge-i imzalı, qısaömürlü cookie-də saxlanılır: server
 * cavabı yalnız özünün verdiyi challenge ilə, eyni istifadəçi və məqsəd üçün qəbul edir.
 * `purpose` qeydiyyat challenge-inin girişdə (və əksinə) işlədilməsinin qarşısını alır.
 */
export type WebauthnPurpose = "register" | "login";
export type WebauthnClaims = { uid: string; challenge: string; purpose: WebauthnPurpose };

const WEBAUTHN_SECONDS = 5 * 60;

export async function setWebauthnChallenge(claims: WebauthnClaims): Promise<void> {
  const token = await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setSubject(WEBAUTHN_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + WEBAUTHN_SECONDS)
    .sign(secretKey());
  (await cookies()).set(WEBAUTHN_COOKIE, token, { ...BASE_COOKIE, maxAge: WEBAUTHN_SECONDS });
}

/** Challenge-i oxuyur və dərhal silir — hər challenge yalnız bir dəfə işlədilə bilər. */
export async function consumeWebauthnChallenge(purpose: WebauthnPurpose): Promise<WebauthnClaims | null> {
  const store = await cookies();
  const token = store.get(WEBAUTHN_COOKIE)?.value;
  store.delete(WEBAUTHN_COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: TOKEN_ISSUER, subject: WEBAUTHN_SUBJECT });
    const { uid, challenge, purpose: tokenPurpose } = payload as Record<string, unknown>;
    if (typeof uid !== "string" || typeof challenge !== "string" || tokenPurpose !== purpose) return null;
    return { uid, challenge, purpose };
  } catch {
    return null;
  }
}
