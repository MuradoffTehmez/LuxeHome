import { prisma } from "@/lib/prisma";
import { RESERVATION_STATUSES } from "@/lib/constants";
import type { CalendarEvent } from "@/lib/calendar-ics";

/**
 * Əməkdaşın təqvim hadisələri (#109): baxış rezervasiyaları və açıq qapı günləri.
 * `all` — müraciət icazəsi olan əməkdaş hamısını, agent isə yalnız özününkünü görür.
 */

const RESERVATION_MINUTES = 60;
const ACTIVE = [RESERVATION_STATUSES.REQUESTED, RESERVATION_STATUSES.PENDING, RESERVATION_STATUSES.APPROVED];

export type StaffCalendarItem = CalendarEvent & { kind: "reservation" | "openHouse"; propertyId: string };

export async function getStaffCalendar(options: { userId: string; all: boolean; from: Date; to: Date }): Promise<StaffCalendarItem[]> {
  const agentScope = options.all ? {} : { agent: { userId: options.userId } };
  const propertyScope = options.all ? {} : { property: { assignedAgent: { userId: options.userId } } };
  const [reservations, openHouses] = await Promise.all([
    prisma.reservation.findMany({
      where: { ...agentScope, status: { in: ACTIVE }, requestedFor: { gte: options.from, lt: options.to } },
      select: {
        id: true, firstName: true, lastName: true, phone: true, requestedFor: true, status: true, message: true,
        property: { select: { id: true, title: true, address: true } },
      },
      orderBy: { requestedFor: "asc" },
      take: 500,
    }),
    prisma.openHouse.findMany({
      where: { ...propertyScope, startsAt: { gte: options.from, lt: options.to } },
      select: {
        id: true, startsAt: true, endsAt: true, capacity: true,
        property: { select: { id: true, title: true, address: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { startsAt: "asc" },
      take: 200,
    }),
  ]);

  return [
    ...reservations.map((item) => ({
      kind: "reservation" as const,
      propertyId: item.property.id,
      uid: `reservation-${item.id}@luxehomeestate.az`,
      start: item.requestedFor,
      end: new Date(item.requestedFor.getTime() + RESERVATION_MINUTES * 60_000),
      summary: `Baxış: ${item.property.title}`,
      description: [`${item.firstName} ${item.lastName}`, item.phone, item.message ?? ""].filter(Boolean).join("\n"),
      location: item.property.address ?? undefined,
      status: item.status === RESERVATION_STATUSES.APPROVED ? ("CONFIRMED" as const) : ("TENTATIVE" as const),
    })),
    ...openHouses.map((item) => ({
      kind: "openHouse" as const,
      propertyId: item.property.id,
      uid: `open-house-${item.id}@luxehomeestate.az`,
      start: item.startsAt,
      end: item.endsAt,
      summary: `Açıq qapı: ${item.property.title}`,
      description: `${item._count.registrations} qeydiyyat${item.capacity ? ` / ${item.capacity}` : ""}`,
      location: item.property.address ?? undefined,
      status: "CONFIRMED" as const,
    })),
  ].sort((left, right) => left.start.getTime() - right.start.getTime());
}
