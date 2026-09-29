/**
 * Keşdən qayıdan dəyərdə ISO tarix sətirlərini yenidən `Date`-ə çevirir.
 *
 * `unstable_cache` nəticəni JSON kimi saxlayır: keş boş olanda funksiya Prisma-dan
 * gələn `Date` obyektlərini qaytarır, keş dolandan sonra isə eyni sahələr sətir olur.
 * Səhifə `Intl.DateTimeFormat().format(value)` və ya `value.toISOString()` çağıranda
 * birinci sorğu işləyir, sonrakılar `RangeError`/`TypeError` ilə 500 verirdi —
 * Bilik Mərkəzi məqalələri (`legalReviewedAt`) və elanın qiymət tarixçəsi belə sınırdı.
 *
 * Yalnız tam UTC ISO formatı (`2026-08-30T00:00:00.000Z`) çevrilir — `JSON.stringify`
 * `Date`-i məhz belə yazır; adi mətn sahəsi bu formaya təsadüfən düşmür.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

export function reviveDates<T>(value: T): T {
  return revive(value) as T;
}

function revive(value: unknown): unknown {
  if (typeof value === "string") {
    if (!ISO_DATE.test(value)) return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date;
  }
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) out[key] = revive(item);
    return out;
  }
  return value;
}
