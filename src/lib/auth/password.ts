import { fromBase64Url, timingSafeEqual, toBase64Url } from "./crypto";

/**
 * Parol hash-ı — Web Crypto PBKDF2.
 *
 * Saf JavaScript bcrypt Workers-də bir girişə 150-400 ms CPU yeyir; doğma PBKDF2
 * eyni təhlükəsizlik səviyyəsini onlarla dəfə ucuz verir.
 *
 * Saxlanma formatı iterasiya sayını özündə daşıyır, ona görə gələcəkdə dəyəri artırmaq
 * köhnə hash-ları sındırmır — istifadəçi növbəti girişində yeni parametrlərlə yenilənir.
 */

const ALGORITHM = "pbkdf2";
const DIGEST = "sha256";
/** OWASP-ın PBKDF2-HMAC-SHA256 üçün tövsiyəsi. */
const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

const encoder = new TextEncoder();

async function derive(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `${ALGORITHM}$${DIGEST}$${ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 5) return false;

  const [algorithm, digest, iterationsRaw, saltPart, hashPart] = parts;
  if (algorithm !== ALGORITHM || digest !== DIGEST) return false;

  const iterations = Number.parseInt(iterationsRaw, 10);
  if (!Number.isFinite(iterations) || iterations < 1) return false;

  try {
    const candidate = await derive(password, fromBase64Url(saltPart), iterations);
    return timingSafeEqual(candidate, fromBase64Url(hashPart));
  } catch {
    // Formatı pozulmuş dəyər — çökmək əvəzinə sadəcə uyğunsuzluq sayılır
    return false;
  }
}

/** Hash cari parametrlərdən zəifdirsə, uğurlu girişdən sonra yenilənməlidir. */
export function needsRehash(stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 5) return true;
  const iterations = Number.parseInt(parts[2], 10);
  return parts[0] !== ALGORITHM || parts[1] !== DIGEST || !(iterations >= ITERATIONS);
}
