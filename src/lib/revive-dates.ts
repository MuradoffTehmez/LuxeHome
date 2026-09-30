/**
 * Keşdən qayıdan dəyərdə tarix sahələrini yenidən `Date`-ə çevirir.
 *
 * `unstable_cache` nəticəni JSON kimi saxlayır: keş boş olanda funksiya Prisma-dan
 * gələn `Date` obyektlərini qaytarır, keş dolandan sonra isə eyni sahələr sətir olur.
 * Səhifə `Intl.DateTimeFormat().format(value)` və ya `value.toISOString()` çağıranda
 * birinci sorğu işləyir, sonrakılar `RangeError`/`TypeError` ilə 500 verirdi —
 * Bilik Mərkəzi məqalələri (`legalReviewedAt`) və elanın qiymət tarixçəsi belə sınırdı.
 *
 * İki şərt birlikdə yoxlanılır: sahənin adı sxemin tarix konvensiyasına uyğundur
 * (`createdAt`, `featuredUntil`, `birthDate`, `officialSince`, `reviewAfter`,
 * `requestedFor`, `date`) **və** dəyər tam UTC ISO formatındadır — `JSON.stringify`
 * `Date`-i məhz belə yazır. Yalnız formata baxmaq olmazdı: başlığı təsadüfən
 * `2026-09-01T10:15:00.000Z` olan elan kartda `Date` kimi render olunub sınardı.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const DATE_KEY = /(?:At|Until|Date|Since|After|For)$|^date$/;

export function reviveDates<T>(value: T): T {
  return revive(value, null) as T;
}

function revive(value: unknown, key: string | null): unknown {
  if (typeof value === "string") {
    if (key === null || !DATE_KEY.test(key) || !ISO_DATE.test(value)) return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date;
  }
  if (Array.isArray(value)) return value.map((item) => revive(item, null));
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [entryKey, item] of Object.entries(value)) out[entryKey] = revive(item, entryKey);
    return out;
  }
  return value;
}
