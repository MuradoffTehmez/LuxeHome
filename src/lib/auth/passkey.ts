import { headers } from "next/headers";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransport,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { siteConfig, siteUrl } from "@/config/site";
import { consumeWebauthnChallenge, setWebauthnChallenge } from "./cookies";
import { fromBase64Url, toBase64Url } from "./crypto";
import { MAX_PASSKEYS_PER_USER, passkeyName, relyingPartyFor, type RelyingParty } from "./passkey-policy";

/**
 * Passkey mərasimləri (#109) — `@simplewebauthn/server` (Web Crypto, Workers-də işləyir).
 *
 * İstifadəçi doğrulaması (`userVerification: "required"`) məcburidir: passkey burada
 * ikinci faktor deyil, TOTP-un yerini tutan faktordur — cihazın PIN/biometrik
 * yoxlaması olmadan «sahiblik» təkbaşına kifayət etmir.
 */

export class PasskeyError extends Error {
  constructor(public readonly code: "unsupported-host" | "limit" | "challenge" | "verification" | "unknown-credential") {
    super(code);
  }
}

async function relyingParty(): Promise<RelyingParty> {
  const rp = relyingPartyFor((await headers()).get("host"), new URL(siteUrl()).hostname);
  if (!rp) throw new PasskeyError("unsupported-host");
  return rp;
}

function parseTransports(value: string | null): AuthenticatorTransport[] | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed.filter((item) => typeof item === "string") as AuthenticatorTransport[]) : undefined;
  } catch {
    return undefined;
  }
}

export async function passkeyRegistrationOptions(user: { id: string; email: string; name: string }): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const rp = await relyingParty();
  const existing = await prisma.passkey.findMany({ where: { userId: user.id }, select: { credentialId: true, transports: true } });
  if (existing.length >= MAX_PASSKEYS_PER_USER) throw new PasskeyError("limit");

  const options = await generateRegistrationOptions({
    rpName: siteConfig.name,
    rpID: rp.rpID,
    userName: user.email,
    userDisplayName: user.name,
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    excludeCredentials: existing.map((item) => ({ id: item.credentialId, transports: parseTransports(item.transports) })),
    authenticatorSelection: { residentKey: "preferred", userVerification: "required" },
  });
  await setWebauthnChallenge({ uid: user.id, challenge: options.challenge, purpose: "register" });
  return options;
}

export async function registerPasskey(userId: string, response: RegistrationResponseJSON, name: unknown, fallbackName: string) {
  const claims = await consumeWebauthnChallenge("register");
  if (!claims || claims.uid !== userId) throw new PasskeyError("challenge");
  const rp = await relyingParty();

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: claims.challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.rpID,
      requireUserVerification: true,
    });
  } catch {
    throw new PasskeyError("verification");
  }
  if (!verification.verified) throw new PasskeyError("verification");
  if ((await prisma.passkey.count({ where: { userId } })) >= MAX_PASSKEYS_PER_USER) throw new PasskeyError("limit");

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  return prisma.passkey.create({
    data: {
      userId,
      credentialId: credential.id,
      publicKey: toBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports?.length ? JSON.stringify(credential.transports) : null,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      name: passkeyName(name, fallbackName),
    },
    select: { id: true, name: true },
  });
}

/** Girişin ikinci mərhələsi: yalnız bu istifadəçinin passkey-ləri təklif olunur. */
export async function passkeyLoginOptions(userId: string): Promise<PublicKeyCredentialRequestOptionsJSON | null> {
  const rp = await relyingParty();
  const passkeys = await prisma.passkey.findMany({ where: { userId }, select: { credentialId: true, transports: true } });
  if (passkeys.length === 0) return null;
  const options = await generateAuthenticationOptions({
    rpID: rp.rpID,
    allowCredentials: passkeys.map((item) => ({ id: item.credentialId, transports: parseTransports(item.transports) })),
    userVerification: "required",
  });
  await setWebauthnChallenge({ uid: userId, challenge: options.challenge, purpose: "login" });
  return options;
}

/** İmzanı yoxlayır; uğurlu olarsa sayğacı və son istifadə vaxtını yeniləyir. */
export async function verifyPasskeyLogin(userId: string, response: AuthenticationResponseJSON): Promise<void> {
  const claims = await consumeWebauthnChallenge("login");
  if (!claims || claims.uid !== userId) throw new PasskeyError("challenge");
  const rp = await relyingParty();

  // Kimlik başqa istifadəçiyə məxsusdursa tapılmır — hesablar arasında keçid yoxdur.
  const passkey = await prisma.passkey.findFirst({
    where: { userId, credentialId: response.id },
    select: { id: true, credentialId: true, publicKey: true, counter: true, transports: true },
  });
  if (!passkey) throw new PasskeyError("unknown-credential");

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: claims.challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.rpID,
      requireUserVerification: true,
      credential: {
        id: passkey.credentialId,
        publicKey: fromBase64Url(passkey.publicKey),
        counter: passkey.counter,
        transports: parseTransports(passkey.transports),
      },
    });
  } catch {
    throw new PasskeyError("verification");
  }
  if (!verification.verified) throw new PasskeyError("verification");

  await prisma.passkey.update({
    where: { id: passkey.id },
    data: { counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() },
  });
}
