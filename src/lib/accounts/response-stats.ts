import { FAST_RESPONSE, LEAD_ESCALATION_MINUTES } from "@/lib/constants";

/**
 * Cavab göstəriciləri (#161, B3) — saf funksiyalar, Prisma-sız (client və testlər işlədir).
 *
 * - Nümunə: son `FAST_RESPONSE.windowDays` gündə hesaba düşən müraciətlər. Hələ
 *   `LEAD_ESCALATION_MINUTES` keçməmiş cavabsız müraciət sayılmır — ona cavab vermək
 *   üçün vaxt hələ var, onu «cavabsız» saymaq göstəricini haqsız aşağı salardı.
 * - Median dəqiqə yalnız cavablanmışlardan; pay (%) = cavablanan / nümunə.
 */

export type ResponseSummary = { minutes: number | null; sample: number; rate: number | null };

export function summarizeResponses(
  leads: { createdAt: Date; respondedAt: Date | null }[],
  now: Date = new Date(),
): ResponseSummary {
  const graceStart = now.getTime() - LEAD_ESCALATION_MINUTES * 60_000;
  const counted = leads.filter((lead) => lead.respondedAt || lead.createdAt.getTime() <= graceStart);
  const minutes = counted
    .filter((lead): lead is { createdAt: Date; respondedAt: Date } => lead.respondedAt != null)
    .map((lead) => Math.max(0, (lead.respondedAt.getTime() - lead.createdAt.getTime()) / 60_000))
    .sort((a, b) => a - b);
  if (counted.length === 0) return { minutes: null, sample: 0, rate: null };
  const middle = Math.floor(minutes.length / 2);
  const median = minutes.length === 0
    ? null
    : minutes.length % 2 === 1 ? minutes[middle] : (minutes[middle - 1] + minutes[middle]) / 2;
  return {
    minutes: median == null ? null : Math.max(1, Math.round(median)),
    sample: counted.length,
    rate: Math.round((minutes.length / counted.length) * 100),
  };
}

/** «Tez cavab verir» nişanı — kifayət qədər nümunə, sürətli median və yüksək cavab payı. */
export function isFastResponder(stats: { minutes: number | null; sample: number; rate: number | null }): boolean {
  return (
    stats.minutes != null &&
    stats.rate != null &&
    stats.sample >= FAST_RESPONSE.minSample &&
    stats.minutes <= FAST_RESPONSE.maxMinutes &&
    stats.rate >= FAST_RESPONSE.minRate
  );
}
