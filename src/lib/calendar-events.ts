import { prisma } from "@/lib/prisma";
import { RESERVATION_STATUSES } from "@/lib/constants";
import type { CalendarEvent } from "@/lib/calendar-ics";
import { findManyInChunks } from "@/lib/d1-chunks";

/**
 * Əməkdaşın təqvim hadisələri (#109): baxış rezervasiyaları və açıq qapı günləri.
 * `all` — müraciət icazəsi olan əməkdaş hamısını, agent isə yalnız özününkünü görür.
 */

const RESERVATION_MINUTES = 60;
/** Bir təqvim görünüşündə və ICS lentində hər növdən ən çox hadisə. */
const MAX_EVENTS = 500;
const ACTIVE = [RESERVATION_STATUSES.REQUESTED, RESERVATION_STATUSES.PENDING, RESERVATION_STATUSES.APPROVED];

export type StaffCalendarItem = CalendarEvent & { kind: "reservation" | "openHouse"; propertyId: string };

/**
 * Rezervasiya və slotlar əlaqəsiz oxunur, elan və qeydiyyat sayı isə ayrıca, hissə-hissə:
 * nested əlaqə 98-dən çox valideyndə `IN (…)` ilə D1-in 100 parametr həddini aşır və
 * sorğu ilişir — məşğul əməkdaşın təqvimi və ICS lenti belə sınardı.
 */
export async function getStaffCalendar(options: { userId: string; all: boolean; from: Date; to: Date }): Promise<StaffCalendarItem[]> {
  const agentScope = options.all ? {} : { agent: { userId: options.userId } };
  const propertyScope = options.all ? {} : { property: { assignedAgent: { userId: options.userId } } };
  const [reservations, openHouses] = await Promise.all([
    prisma.reservation.findMany({
      where: { ...agentScope, status: { in: ACTIVE }, requestedFor: { gte: options.from, lt: options.to } },
      select: { id: true, firstName: true, lastName: true, phone: true, requestedFor: true, status: true, message: true, propertyId: true },
      orderBy: { requestedFor: "asc" },
      take: MAX_EVENTS,
    }),
    prisma.openHouse.findMany({
      where: { ...propertyScope, startsAt: { gte: options.from, lt: options.to } },
      select: { id: true, startsAt: true, endsAt: true, capacity: true, propertyId: true },
      orderBy: { startsAt: "asc" },
      take: MAX_EVENTS,
    }),
  ]);

  const propertyIds = [...new Set([...reservations, ...openHouses].map((item) => item.propertyId))];
  const [properties, registrationCounts] = await Promise.all([
    findManyInChunks(propertyIds, 0, (ids) =>
      prisma.property.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, address: true } })),
    findManyInChunks(openHouses.map((item) => item.id), 0, (ids) =>
      prisma.openHouseRegistration.groupBy({ by: ["openHouseId"], where: { openHouseId: { in: ids } }, _count: { _all: true } })),
  ]);
  const propertyById = new Map(properties.map((property) => [property.id, property]));
  const registeredBySlot = new Map(registrationCounts.map((row) => [row.openHouseId, row._count._all]));

  const events: StaffCalendarItem[] = [];
  for (const item of reservations) {
    const property = propertyById.get(item.propertyId);
    if (!property) continue;
    events.push({
      kind: "reservation",
      propertyId: property.id,
      uid: `reservation-${item.id}@luxehomeestate.az`,
      start: item.requestedFor,
      end: new Date(item.requestedFor.getTime() + RESERVATION_MINUTES * 60_000),
      summary: `Baxış: ${property.title}`,
      description: [`${item.firstName} ${item.lastName}`, item.phone, item.message ?? ""].filter(Boolean).join("\n"),
      location: property.address ?? undefined,
      status: item.status === RESERVATION_STATUSES.APPROVED ? "CONFIRMED" : "TENTATIVE",
    });
  }
  for (const item of openHouses) {
    const property = propertyById.get(item.propertyId);
    if (!property) continue;
    events.push({
      kind: "openHouse",
      propertyId: property.id,
      uid: `open-house-${item.id}@luxehomeestate.az`,
      start: item.startsAt,
      end: item.endsAt,
      summary: `Açıq qapı: ${property.title}`,
      description: `${registeredBySlot.get(item.id) ?? 0} qeydiyyat${item.capacity ? ` / ${item.capacity}` : ""}`,
      location: property.address ?? undefined,
      status: "CONFIRMED",
    });
  }
  return events.sort((left, right) => left.start.getTime() - right.start.getTime());
}
