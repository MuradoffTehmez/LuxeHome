import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatLocalizedDate, formatLocalizedRelative, formatLocalizedTime } from "@/i18n/date";

/** Tailwind siniflərini konfliktsiz birləşdirir. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * `next/image`-in `unoptimized` bayrağı üçün.
 *
 * `/media/` şəkilləri artıq optimallaşdırılır: qlobal loader (`image-loader.ts`) onları
 * `?w=&q=` ilə worker-ə göndərir və `srcset` yaranır (#167). Əvvəllər burada idi və mobil
 * cihaz da 2400 px-lik master faylı yükləyirdi. Brauzer yaddaşındakı `blob:` önizləmə
 * və SVG çevrilmir.
 */
export function isUnoptimizedImage(url: string): boolean {
  return (
    url.startsWith("blob:") ||
    /\.svg(?:[?#]|$)/i.test(url)
  );
}

// ---------------------------------------------------------------------------
// FORMATLAMA
// ---------------------------------------------------------------------------

const azNumber = new Intl.NumberFormat("az-AZ", {
  maximumFractionDigits: 0,
});

/** 450000 → "450 000" */
export function formatNumber(value: number): string {
  return azNumber.format(value);
}

/** 450000, "AZN" → "450 000 ₼" */
export function formatPrice(value: number, currency = "AZN"): string {
  const symbol = currency === "AZN" ? "₼" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;
  return `${azNumber.format(value)} ${symbol}`;
}

/** 320 → "320 m²" */
export function formatArea(value: number): string {
  return `${azNumber.format(value)} m²`;
}

/** Date → "12 avqust 2026" (Bakı vaxtı — Workers-in yerli saat qurşağı UTC-dir). */
export function formatDate(date: Date | string): string {
  return formatLocalizedDate(date, "az") ?? "";
}

/** Date → "12.08.2026 19:40" (Bakı vaxtı) */
export function formatDateTime(date: Date | string): string {
  const day = formatLocalizedDate(date, "az", "numeric");
  const time = formatLocalizedTime(date);
  return day && time ? `${day} ${time}` : "";
}

/** Cache sərhədində mətnə çevrilmiş DateTime dəyərini metadata üçün normallaşdırır. */
export function toIsoDateTime(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** "2 saat əvvəl", "dünən", "3 gün əvvəl" */
export function formatRelative(date: Date | string): string {
  return formatLocalizedRelative(date, "az") ?? "";
}

// ---------------------------------------------------------------------------
// SLUG
// ---------------------------------------------------------------------------

const AZ_TRANSLIT: Record<string, string> = {
  ə: "e",
  Ə: "e",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ü: "u",
  Ü: "u",
  ş: "s",
  Ş: "s",
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
};

/**
 * Azərbaycan hərflərini nəzərə alaraq SEO-uyğun slug yaradır.
 * "Bakıda 4 otaqlı premium villa" → "bakida-4-otaqli-premium-villa"
 */
export function slugify(input: string): string {
  return input
    .trim()
    .replace(/[əƏıİöÖüÜşŞçÇğĞ]/g, (ch) => AZ_TRANSLIT[ch] ?? ch)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

// ---------------------------------------------------------------------------
// MƏTN
// ---------------------------------------------------------------------------

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/** Mətndən oxunma müddətini təxmin edir (dəqiqə). */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** JSON massiv sahələrini təhlükəsiz oxuyur (SQLite-də String kimi saxlanılır). */
export function parseJsonArray<T = string>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Telefon nömrəsini oxunaqlı formata salır: +994519228585 → +994 51 922 85 85 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const m = digits.match(/^994(\d{2})(\d{3})(\d{2})(\d{2})$/);
  if (m) return `+994 ${m[1]} ${m[2]} ${m[3]} ${m[4]}`;
  return phone;
}
