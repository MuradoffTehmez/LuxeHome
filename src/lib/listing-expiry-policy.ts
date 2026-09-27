import { PROPERTY_STATUSES } from "@/lib/constants";

/**
 * Elan müddətinin saf qaydaları (#109) — Prisma idxal etmir ki, həm brauzer/kabinet
 * göstəricisi, həm də saf `property-input.ts` (dərc yolları) işlədə bilsin.
 */

export const LISTING_LIFETIME_DAYS = 60;
export const REMINDER_DAYS = 7;
export const BACKFILL_GRACE_DAYS = 14;
const DAY = 86_400_000;

export type ExpiryState = { state: "active" | "expiring" | "expired"; daysLeft: number } | null;

/** Kabinet göstəricisi üçün saf hesablama. */
export function expiryState(
  property: { status: string; listingExpiresAt: Date | null; expiredAt: Date | null },
  now = Date.now(),
): ExpiryState {
  if (property.expiredAt && property.status === PROPERTY_STATUSES.ARCHIVED) return { state: "expired", daysLeft: 0 };
  if (!property.listingExpiresAt || property.status !== PROPERTY_STATUSES.PUBLISHED) return null;
  const daysLeft = Math.max(0, Math.ceil((property.listingExpiresAt.getTime() - now) / DAY));
  return { state: daysLeft <= REMINDER_DAYS ? "expiring" : "active", daysLeft };
}

/** Yeni müddət: bu andan `LISTING_LIFETIME_DAYS` gün. */
export function renewedExpiry(now = new Date()): Date {
  return new Date(now.getTime() + LISTING_LIFETIME_DAYS * DAY);
}

/** Köhnə elana müddət: dərc + 60 gün, amma bu gündən ən az 14 gün sonra (qəfil arxiv olmasın). */
export function backfillExpiry(publishedAt: Date | null, now = new Date()): Date {
  const natural = (publishedAt ?? now).getTime() + LISTING_LIFETIME_DAYS * DAY;
  return new Date(Math.max(natural, now.getTime() + BACKFILL_GRACE_DAYS * DAY));
}

export type ExpiryFields = { listingExpiresAt?: Date | null; expiredAt?: Date | null };

/**
 * Elan yenidən dərc olunanda müddət işarələri (#109). Müddəti bitib arxivlənmiş və ya
 * vaxtı keçmiş elan redaktə/moderasiyadan sonra dərc olunursa, köhnə `listingExpiresAt`
 * gündəlik işin onu dərhal yenidən arxivləməsinə səbəb olardı — ona görə təzə müddət
 * başlayır. Qüvvədə olan müddətə toxunulmur (redaktə müddəti uzatmaq yolu olmasın).
 */
export function publicationExpiryReset(current: ExpiryFields, now = new Date()) {
  const stale = current.expiredAt != null || (current.listingExpiresAt != null && current.listingExpiresAt.getTime() <= now.getTime());
  return stale ? { listingExpiresAt: renewedExpiry(now), expiredAt: null, expiryReminderSentAt: null } : {};
}
