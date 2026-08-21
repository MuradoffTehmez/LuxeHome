import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { AuthStage } from "./types";

/**
 * Cookie qatı.
 *
 * Sessiya cookie-si yalnız imzalanmış sessiya ID-si daşıyır — səlahiyyət hər sorğuda
 * bazadan oxunur. JWT-nin rolu məlumat daşımaq deyil, dəyəri saxtalaşdırılmaqdan qorumaqdır.
 *
 * Ara-cookie ayrıca `stage` sahəsi ilə işarələnir və `subject` fərqlidir, ona görə
 * sessiya kimi qəbul edilə bilmir: ikinci addımı keçmədən panelə düşmək mümkün deyil.
 */

export const SESSION_COOKIE = "lhe_session";
export const STAGE_COOKIE = "lhe_2fa";

const ISSUER = "luxehomeestate";
const SESSION_SUBJECT = "session";
const STAGE_SUBJECT = "stage";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET təyin edilməyib");
  return new TextEncoder().encode(secret);
}

export type SessionClaims = { sid: string; uid: string; role: string };
export type StageClaims = { uid: string; stage: AuthStage; secret?: string };

export async function signSessionToken(claims: SessionClaims, expiresAt: Date): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setSubject(SESSION_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      subject: SESSION_SUBJECT,
    });
    const { sid, uid, role } = payload as Record<string, unknown>;
    if (typeof sid !== "string" || typeof uid !== "string" || typeof role !== "string") return null;
    return { sid, uid, role };
  } catch {
    return null;
  }
}

export async function signStageToken(claims: StageClaims, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setSubject(STAGE_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .sign(secretKey());
}

export async function verifyStageToken(token: string): Promise<StageClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      subject: STAGE_SUBJECT,
    });
    const { uid, stage, secret } = payload as Record<string, unknown>;
    if (typeof uid !== "string") return null;
    if (stage !== "totp" && stage !== "enroll") return null;
    return { uid, stage, secret: typeof secret === "string" ? secret : undefined };
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
