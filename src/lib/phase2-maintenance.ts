import { prisma } from "@/lib/prisma";
import { RESERVATION_STATUSES } from "@/lib/constants";

/** Gündəlik cron üçün idempotent premium və rezervasiya müddəti təmizliyi. */
export async function runPhase2Maintenance(now = new Date()) {
  const premium = await prisma.property.updateMany({
    where: { isFeatured: true, featuredUntil: { lt: now } },
    data: { isFeatured: false },
  });
  const expiring = await prisma.reservation.findMany({
    where: {
      expiresAt: { lt: now },
      status: { in: [RESERVATION_STATUSES.REQUESTED, RESERVATION_STATUSES.PENDING, RESERVATION_STATUSES.APPROVED] },
    },
    select: { id: true },
  });
  for (const reservation of expiring) {
    await prisma.reservation.update({ where: { id: reservation.id }, data: { status: RESERVATION_STATUSES.EXPIRED } });
    await prisma.reservationEvent.create({ data: { reservationId: reservation.id, status: RESERVATION_STATUSES.EXPIRED, source: "SYSTEM" } });
  }
  return { expiredPremium: premium.count, expiredReservations: expiring.length };
}
