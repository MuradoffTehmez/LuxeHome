import { LISTING_RISK_THRESHOLDS } from "@/lib/constants";

/**
 * Avtomatik moderasiyanın saf qatı (#159) — Prisma-sız, testlə qorunur.
 * Məlumat toplayan server qatı `listing-risk.ts`-dədir.
 *
 * Siqnallar fırıldaq elanlarının tipik izləridir (bina.az/tap.az moderasiya təcrübəsi):
 * bazardan xeyli ucuz qiymət, nömrəni mətnə yazıb platformanı yan keçmək, başqa hesabın
 * fotolarını və ya mətnini köçürmək, təzə açılmış hesab, ziyarətçi şikayətləri.
 */

export const RISK_CODES = [
  "LOW_PRICE",
  "CONTACT_IN_TEXT",
  "DUPLICATE_PHOTOS",
  "DUPLICATE_TEXT",
  "NEW_ACCOUNT",
  "OPEN_REPORTS",
] as const;

export type RiskCode = (typeof RISK_CODES)[number];

export type RiskFlag = { code: RiskCode; value?: number };

/** Çəkilər: tək güclü siqnal (başqasının fotosu) növbəyə salmağa yetir, zəif siqnal yox. */
export const RISK_WEIGHTS: Record<RiskCode, number> = {
  DUPLICATE_PHOTOS: 50,
  LOW_PRICE: 35,
  CONTACT_IN_TEXT: 30,
  DUPLICATE_TEXT: 25,
  OPEN_REPORTS: 20,
  NEW_ACCOUNT: 10,
};

/** m² qiyməti median-dan bu faiz və daha çox aşağıdırsa — «şübhəli ucuz». */
export const LOW_PRICE_PERCENT = -35;

/** Hesab bu gündən təzədirsə — «yeni hesab». */
export const NEW_ACCOUNT_DAYS = 3;

/** Təkrar mətn yoxlaması yalnız bu uzunluqdan başlayır — qısa ümumi cümlələr təsadüfən üst-üstə düşür. */
export const DUPLICATE_TEXT_MIN_LENGTH = 120;

export function scoreRisk(flags: readonly RiskFlag[]): number {
  return Math.min(100, flags.reduce((sum, flag) => sum + RISK_WEIGHTS[flag.code], 0));
}

export type RiskLevel = "none" | "review" | "hold";

export function riskLevel(score: number): RiskLevel {
  if (score >= LISTING_RISK_THRESHOLDS.hold) return "hold";
  if (score >= LISTING_RISK_THRESHOLDS.review) return "review";
  return "none";
}

/**
 * Azərbaycan nömrə prefiksləri (mobil + Bakı/Sumqayıt stasionar). Rəqəmlər arasındakı
 * boşluq, tire, nöqtə və mötərizə atılır — «050 555-12-34», «+994 (50) 5551234» tutulur,
 * «120 000 AZN» və «3 otaq, 2 hamam» kimi ədədlər isə prefiks olmadığı üçün tutulmur.
 */
const PHONE_PATTERN = /(?:\+?994|\b0)(?:10|12|18|50|51|55|60|70|77|99)\d{7}(?!\d)/;
const EMAIL_PATTERN = /[\p{L}\d._%+-]+@[\p{L}\d-]+\.[\p{L}]{2,}/u;
const LINK_PATTERN = /(?:https?:\/\/|www\.|wa\.me\/|t\.me\/|instagram\.com\/|facebook\.com\/)/i;

export type ContactKind = "phone" | "email" | "link";

export function detectContactInText(text: string | null | undefined): ContactKind[] {
  if (!text) return [];
  const joined = text.replace(/(?<=\d)[\s\-().]+(?=\d)/g, "");
  const kinds: ContactKind[] = [];
  if (PHONE_PATTERN.test(joined)) kinds.push("phone");
  if (EMAIL_PATTERN.test(text)) kinds.push("email");
  if (LINK_PATTERN.test(text)) kinds.push("link");
  return kinds;
}

/** Bazada saxlanan JSON-u oxuyur; tanınmayan kod atılır (köhnə/korlanmış dəyər). */
export function parseRiskFlags(raw: string | null | undefined): RiskFlag[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      if (typeof item !== "object" || item === null) return [];
      const { code, value: number } = item as { code?: unknown; value?: unknown };
      if (typeof code !== "string" || !(RISK_CODES as readonly string[]).includes(code)) return [];
      return [{ code: code as RiskCode, ...(typeof number === "number" ? { value: number } : {}) }];
    });
  } catch {
    return [];
  }
}
