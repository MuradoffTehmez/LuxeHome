import * as OTPAuth from "otpauth";
import QRCode from "qrcode-svg";
import { siteConfig } from "@/config/site";
import { decryptString, encryptString, sha256Hex } from "./crypto";

/**
 * İki mərhələli doğrulama.
 *
 * Sirr bazada açıq saxlanılmır: `AUTH_SECRET`-dən HKDF ilə ayrıca açar törədilir və
 * sirr AES-GCM ilə şifrələnir. Bazaya oxu icazəsi əldə edən şəxs kod yarada bilmir.
 *
 * QR kodu server tərəfdə SVG kimi çəkilir — sirr heç bir kənar servisə göndərilmir.
 * (Google Charts kimi URL-lərə müraciət sirri üçüncü tərəfin jurnalına yazardı.)
 */

const PERIOD = 30;
const DIGITS = 6;
const ALGORITHM = "SHA1";
/** ±1 addım: saatı bir az kənara düşən cihazı kəsmir, pəncərəni də lazımsız genişlətmir. */
const WINDOW = 1;
const ENCRYPTION_INFO = "totp-secret-v1";
const BACKUP_CODE_COUNT = 10;

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET təyin edilməyib");
  return secret;
}

function buildTotp(secret: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: siteConfig.name,
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
  });
}

export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function buildOtpauthUri(secret: string, email: string): string {
  const totp = buildTotp(secret);
  totp.label = email;
  return totp.toString();
}

export function renderQrSvg(uri: string): string {
  return new QRCode({ content: uri, padding: 1, width: 220, height: 220, ecl: "M" }).svg();
}

/**
 * Kodu yoxlayır. Uyğun gələrsə addım nömrəsini qaytarır — çağıran onu sessiyaya yazıb
 * eyni kodun ikinci dəfə işlədilməsinin qarşısını alır.
 */
export function verifyTotp(secret: string, code: string): number | null {
  const cleaned = code.replace(/\D/g, "");
  if (cleaned.length !== DIGITS) return null;

  const delta = buildTotp(secret).validate({ token: cleaned, window: WINDOW });
  if (delta === null) return null;

  return Math.floor(Date.now() / (PERIOD * 1000)) + delta;
}

export function encryptTotpSecret(secret: string): Promise<string> {
  return encryptString(secret, authSecret(), ENCRYPTION_INFO);
}

export function decryptTotpSecret(payload: string): Promise<string> {
  return decryptString(payload, authSecret(), ENCRYPTION_INFO);
}

/** Oxunaqlı əlifba — 0/O və 1/I qarışıqlığı çıxarılıb. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * 10 birdəfəlik kod. Hər kod 8 simvoldur və 32 simvollu əlifbadan gəlir — 40 bit
 * entropiya. Bu, lüğət hücumuna məruz qalmadığı üçün SHA-256 hash kifayətdir.
 */
export function generateBackupCodes(): string[] {
  const codes = new Set<string>();
  while (codes.size < BACKUP_CODE_COUNT) {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    const raw = [...bytes].map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
    codes.add(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return [...codes];
}

/** İstifadəçi kodu boşluqla, kiçik hərflə və ya defissiz yaza bilər. */
export function normalizeBackupCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashBackupCode(code: string): Promise<string> {
  return sha256Hex(`backup:${normalizeBackupCode(code)}`);
}
