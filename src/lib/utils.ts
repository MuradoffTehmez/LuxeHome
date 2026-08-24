import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind siniflərini konfliktsiz birləşdirir. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * `next/image`-in `unoptimized` bayrağı üçün.
 *
 * OpenNext Cloudflare adapteri nisbi (`/`-lə başlayan) URL-ləri yalnız `ASSETS`
 * binding-i (build-vaxtı statik fayllar) üzərindən axtarır — R2-dən `/media/[...key]`
 * dinamik route-u ilə verilən şəkilləri tapmır və 404 qaytarır. `/media/`-dən gələn
 * şəkillər onsuz da yüklənmə anında WebP-ə çevrilib ölçülənib, ona görə runtime
 * optimizasiyası həm mümkün deyil, həm lazımsızdır — server tərəf artıq işini görüb.
 */
export function isUnoptimizedImage(url: string): boolean {
  return url.startsWith("/media/") || url.startsWith("blob:");
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

const AZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avqust",
  "sentyabr",
  "oktyabr",
  "noyabr",
  "dekabr",
];

/** Date → "12 avqust 2026" */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Date → "12.08.2026 19:40" */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Cache sərhədində mətnə çevrilmiş DateTime dəyərini metadata üçün normallaşdırır. */
export function toIsoDateTime(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** "2 saat əvvəl", "dünən", "3 gün əvvəl" */
export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "indicə";
  if (minutes < 60) return `${minutes} dəqiqə əvvəl`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat əvvəl`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "dünən";
  if (days < 30) return `${days} gün əvvəl`;

  return formatDate(d);
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
