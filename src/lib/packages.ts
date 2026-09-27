import { prisma } from "@/lib/prisma";
import {
  NOTIFICATION_TYPES,
  PACKAGE_ORDER_SOURCES,
  PACKAGE_ORDER_STATUSES,
  PROPERTY_STATUSES,
  type Locale,
  type PaymentMethod,
} from "@/lib/constants";
import { recordDomainEvent } from "@/lib/admin/events";
import {
  MAX_PENDING_ORDERS_PER_USER,
  bakuMonthStart,
  extendPremium,
  isUnlimitedPremium,
  shrinkPremium,
} from "@/lib/package-math";

/**
 * Premium paketləri və ödəniş uçotu (#109).
 *
 * Real ödəniş provayderi yoxdur: istifadəçi kabinetdən sifariş verir (və ya menecer
 * paneldə daxil edir), ödəniş ofisdə/köçürmə ilə alınır və menecer onu «ödənildi» kimi
 * qeyd edir. Premium yalnız bu anda tətbiq olunur.
 *
 * D1 tranzaksiya dəstəkləmir, ona görə status keçidləri şərti `updateMany` ilə edilir:
 * iki menecer eyni sifarişi eyni anda təsdiqləsə, yalnız biri keçidi qazanır və premium
 * iki dəfə uzadılmır. Aktivləşdirmə də ayrıca `activatedAt: null` şərti ilə qorunur.
 */

export type OrderFailure =
  | "not-found"
  | "package-inactive"
  | "property-unavailable"
  | "too-many-pending"
  | "duplicate-pending"
  | "invalid-status";

export type OrderResult<T = object> = ({ ok: true } & T) | { ok: false; reason: OrderFailure };

export function getActivePackages() {
  return prisma.listingPackage.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { durationDays: "asc" }],
    select: { id: true, name: true, description: true, durationDays: true, priceMinor: true },
  });
}

/** Kabinet sifarişi: yalnız istifadəçinin öz dərc olunmuş elanı üçün. */
export async function createCabinetOrder(input: {
  user: { id: string; name: string; phone: string | null };
  propertyId: string;
  packageId: string;
}): Promise<OrderResult<{ orderId: string; propertyTitle: string; packageName: string; amountMinor: number }>> {
  const [pkg, property, pending] = await Promise.all([
    prisma.listingPackage.findUnique({ where: { id: input.packageId }, select: { id: true, name: true, durationDays: true, priceMinor: true, isActive: true } }),
    prisma.property.findFirst({
      where: { id: input.propertyId, authorId: input.user.id, deletedAt: null, status: PROPERTY_STATUSES.PUBLISHED },
      select: { id: true, title: true },
    }),
    prisma.packageOrder.findMany({
      where: { userId: input.user.id, status: PACKAGE_ORDER_STATUSES.PENDING },
      select: { propertyId: true, packageId: true },
    }),
  ]);
  if (!pkg || !pkg.isActive) return { ok: false, reason: "package-inactive" };
  if (!property) return { ok: false, reason: "property-unavailable" };
  if (pending.some((order) => order.propertyId === property.id && order.packageId === pkg.id)) {
    return { ok: false, reason: "duplicate-pending" };
  }
  if (pending.length >= MAX_PENDING_ORDERS_PER_USER) return { ok: false, reason: "too-many-pending" };

  const order = await prisma.packageOrder.create({
    data: {
      packageId: pkg.id,
      packageName: pkg.name,
      durationDays: pkg.durationDays,
      amountMinor: pkg.priceMinor,
      userId: input.user.id,
      propertyId: property.id,
      customerName: input.user.name,
      customerPhone: input.user.phone,
      source: PACKAGE_ORDER_SOURCES.CABINET,
    },
    select: { id: true },
  });
  await recordDomainEvent("package.ordered", "PackageOrder", order.id, { propertyId: property.id, packageId: pkg.id });
  return { ok: true, orderId: order.id, propertyTitle: property.title, packageName: pkg.name, amountMinor: pkg.priceMinor };
}

/** Panel sifarişi: ödəniş artıq alınıbsa dərhal «ödənildi» kimi qeyd olunur və aktivləşdirilir. */
export async function createAdminOrder(input: {
  packageId: string;
  propertyId: string;
  customerName: string;
  customerPhone: string | null;
  note: string | null;
  recordedById: string;
  payment: { method: PaymentMethod; reference: string | null } | null;
}): Promise<OrderResult<{ orderId: string; activated: boolean }>> {
  const [pkg, property] = await Promise.all([
    prisma.listingPackage.findUnique({ where: { id: input.packageId }, select: { id: true, name: true, durationDays: true, priceMinor: true } }),
    prisma.property.findFirst({ where: { id: input.propertyId, deletedAt: null }, select: { id: true, authorId: true } }),
  ]);
  if (!pkg) return { ok: false, reason: "package-inactive" };
  if (!property) return { ok: false, reason: "property-unavailable" };

  const order = await prisma.packageOrder.create({
    data: {
      packageId: pkg.id,
      packageName: pkg.name,
      durationDays: pkg.durationDays,
      amountMinor: pkg.priceMinor,
      propertyId: property.id,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      note: input.note,
      source: PACKAGE_ORDER_SOURCES.ADMIN,
      recordedById: input.recordedById,
    },
    select: { id: true },
  });
  if (!input.payment) return { ok: true, orderId: order.id, activated: false };
  const paid = await markOrderPaid(order.id, input.payment, input.recordedById);
  return paid.ok ? { ok: true, orderId: order.id, activated: paid.activated } : paid;
}

/** Gözləyən sifarişi ödənilmiş kimi qeyd edir və mümkündürsə premiumu tətbiq edir. */
export async function markOrderPaid(
  orderId: string,
  payment: { method: PaymentMethod; reference: string | null },
  actorId: string,
  now = new Date(),
): Promise<OrderResult<{ activated: boolean }>> {
  const claimed = await prisma.packageOrder.updateMany({
    where: { id: orderId, status: PACKAGE_ORDER_STATUSES.PENDING },
    data: {
      status: PACKAGE_ORDER_STATUSES.PAID,
      paymentMethod: payment.method,
      paymentReference: payment.reference,
      paidAt: now,
      recordedById: actorId,
    },
  });
  if (claimed.count === 0) {
    const exists = await prisma.packageOrder.count({ where: { id: orderId } });
    return { ok: false, reason: exists ? "invalid-status" : "not-found" };
  }
  await recordDomainEvent("package.paid", "PackageOrder", orderId, { method: payment.method, by: actorId });
  const activation = await activateOrder(orderId, now);
  return { ok: true, activated: activation.ok };
}

/**
 * Ödənilmiş, amma hələ tətbiq olunmamış sifarişin premiumunu elana yazır.
 * Elan dərc olunmayıbsa (moderasiyada, arxivdə) sifariş gözləyir — menecer elan
 * dərc olunandan sonra «Aktivləşdir» ilə təkrar sınayır.
 */
export async function activateOrder(orderId: string, now = new Date()): Promise<OrderResult<{ propertySlug: string }>> {
  const order = await prisma.packageOrder.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      activatedAt: true,
      durationDays: true,
      userId: true,
      packageName: true,
      property: { select: { id: true, slug: true, title: true, status: true, deletedAt: true, isFeatured: true, featuredUntil: true } },
    },
  });
  if (!order) return { ok: false, reason: "not-found" };
  if (order.status !== PACKAGE_ORDER_STATUSES.PAID || order.activatedAt) return { ok: false, reason: "invalid-status" };
  const property = order.property;
  if (!property || property.deletedAt || property.status !== PROPERTY_STATUSES.PUBLISHED) {
    return { ok: false, reason: "property-unavailable" };
  }

  const claimed = await prisma.packageOrder.updateMany({
    where: { id: orderId, status: PACKAGE_ORDER_STATUSES.PAID, activatedAt: null },
    data: { activatedAt: now },
  });
  if (claimed.count === 0) return { ok: false, reason: "invalid-status" };

  const next = extendPremium(property, order.durationDays, now);
  if (!isUnlimitedPremium(property)) {
    await prisma.property.update({ where: { id: property.id }, data: next });
  }
  if (order.userId) {
    await notifyCustomer(order.userId, property.title, order.durationDays, `package-activated:${orderId}`);
  }
  return { ok: true, propertySlug: property.slug };
}

/** Gözləyən sifarişi ləğv edir. `ownerId` verilərsə, yalnız həmin istifadəçinin sifarişi. */
export async function cancelOrder(orderId: string, ownerId?: string, now = new Date()): Promise<OrderResult> {
  const cancelled = await prisma.packageOrder.updateMany({
    where: { id: orderId, status: PACKAGE_ORDER_STATUSES.PENDING, ...(ownerId ? { userId: ownerId } : {}) },
    data: { status: PACKAGE_ORDER_STATUSES.CANCELLED, cancelledAt: now },
  });
  if (cancelled.count === 0) return { ok: false, reason: "invalid-status" };
  await recordDomainEvent("package.cancelled", "PackageOrder", orderId, { by: ownerId ?? "staff" });
  return { ok: true };
}

/** Ödənilmiş sifarişi geri qaytarır; tətbiq olunubsa premium müddətindən çıxılır. */
export async function refundOrder(orderId: string, actorId: string, now = new Date()): Promise<OrderResult<{ propertySlug: string | null }>> {
  const order = await prisma.packageOrder.findUnique({
    where: { id: orderId },
    select: { activatedAt: true, durationDays: true, property: { select: { id: true, slug: true, isFeatured: true, featuredUntil: true } } },
  });
  if (!order) return { ok: false, reason: "not-found" };
  const claimed = await prisma.packageOrder.updateMany({
    where: { id: orderId, status: PACKAGE_ORDER_STATUSES.PAID },
    data: { status: PACKAGE_ORDER_STATUSES.REFUNDED, refundedAt: now },
  });
  if (claimed.count === 0) return { ok: false, reason: "invalid-status" };

  if (order.activatedAt && order.property) {
    await prisma.property.update({ where: { id: order.property.id }, data: shrinkPremium(order.property, order.durationDays, now) });
  }
  await recordDomainEvent("package.refunded", "PackageOrder", orderId, { by: actorId });
  return { ok: true, propertySlug: order.activatedAt ? order.property?.slug ?? null : null };
}

/** Panel xülasəsi: bu ayın gəliri, gözləyən sifarişlər və aktiv premium elanlar. */
export async function getBillingSummary(now = new Date()) {
  const [monthRevenue, pending, awaitingActivation, activePremium] = await Promise.all([
    prisma.packageOrder.aggregate({
      where: { status: PACKAGE_ORDER_STATUSES.PAID, paidAt: { gte: bakuMonthStart(now) } },
      _sum: { amountMinor: true },
      _count: true,
    }),
    prisma.packageOrder.count({ where: { status: PACKAGE_ORDER_STATUSES.PENDING } }),
    prisma.packageOrder.count({ where: { status: PACKAGE_ORDER_STATUSES.PAID, activatedAt: null } }),
    prisma.property.count({ where: { deletedAt: null, isFeatured: true, featuredUntil: { gt: now } } }),
  ]);
  return {
    monthRevenueMinor: monthRevenue._sum.amountMinor ?? 0,
    monthPaidCount: monthRevenue._count,
    pending,
    awaitingActivation,
    activePremium,
  };
}

const COPY = {
  az: {
    title: "Premium aktivləşdi",
    body: (title: string, days: number) => `«${title}» elanı ${days} günlük premium paketlə axtarışda önə çıxarıldı.`,
  },
  en: {
    title: "Premium is active",
    body: (title: string, days: number) => `Your listing “${title}” is now promoted with a ${days}-day premium package.`,
  },
  ru: {
    title: "Премиум активирован",
    body: (title: string, days: number) => `Объявление «${title}» продвигается премиум-пакетом на ${days} дн.`,
  },
} as const;

async function notifyCustomer(userId: string, title: string, days: number, dedupeKey: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { locale: true } });
  const locale: Locale = user?.locale === "en" || user?.locale === "ru" ? user.locale : "az";
  await prisma.notification.create({
    data: {
      userId,
      type: NOTIFICATION_TYPES.PACKAGE,
      title: COPY[locale].title,
      content: COPY[locale].body(title, days),
      actionUrl: "/kabinet/paketler",
      dedupeKey,
    },
  }).catch(() => undefined);
}
