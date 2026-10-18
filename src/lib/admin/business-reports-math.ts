/**
 * Hesabatların saf köməkçiləri (#262, PRD Modul 20) — Prisma-sız, ona görə ayrıca test olunur.
 */

/** Bakı vaxtı UTC+4-dür (yay vaxtı yoxdur). */
const BAKU_OFFSET_MS = 4 * 60 * 60 * 1000;

export type MonthWindow = { key: string; start: Date; end: Date };

/** Son `count` təqvim ayının Bakı vaxtı ilə sərhədləri — ən köhnə əvvəl, sonuncu cari aydır. */
export function monthWindows(count: number, now = new Date()): MonthWindow[] {
  const local = new Date(now.getTime() + BAKU_OFFSET_MS);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const windows: MonthWindow[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const startUtc = Date.UTC(year, month - offset, 1) - BAKU_OFFSET_MS;
    const endUtc = Date.UTC(year, month - offset + 1, 1) - BAKU_OFFSET_MS;
    const keyDate = new Date(startUtc + BAKU_OFFSET_MS);
    windows.push({
      key: `${keyDate.getUTCFullYear()}-${String(keyDate.getUTCMonth() + 1).padStart(2, "0")}`,
      start: new Date(startUtc),
      end: new Date(endUtc),
    });
  }
  return windows;
}

export function median(values: number[]): number | null {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** Faiz (0–100, bir onluq) — məxrəc sıfırdırsa `null` («—»). */
export function percent(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

/**
 * Aylıq təkrarlanan gəlir (qəpik): hər aktiv ödənişli abunənin son uğurlu ödənişi müddətinə bölünür.
 * Ödəniş qəbul edilmirsə (checkout söndürülü) gəlir hesablanmır — çağıran `0` göstərir.
 */
export function monthlyRecurringMinor(rows: { amountMinor: number; months: number }[]): number {
  return Math.round(rows.reduce((sum, row) => sum + (row.months > 0 ? row.amountMinor / row.months : 0), 0));
}

/** Kiçik minimum nümunədən aşağı median göstərilmir (uydurma trend olmasın). */
export const PRICE_TREND_MIN_SAMPLES = 5;
