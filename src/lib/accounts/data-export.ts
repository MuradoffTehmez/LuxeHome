import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";

/**
 * «Məlumatlarımı yüklə» (#157) — hesabın şəxsi məlumatının maşın oxuyan JSON nüsxəsi
 * («Fərdi məlumatlar haqqında» Qanun, subyektin öz məlumatına çıxış hüququ).
 *
 * Qaydalar:
 * - **Yalnız bu şəxsə aid məlumat.** Başqasının şəxsi məlumatı (müraciət edənin nömrəsi,
 *   rəy yazanın adı, əməkdaşın e-poçtu) daxil edilmir; agentlik sahibinə komanda üzvlərinin
 *   yalnız adı və statusu verilir — onları kabinetdə onsuz da görür.
 * - **Gizli dəyər yoxdur:** parol heşi, TOTP sirri, ehtiyat kodlar, sessiya id-si, push
 *   açarları, dəvət/təqvim tokenləri çıxarılır.
 * - **D1-ə uyğun:** iç-içə əlaqə əvəzinə ayrı düz sorğular; uzun id siyahısı
 *   `findManyInChunks` ilə (100 parametr limiti).
 */

export const DATA_EXPORT_VERSION = 5;

export async function buildAccountExport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      telegram: true,
      verifiedPhone: true,
      birthDate: true,
      avatarUrl: true,
      accountType: true,
      companyName: true,
      companyTaxId: true,
      companyWebsite: true,
      position: true,
      emailVerifiedAt: true,
      approvedAt: true,
      locale: true,
      themePreference: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      googleSub: true,
    },
  });
  if (!user) return null;

  // Bağlı kənar kimliklər: Telegram istifadəçi adı və razılıq, sosial provayderlər — çat ID-si, OIDC `sub` və tokenlər yox.
  const [telegramAccount, authIdentities] = await Promise.all([
    prisma.telegramAccount.findUnique({ where: { userId }, select: { username: true, firstName: true, notificationsEnabled: true, linkedAt: true } }),
    prisma.authIdentity.findMany({ where: { userId }, select: { provider: true, email: true, createdAt: true, lastUsedAt: true } }),
  ]);

  const [
    agency,
    agentProfile,
    memberships,
    properties,
    favorites,
    savedSearches,
    notifications,
    notificationPreference,
    pushSubscriptions,
    sessions,
    reservations,
    packageOrders,
    reviewsWritten,
    agencyReviewsWritten,
    media,
  ] = await Promise.all([
    prisma.agency.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        phone: true,
        whatsapp: true,
        telegram: true,
        email: true,
        instagram: true,
        website: true,
        address: true,
        workingHours: true,
        isVerified: true,
        verifiedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.agentProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        slug: true,
        name: true,
        avatarUrl: true,
        roleTitle: true,
        specialization: true,
        experienceYears: true,
        bio: true,
        phone: true,
        whatsapp: true,
        email: true,
        languages: true,
        areas: true,
        isVerified: true,
        isPublic: true,
        rejectedAt: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.agencyEmployee.findMany({
      where: { userId },
      select: {
        role: true,
        status: true,
        source: true,
        invitedAt: true,
        approvedAt: true,
        decisionNote: true,
        agency: { select: { name: true, slug: true } },
      },
    }),
    prisma.property.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        listingType: true,
        status: true,
        price: true,
        currency: true,
        pricePeriod: true,
        address: true,
        rooms: true,
        area: true,
        floor: true,
        totalFloors: true,
        viewCount: true,
        publishedAt: true,
        listingExpiresAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favorite.findMany({ where: { userId }, select: { propertyId: true, createdAt: true } }),
    prisma.savedSearch.findMany({
      where: { userId },
      select: { id: true, name: true, filters: true, frequency: true, enabled: true, createdAt: true, lastNotifiedAt: true },
    }),
    prisma.notification.findMany({
      where: { userId },
      select: { type: true, title: true, content: true, actionUrl: true, readAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notificationPreference.findUnique({
      where: { userId },
      select: {
        savedSearchEmail: true,
        savedSearchWeb: true,
        savedSearchPush: true,
        priceDropEmail: true,
        priceDropWeb: true,
        priceDropPush: true,
        reservationEmail: true,
        reservationWeb: true,
        reservationPush: true,
        recommendationEnabled: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        updatedAt: true,
      },
    }),
    // Push şifrələmə açarları və tam endpoint gizli dəyərdir — yalnız cihaz izi.
    prisma.pushSubscription.findMany({
      where: { userId },
      select: { endpoint: true, locale: true, userAgent: true, createdAt: true, lastUsedAt: true },
    }),
    prisma.session.findMany({
      where: { userId },
      select: { createdAt: true, lastSeenAt: true, expiresAt: true, revokedAt: true, authKind: true, ip: true, userAgent: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reservation.findMany({
      where: { userId },
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        requestedFor: true,
        message: true,
        status: true,
        termsAcceptedAt: true,
        createdAt: true,
        property: { select: { title: true, slug: true } },
      },
    }),
    prisma.packageOrder.findMany({
      where: { userId },
      select: {
        packageName: true,
        durationDays: true,
        amountMinor: true,
        currency: true,
        status: true,
        paymentMethod: true,
        paidAt: true,
        activatedAt: true,
        cancelledAt: true,
        refundedAt: true,
        createdAt: true,
      },
    }),
    prisma.agentReview.findMany({
      where: { customerId: userId },
      select: {
        rating: true, ratingCommunication: true, ratingAccuracy: true, ratingResponsiveness: true, ratingProfessionalism: true,
        comment: true, serviceType: true, status: true, createdAt: true, agent: { select: { name: true } },
      },
    }),
    // Agentliyə yazdığı rəylər (#230) — rəyin özü şəxsin məlumatıdır; moderasiya qeydi və şübhə siqnalları daxil deyil.
    prisma.agencyReview.findMany({
      where: { customerId: userId },
      select: {
        rating: true, ratingCommunication: true, ratingAccuracy: true, ratingResponsiveness: true, ratingProfessionalism: true,
        comment: true, serviceType: true, status: true, createdAt: true, agency: { select: { name: true } },
      },
    }),
    prisma.media.findMany({
      where: { uploaderId: userId },
      select: { url: true, originalName: true, mimeType: true, size: true, createdAt: true },
    }),
  ]);

  // Üzvlük tarixçəsi (#210) — yalnız şəxsin öz dövrləri.
  const membershipHistory = await prisma.agencyMembershipHistory.findMany({
    where: { userId },
    select: { agencyName: true, role: true, joinedAt: true, leftAt: true, endReason: true, handedOver: true },
    orderBy: { joinedAt: "desc" },
  });

  const favoriteProperties = await findManyInChunks(
    favorites.map((favorite) => favorite.propertyId),
    0,
    (chunk) => prisma.property.findMany({ where: { id: { in: chunk } }, select: { id: true, title: true, slug: true } }),
  );
  // Agentlik sahibinə komanda üzvlərinin yalnız adı və statusu — e-poçt və telefon başqasınındır.
  const [offices, team] = agency
    ? await Promise.all([
        prisma.agencyOffice.findMany({
          where: { agencyId: agency.id },
          select: { name: true, address: true, phone: true, workingHours: true, city: { select: { name: true } } },
        }),
        prisma.agencyEmployee.findMany({
          where: { agencyId: agency.id },
          select: { status: true, source: true, invitedAt: true, approvedAt: true, user: { select: { name: true } } },
        }),
      ])
    : [[], []];

  const { googleSub, ...profile } = user;
  return {
    format: "luxehome-account-export",
    version: DATA_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: { ...profile, googleLinked: googleSub != null },
    telegram: telegramAccount,
    linkedLogins: authIdentities,
    agency: agency
      ? {
          ...agency,
          offices: offices.map(({ city, ...office }) => ({ ...office, city: city?.name ?? null })),
          team: team.map(({ user: member, ...entry }) => ({ ...entry, name: member.name })),
        }
      : null,
    agentProfile,
    agencyMemberships: memberships,
    agencyMembershipHistory: membershipHistory,
    properties,
    favorites: favorites.map((favorite) => ({
      createdAt: favorite.createdAt,
      property: favoriteProperties.find((property) => property.id === favorite.propertyId) ?? { id: favorite.propertyId },
    })),
    savedSearches,
    notifications,
    notificationPreference,
    pushSubscriptions: pushSubscriptions.map((subscription) => ({
      ...subscription,
      endpoint: safeOrigin(subscription.endpoint),
    })),
    sessions,
    reservations,
    packageOrders,
    reviewsWritten,
    agencyReviewsWritten,
    media,
  };
}

function safeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
