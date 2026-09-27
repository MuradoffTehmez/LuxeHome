/**
 * Telefonla OTP girişinin saf qaydaları (#109) — D1 və SMS olmadan test olunur.
 */

/** Azərbaycan mobil operator kodları — SMS yalnız bunlara gedə bilər. */
const MOBILE_PREFIXES = new Set(["10", "50", "51", "55", "60", "70", "77", "99"]);

export const OTP_TTL_SECONDS = 5 * 60;
export const OTP_MAX_ATTEMPTS = 5;
/** Eyni nömrəyə ardıcıl iki kod arasında ən az interval. */
export const OTP_COOLDOWN_SECONDS = 60;
/** Pəncərə ərzində bir nömrəyə göndərilən ən çox kod — SMS xərci və spam həddi. */
export const OTP_WINDOW_SECONDS = 60 * 60;
export const OTP_WINDOW_LIMIT = 5;

/**
 * Nömrəni E.164 formasına salır: «051 922 85 85», «+994519228585», «519228585» →
 * «+994519228585». Mobil olmayan və ya pozulmuş nömrə üçün null.
 */
export function normalizeAzMobile(input: string | null | undefined): string | null {
  const digits = (input ?? "").replace(/\D/g, "");
  let national: string | null = null;
  if (digits.length === 12 && digits.startsWith("994")) national = digits.slice(3);
  else if (digits.length === 10 && digits.startsWith("0")) national = digits.slice(1);
  else if (digits.length === 9) national = digits;
  if (!national || !MOBILE_PREFIXES.has(national.slice(0, 2))) return null;
  return `+994${national}`;
}

export type OtpSendDecision = "SEND" | "COOLDOWN" | "LIMIT";

/** Bu nömrəyə indi kod göndərilə bilərmi (son kodların yaranma vaxtlarına görə)? */
export function otpSendDecision(recent: Date[], now: Date): OtpSendDecision {
  const inWindow = recent.filter((date) => now.getTime() - date.getTime() < OTP_WINDOW_SECONDS * 1000);
  if (inWindow.length >= OTP_WINDOW_LIMIT) return "LIMIT";
  const latest = Math.max(0, ...inWindow.map((date) => date.getTime()));
  if (latest && now.getTime() - latest < OTP_COOLDOWN_SECONDS * 1000) return "COOLDOWN";
  return "SEND";
}

/** 6 rəqəmli kod — `crypto.getRandomValues` ilə, modul sürüşməsi olmadan. */
export function generateOtpCode(): string {
  const buffer = new Uint32Array(1);
  let value: number;
  // 4 294 967 296 % 1 000 000 qalığını atırıq ki, bütün kodlar bərabər ehtimallı olsun.
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= 4_294_000_000);
  return String(value % 1_000_000).padStart(6, "0");
}
