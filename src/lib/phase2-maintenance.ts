import { pruneUniqueViews } from "@/lib/listing-stats";
import { prisma } from "@/lib/prisma";
import { PARTNER_STATUSES, RESERVATION_STATUSES } from "@/lib/constants";
import { recordDomainEvent } from "@/lib/admin/events";
import { processPendingAccountDeletions } from "@/lib/account-deletion";
import { startOfBakuToday } from "@/lib/partners";
import { runListingExpiry } from "@/lib/listing-expiry";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { sendOpenHouseReminders } from "@/lib/open-house";

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
  // Elan aktuallığı söndürülübsə (#242) müddət, xatırlatma və avtomatik bitmə dayanır.
  const listingExpiry = (await isFeatureEnabled("LISTING_FRESHNESS"))
    ? await runListingExpiry(now)
    : { renewed: 0, backfilled: 0, reminded: 0, expired: 0, expiredIds: [] as string[], disabled: true };
  const openHouseReminders = await sendOpenHouseReminders(now);
  const retentionCutoff = new Date(now.getTime() - DOMAIN_EVENT_RETENTION_DAYS * 86_400_000);
  const domainEvents = await prisma.domainEvent.deleteMany({
    where: { createdAt: { lt: retentionCutoff } },
  });
  // Unikal baxış açarları (#236) yalnız gün ərzində lazımdır — sayğac `PropertyDailyStat`-da qalır.
  const uniqueViewKeys = await pruneUniqueViews(now);

  return {
    expiredPremium: premium.count,
    expiredReservations: expiring.length,
    expiredPartners: partners.count,
    listingExpiry,
    openHouseReminders,
    accountDeletions,
    deletedDomainEvents: domainEvents.count,
    prunedUniqueViews: uniqueViewKeys,
  };
}
