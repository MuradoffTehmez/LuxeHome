import { prisma } from "@/lib/prisma";
import type { PropertyStatusSource } from "@/lib/constants";

/**
 * Elanın status tarixçəsi (#204, PRD 5.4). Hər status keçidi — panel, sahib, moderasiya,
 * gündəlik iş — buradan yazılır.
 *
 * **Heç vaxt atmır:** status artıq dəyişib, tarixçə sətrinin yazılmaması əməliyyatı uğursuz
 * göstərməməlidir (D1-də tranzaksiya yoxdur, geri almaq da mümkün deyil). Xəta loga düşür.
 */
export async function recordPropertyStatusChange(input: {
  propertyId: string;
  from: string | null;
  to: string;
  source: PropertyStatusSource;
  changedById?: string | null;
  note?: string | null;
}): Promise<void> {
  if (input.from === input.to) return;
  try {
    await prisma.propertyStatusHistory.create({
      data: {
        propertyId: input.propertyId,
        fromStatus: input.from,
        toStatus: input.to,
        source: input.source,
        changedById: input.changedById ?? null,
        note: input.note?.trim().slice(0, 1000) || null,
      },
    });
  } catch (error) {
    console.error("[status-history] status dəyişikliyi yazılmadı:", error);
  }
}

/** Bir neçə elanın eyni keçidi (toplu əməliyyat, gündəlik iş). */
export async function recordPropertyStatusChanges(
  items: readonly { propertyId: string; from: string | null }[],
  change: { to: string; source: PropertyStatusSource; changedById?: string | null; note?: string | null },
): Promise<void> {
  for (const item of items) {
    await recordPropertyStatusChange({ ...change, propertyId: item.propertyId, from: item.from });
  }
}

export type PropertyHistoryEntry =
  | { kind: "status"; id: string; at: Date; from: string | null; to: string; source: string; by: string | null; note: string | null }
  | { kind: "price"; id: string; at: Date; oldPrice: number; newPrice: number; currency: string; source: string; by: string | null };

/**
 * Admin elan səhifəsi üçün status və qiymət tarixçəsi bir xətdə, ən yenisi birinci.
 * `PropertyPriceHistory.changedById` əlaqəsizdir, ona görə adlar ayrıca bir sorğu ilə gəlir.
 */
export async function getPropertyHistory(propertyId: string, limit = 50): Promise<PropertyHistoryEntry[]> {
  const [statuses, prices] = await Promise.all([
    prisma.propertyStatusHistory.findMany({
      where: { propertyId },
      select: { id: true, fromStatus: true, toStatus: true, source: true, note: true, changedAt: true, changedById: true },
      orderBy: { changedAt: "desc" },
      take: limit,
    }),
    prisma.propertyPriceHistory.findMany({
      where: { propertyId },
      select: { id: true, oldPrice: true, newPrice: true, currency: true, source: true, changedAt: true, changedById: true },
      orderBy: { changedAt: "desc" },
      take: limit,
    }),
  ]);
  const userIds = [...new Set([...statuses, ...prices].flatMap((row) => (row.changedById ? [row.changedById] : [])))];
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
    : [];
  const nameOf = (id: string | null) => (id ? users.find((user) => user.id === id)?.name ?? null : null);

  return [
    ...statuses.map((row): PropertyHistoryEntry => ({
      kind: "status",
      id: row.id,
      at: row.changedAt,
      from: row.fromStatus,
      to: row.toStatus,
      source: row.source,
      by: nameOf(row.changedById),
      note: row.note,
    })),
    ...prices.map((row): PropertyHistoryEntry => ({
      kind: "price",
      id: row.id,
      at: row.changedAt,
      oldPrice: row.oldPrice,
      newPrice: row.newPrice,
      currency: row.currency,
      source: row.source,
      by: nameOf(row.changedById),
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
}
