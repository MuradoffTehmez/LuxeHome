/**
 * Auth qatının kriptoqrafik təməli.
 *
 * Hər şey Web Crypto üzərindədir: Workers-də doğma koddur, saf JavaScript
 * alternativlərindən onlarla dəfə sürətlidir və əlavə asılılıq tələb etmir.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(text: string): Uint8Array {
  const normalized = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Sabit vaxtlı müqayisə — erkən çıxış yoxdur, uzunluq fərqi də ayrıca budaq yaratmır.
 * Adi `===` müqayisəsi ilk fərqli baytda dayanır və cavab vaxtı ilə hash-in
 * nə qədərinin doğru tapıldığını sızdırır.
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

/**
 * `AUTH_SECRET`-dən məqsədə görə ayrı-ayrı açarlar törədir.
 * `info` fərqli olduqda eyni secret-dən bir-birindən asılı olmayan açarlar çıxır —
 * TOTP sirri üçün istifadə olunan açar başqa məqsədə yaramır.
 */
export async function deriveKey(secret: string, info: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", encoder.encode(secret), "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: encoder.encode(info) },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptString(plain: string, secret: string, info: string): Promise<string> {
  const key = await deriveKey(secret, info);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plain));
  return `v1$${toBase64Url(iv)}$${toBase64Url(new Uint8Array(cipher))}`;
}

export async function decryptString(
  payload: string,
  secret: string,
  info: string,
): Promise<string> {
  const [version, ivPart, cipherPart] = payload.split("$");
  if (version !== "v1" || !ivPart || !cipherPart) {
    throw new Error("Şifrələnmiş dəyərin formatı tanınmadı");
  }
  const key = await deriveKey(secret, info);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(ivPart) },
    key,
    fromBase64Url(cipherPart),
  );
  return decoder.decode(plain);
}

/**
 * Yüksək entropiyalı dəyərlər üçün tək keçidli hash — backup kodlar kimi.
 * Parol üçün yaramaz: parollar lüğət hücumuna məruz qalır və PBKDF2 tələb edir.
 */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
