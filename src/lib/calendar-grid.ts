/**
 * Aylıq təqvim şəbəkəsi (#109) — Bakı vaxtı (UTC+4, yay saatı yoxdur) ilə.
 * Saf funksiyalardır; günlər UTC günortası kimi saxlanılır ki, formatlama zamanı
 * saat qurşağı sürüşməsi tarixi dəyişməsin.
 */

const BAKU_OFFSET_MS = 4 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

/** Bakı vaxtına görə gün açarı: `2026-10-01`. */
export function bakuDayKey(date: Date): string {
  return new Date(date.getTime() + BAKU_OFFSET_MS).toISOString().slice(0, 10);
}

function parseMonth(value: string | undefined, now: Date): { year: number; month: number } {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    if (year >= 2000 && year <= 2100 && month >= 0 && month <= 11) return { year, month };
  }
  const baku = new Date(now.getTime() + BAKU_OFFSET_MS);
  return { year: baku.getUTCFullYear(), month: baku.getUTCMonth() };
}

const monthParam = (year: number, month: number) => {
  const normalized = new Date(Date.UTC(year, month, 1));
  return `${normalized.getUTCFullYear()}-${String(normalized.getUTCMonth() + 1).padStart(2, "0")}`;
};

/** Bazar ertəsindən başlayan tam həftələrlə ay şəbəkəsi və sorğu aralığı (UTC). */
export function bakuMonthGrid(value: string | undefined, now = new Date()) {
  const { year, month } = parseMonth(value, now);
  const first = new Date(Date.UTC(year, month, 1, 12));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const gridStart = new Date(first.getTime() - mondayOffset * DAY_MS);
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
  const todayKey = bakuDayKey(now);
  const days = Array.from({ length: cells }, (_, index) => {
    const date = new Date(gridStart.getTime() + index * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    return { key, date, inMonth: date.getUTCMonth() === month, isToday: key === todayKey };
  });
  // Sorğu aralığı: şəbəkənin ilk gününün Bakı gecəyarısından son gününün sonuna qədər.
  const from = new Date(Date.UTC(gridStart.getUTCFullYear(), gridStart.getUTCMonth(), gridStart.getUTCDate()) - BAKU_OFFSET_MS);
  const to = new Date(from.getTime() + cells * DAY_MS);
  return { monthStart: first, days, from, to, prev: monthParam(year, month - 1), next: monthParam(year, month + 1) };
}
