import { LOCALES, type Locale } from "@/lib/constants";

/**
 * Əlaqə panelinin məcburi beh xəbərdarlığı (PRD Modul 11, #199).
 *
 * Mətn paneldən AZ/EN/RU dillərində dəyişdirilə bilir və **tək JSON parametrdə** saxlanılır
 * (`SETTING_KEYS.SAFETY_CONTACT_WARNING`): D1 tranzaksiya dəstəkləmir, üç açara bölünsəydi
 * yarımçıq yazılış dilləri bir-birindən ayıra bilərdi. Boş dil kataloqdakı defolt mətnə
 * (`property.safety.contactWarning`) qayıdır — xəbərdarlıq heç vaxt itməməlidir.
 *
 * Bu modul Prisma idxal etmir: həm admin forması, həm testlər onu işlədir.
 */

export const SAFETY_WARNING_MAX = 400;
export const SAFETY_WARNING_MIN = 20;

export type SafetyWarningOverrides = Partial<Record<Locale, string>>;

const LOCALE_LIST = Object.values(LOCALES) as Locale[];

/** Boşluqları sıxır, idarə simvollarını atır; uzunluq hədlərindən kənar mətn qəbul edilmir. */
export function normalizeSafetyWarning(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (text.length < SAFETY_WARNING_MIN || text.length > SAFETY_WARNING_MAX) return null;
  return text;
}

/** Bazadakı JSON → yalnız etibarlı dillər. Pozulmuş dəyər boş obyekt verir (defolt mətn). */
export function parseSafetyWarnings(json: string | null | undefined): SafetyWarningOverrides {
  if (!json) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const result: SafetyWarningOverrides = {};
  for (const locale of LOCALE_LIST) {
    const text = normalizeSafetyWarning((parsed as Record<string, unknown>)[locale]);
    if (text) result[locale] = text;
  }
  return result;
}

export function serializeSafetyWarnings(overrides: SafetyWarningOverrides): string {
  const clean: SafetyWarningOverrides = {};
  for (const locale of LOCALE_LIST) {
    const text = normalizeSafetyWarning(overrides[locale]);
    if (text) clean[locale] = text;
  }
  return JSON.stringify(clean);
}
