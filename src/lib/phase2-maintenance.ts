import { prisma } from "@/lib/prisma";
import { PARTNER_STATUSES, RESERVATION_STATUSES } from "@/lib/constants";
import { recordDomainEvent } from "@/lib/admin/events";
import { processPendingAccountDeletions } from "@/lib/account-deletion";
import { startOfBakuToday } from "@/lib/partners";

const DOMAIN_EVENT_RETENTION_DAYS = 180;

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
  const partners = await prisma.partner.updateMany({
    where: {
      deletedAt: null,
      status: PARTNER_STATUSES.ACTIVE,
      partnershipEndDate: { not: null, lt: startOfBakuToday(now) },
    },
    data: { status: PARTNER_STATUSES.EXPIRED, showOnHomepage: false },
  });
  if (partners.count > 0) {
    await recordDomainEvent("partner.expired", "Partner", "maintenance", { count: partners.count });
  }

  const accountDeletions = await processPendingAccountDeletions(now);
  const retentionCutoff = new Date(now.getTime() - DOMAIN_EVENT_RETENTION_DAYS * 86_400_000);
  const domainEvents = await prisma.domainEvent.deleteMany({
    where: { createdAt: { lt: retentionCutoff } },
  });

  return {
    expiredPremium: premium.count,
    expiredReservations: expiring.length,
    expiredPartners: partners.count,
    accountDeletions,
    deletedDomainEvents: domainEvents.count,
  };
}
