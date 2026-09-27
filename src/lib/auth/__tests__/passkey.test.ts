import { describe, expect, it } from "vitest";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { fromBase64Url, toBase64Url } from "../crypto";
import { passkeyName, relyingPartyFor } from "../passkey-policy";

/**
 * Passkey qatı (#109). Kitabxana workerd runtime-ında proqram autentifikatoru ilə
 * yoxlanılır: real brauzer olmadan qeydiyyat və giriş imzası qurulur, açıq açarın
 * bazaya yazılan base64url forması da geri oxunub istifadə edilir.
 */

// --- minimal CBOR kodlayıcı (yalnız autentifikator strukturları üçün) ---
function head(major: number, length: number): number[] {
  if (length < 24) return [(major << 5) | length];
  if (length < 256) return [(major << 5) | 24, length];
  return [(major << 5) | 25, length >> 8, length & 0xff];
}
function cbor(value: unknown): number[] {
  if (typeof value === "number") return value >= 0 ? head(0, value) : head(1, -1 - value);
  if (typeof value === "string") {
    const bytes = [...new TextEncoder().encode(value)];
    return [...head(3, bytes.length), ...bytes];
  }
  if (value instanceof Uint8Array) return [...head(2, value.length), ...value];
  if (value instanceof Map) {
    return [...head(5, value.size), ...[...value].flatMap(([key, item]) => [...cbor(key), ...cbor(item)])];
  }
  throw new Error("dəstəklənməyən CBOR dəyəri");
}

const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};
const sha256 = async (bytes: Uint8Array) => new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
const json = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));

/** WebCrypto ECDSA imzası (r||s) → WebAuthn-un gözlədiyi DER. */
function derSignature(raw: Uint8Array): Uint8Array {
  const integer = (bytes: Uint8Array) => {
    let start = 0;
    while (start < bytes.length - 1 && bytes[start] === 0) start++;
    const trimmed = bytes.slice(start);
    const body = trimmed[0] & 0x80 ? concat(new Uint8Array([0]), trimmed) : trimmed;
    return concat(new Uint8Array([0x02, body.length]), body);
  };
  const body = concat(integer(raw.slice(0, 32)), integer(raw.slice(32)));
  return concat(new Uint8Array([0x30, body.length]), body);
}

const rpID = "luxehomeestate.az";
const origin = `https://${rpID}`;

async function softwareAuthenticator() {
  const keys = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const jwk = (await crypto.subtle.exportKey("jwk", keys.publicKey)) as JsonWebKey;
  const credentialId = crypto.getRandomValues(new Uint8Array(16));
  const cose = new Uint8Array(cbor(new Map<number, unknown>([
    [1, 2], [3, -7], [-1, 1], [-2, fromBase64Url(jwk.x!)], [-3, fromBase64Url(jwk.y!)],
  ])));
  const rpIdHash = await sha256(new TextEncoder().encode(rpID));
  let counter = 0;

  return {
    credentialId,
    async register(challenge: string, clientOrigin = origin): Promise<RegistrationResponseJSON> {
      const authData = concat(
        rpIdHash,
        new Uint8Array([0x45, 0, 0, 0, 0]), // UP | UV | AT, sayğac 0
        new Uint8Array(16), // AAGUID
        new Uint8Array([0, credentialId.length]),
        credentialId,
        cose,
      );
      const attestation = new Uint8Array(cbor(new Map<string, unknown>([["fmt", "none"], ["attStmt", new Map()], ["authData", authData]])));
      return {
        id: toBase64Url(credentialId),
        rawId: toBase64Url(credentialId),
        type: "public-key",
        response: {
          clientDataJSON: toBase64Url(json({ type: "webauthn.create", challenge, origin: clientOrigin })),
          attestationObject: toBase64Url(attestation),
          transports: ["internal"],
        },
        clientExtensionResults: {},
      };
    },
    async sign(challenge: string, clientOrigin = origin): Promise<AuthenticationResponseJSON> {
      counter += 1;
      const authData = concat(rpIdHash, new Uint8Array([0x05, 0, 0, 0, counter]));
      const clientData = json({ type: "webauthn.get", challenge, origin: clientOrigin });
      const raw = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keys.privateKey, concat(authData, await sha256(clientData))));
      return {
        id: toBase64Url(credentialId),
        rawId: toBase64Url(credentialId),
        type: "public-key",
        response: {
          authenticatorData: toBase64Url(authData),
          clientDataJSON: toBase64Url(clientData),
          signature: toBase64Url(derSignature(raw)),
        },
        clientExtensionResults: {},
      };
    },
  };
}

describe("passkey RP qaydası", () => {
  it("yalnız öz domenlərimizə RP ID verir", () => {
    expect(relyingPartyFor("luxehomeestate.az", "luxehomeestate.az")).toEqual({ rpID: "luxehomeestate.az", origin: "https://luxehomeestate.az" });
    expect(relyingPartyFor("luxehomeestate-staging.amiyevbahadur.workers.dev", "luxehomeestate.az")?.rpID).toBe("luxehomeestate-staging.amiyevbahadur.workers.dev");
    expect(relyingPartyFor("localhost:8787", "luxehomeestate.az")).toEqual({ rpID: "localhost", origin: "http://localhost:8787" });
    expect(relyingPartyFor("evil.example", "luxehomeestate.az")).toBeNull();
    expect(relyingPartyFor("luxehomeestate.az.evil.example", "luxehomeestate.az")).toBeNull();
    expect(relyingPartyFor("luxehomeestate.az:444", "luxehomeestate.az")).toBeNull();
    expect(relyingPartyFor(null, "luxehomeestate.az")).toBeNull();
  });

  it("adı təmizləyir, boşdursa defolt verir", () => {
    expect(passkeyName("  İş   noutbuku ", "Passkey")).toBe("İş noutbuku");
    expect(passkeyName("", "Passkey")).toBe("Passkey");
    expect(passkeyName("x".repeat(80), "Passkey")).toHaveLength(60);
  });
});

describe("passkey mərasimi workerd-də", () => {
  it("qeydiyyatdan keçir, bazadakı formadan girişi yoxlayır, saxta origin və təkrar imzanı rədd edir", async () => {
    const authenticator = await softwareAuthenticator();
    const registration = await generateRegistrationOptions({
      rpName: "Luxe Home Estate",
      rpID,
      userName: "staff@example.test",
      userID: new TextEncoder().encode("user-1"),
      attestationType: "none",
      authenticatorSelection: { residentKey: "preferred", userVerification: "required" },
    });

    // Başqa domendə yaradılmış qeydiyyat qəbul olunmur.
    await expect(verifyRegistrationResponse({
      response: await authenticator.register(registration.challenge, "https://evil.example"),
      expectedChallenge: registration.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    })).rejects.toThrow();

    const verified = await verifyRegistrationResponse({
      response: await authenticator.register(registration.challenge),
      expectedChallenge: registration.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    expect(verified.verified).toBe(true);
    if (!verified.verified) return;

    // Bazaya yazılan forma: base64url açıq açar.
    const stored = { id: verified.registrationInfo.credential.id, publicKey: toBase64Url(verified.registrationInfo.credential.publicKey), counter: 0 };
    expect(stored.id).toBe(toBase64Url(authenticator.credentialId));

    const login = await generateAuthenticationOptions({ rpID, allowCredentials: [{ id: stored.id }], userVerification: "required" });
    const assertion = await authenticator.sign(login.challenge);
    const result = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: login.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: { id: stored.id, publicKey: fromBase64Url(stored.publicKey), counter: stored.counter },
    });
    expect(result.verified).toBe(true);
    expect(result.authenticationInfo.newCounter).toBe(1);

    // Eyni imzanın təkrarı (sayğac irəli getməyib) rədd edilir.
    await expect(verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: login.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: { id: stored.id, publicKey: fromBase64Url(stored.publicKey), counter: result.authenticationInfo.newCounter },
    })).rejects.toThrow();

    // Fişinq domenində alınmış imza rədd edilir.
    const phished = await authenticator.sign(login.challenge, "https://luxehomeestate-az.example");
    await expect(verifyAuthenticationResponse({
      response: phished,
      expectedChallenge: login.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: { id: stored.id, publicKey: fromBase64Url(stored.publicKey), counter: 1 },
    })).rejects.toThrow();
  });
});
