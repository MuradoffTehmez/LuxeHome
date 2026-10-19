import { pruneUniqueViews } from "@/lib/listing-stats";
import { prisma } from "@/lib/prisma";
import { PARTNER_STATUSES, RESERVATION_STATUSES } from "@/lib/constants";
import { recordDomainEvent } from "@/lib/admin/events";
import { processPendingAccountDeletions } from "@/lib/account-deletion";
import { startOfBakuToday } from "@/lib/partners";
import { runListingExpiry } from "@/lib/listing-expiry";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { sendOpenHouseReminders } from "@/lib/open-house";
import { expireVipGrants } from "@/lib/vip";
import { purgeReviewedDocuments } from "@/lib/property-verification";
import { refreshActiveAccountsTrust } from "@/lib/account-trust";
import { purgeSecurityLogs } from "@/lib/security/security-events";
import { purgeKnownDevices } from "@/lib/security/login-alerts";
import { DOMAIN_EVENT_RETENTION_DAYS } from "@/lib/security/retention-policy";
import { purgeTelegramData } from "@/lib/telegram-bot/maintenance";
import { purgeOAuthSignupTokens } from "@/lib/auth/social-login";


/** Gündəlik cron üçün idempotent premium və rezervasiya müddəti təmizliyi. */
export async function runPhase2Maintenance(now = new Date()) {
  const premium = await prisma.property.updateMany({
    where: { isFeatured: true, featuredUntil: { lt: now } },
    data: { isFeatured: false },
  });
  // VIP dövrləri (#248): müddəti bitən təsdiqlənmiş dövr `EXPIRED` olur (elan yuxarıda söndürüldü).
  const expiredVip = await expireVipGrants(now);
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
  // Saxlama müddəti bitmiş sənəd faylları (#256, PRD 19.4).
  const purgedDocuments = await purgeReviewedDocuments(now);
  // Hesab etibarlılığı (#258): son 7 gündə fəal hesabların davranış balı yenilənir.
  const trustRefreshed = await refreshActiveAccountsTrust(now).catch(() => 0);
  // Saxlama müddəti (#264, PRD 23.4): köhnə təhlükəsizlik hadisələri və giriş cəhdləri silinir.
  const securityLogs = await purgeSecurityLogs(now).catch(() => ({ events: 0, loginAttempts: 0 }));
  const knownDevices = await purgeKnownDevices(now).catch(() => 0);
  // Telegram: idempotentlik qeydləri, köhnə çatdırılma jurnalı, istifadə olunmuş tokenlər, bağlı dəstək müraciətləri.
  const telegram = await purgeTelegramData(now);
  const socialSignupTokens = await purgeOAuthSignupTokens(now).catch(() => 0);

  return {
    expiredPremium: premium.count,
    expiredVip,
    expiredReservations: expiring.length,
    expiredPartners: partners.count,
    listingExpiry,
    openHouseReminders,
    accountDeletions,
    deletedDomainEvents: domainEvents.count,
    prunedUniqueViews: uniqueViewKeys,
    purgedDocuments,
    trustRefreshed,
    securityLogs,
    knownDevices,
    telegram,
    socialSignupTokens,
  };
}
