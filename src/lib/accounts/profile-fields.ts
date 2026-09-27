import { ACCOUNT_TYPES, COMPANY_ACCOUNT_TYPES, type AccountType } from "@/lib/constants";

/**
 * Profil sahələrinin saf qaydaları — qeydiyyat və kabinet profili eyni qaydaları
 * işlədir. Şəxsi məlumat minimal saxlanılır: doğum tarixi istəyə bağlıdır və
 * yalnız yaş təsdiqi üçündür, heç yerdə göstərilmir.
 */

/** Qeydiyyat üçün minimum yaş. */
export const MIN_ACCOUNT_AGE = 18;

/** «Ad Soyad» — göstəriş adı (`User.name`) ad və soyaddan qurulur. */
export function composeName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, " ").trim();
}

/** Köhnə hesabın tək `name` sahəsini ad və soyada bölür (formanın başlanğıc dəyəri üçün). */
export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

export type BirthDateResult = { ok: true; value: Date | null } | { ok: false; reason: "invalid" | "underage" };

/** `YYYY-MM-DD` → tarix; boş dəyər `null`-dır (sahə istəyə bağlıdır). */
export function parseBirthDate(value: string | null | undefined, now = new Date()): BirthDateResult {
  const text = value?.trim();
  if (!text) return { ok: true, value: null };
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return { ok: false, reason: "invalid" };
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return { ok: false, reason: "invalid" };
  }
  if (year < 1900 || date.getTime() > now.getTime()) return { ok: false, reason: "invalid" };
  const adulthood = new Date(Date.UTC(year + MIN_ACCOUNT_AGE, month - 1, day));
  if (adulthood.getTime() > now.getTime()) return { ok: false, reason: "underage" };
  return { ok: true, value: date };
}

/** VÖEN — 10 rəqəm. Boşluqlar atılır; boş dəyər qəbul olunur (sahə istəyə bağlıdır). */
export function normalizeTaxId(value: string | null | undefined): string | null | false {
  const digits = value?.replace(/\s+/g, "") ?? "";
  if (!digits) return null;
  return /^\d{10}$/.test(digits) ? digits : false;
}

export type ProfileRequirements = {
  /** Telefon məcburidir — elan yerləşdirən və biznes hesablarında. */
  phoneRequired: boolean;
  /** Şirkət adı məcburidir. */
  company: boolean;
  /** Agent profili (bio, təcrübə) bölməsi. */
  agent: boolean;
};

export function profileRequirements(accountType: AccountType | string): ProfileRequirements {
  return {
    phoneRequired: accountType !== ACCOUNT_TYPES.USER,
    company: (COMPANY_ACCOUNT_TYPES as readonly string[]).includes(accountType),
    agent: accountType === ACCOUNT_TYPES.AGENT,
  };
}
