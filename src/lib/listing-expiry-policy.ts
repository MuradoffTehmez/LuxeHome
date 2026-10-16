import { PROPERTY_STATUSES } from "@/lib/constants";

/**
 * Elan müddətinin saf qaydaları (#109) — Prisma idxal etmir ki, həm brauzer/kabinet
 * göstəricisi, həm də saf `property-input.ts` (dərc yolları) işlədə bilsin.
 */

export const LISTING_LIFETIME_DAYS = 60;
export const REMINDER_DAYS = 7;
export const BACKFILL_GRACE_DAYS = 14;
const DAY = 86_400_000;

/**
 * Aktuallıq intervalı (#204, PRD 5.2): elanın ömrü və «hələ aktualdırmı?» xatırlatmasının vaxtı
 * paneldən dəyişir (`SETTING_KEYS.LISTING_EXPIRY_CONFIG`, tək JSON). Defolt — yuxarıdakı sabitlər.
 */
export type ListingExpiryConfig = { lifetimeDays: number; reminderDays: number };

export const DEFAULT_LISTING_EXPIRY: ListingExpiryConfig = { lifetimeDays: LISTING_LIFETIME_DAYS, reminderDays: REMINDER_DAYS };
export const LIFETIME_DAYS_RANGE = { min: 7, max: 365 } as const;
export const REMINDER_DAYS_RANGE = { min: 1, max: 30 } as const;

/** Etibarlı konfiqurasiya: ömür 7–365 gün, xatırlatma 1–30 gün və ömürdən qısa. Əks halda `null`. */
export function validateExpiryConfig(input: { lifetimeDays: unknown; reminderDays: unknown }): ListingExpiryConfig | null {
  const lifetimeDays = Number(input.lifetimeDays);
  const reminderDays = Number(input.reminderDays);
  if (!Number.isInteger(lifetimeDays) || !Number.isInteger(reminderDays)) return null;
  if (lifetimeDays < LIFETIME_DAYS_RANGE.min || lifetimeDays > LIFETIME_DAYS_RANGE.max) return null;
  if (reminderDays < REMINDER_DAYS_RANGE.min || reminderDays > REMINDER_DAYS_RANGE.max || reminderDays >= lifetimeDays) return null;
  return { lifetimeDays, reminderDays };
}

/** Bazadakı JSON → konfiqurasiya; boş və ya pozulmuş dəyər defolta qayıdır (gündəlik iş dayanmasın). */
export function parseExpiryConfig(json: string | null | undefined): ListingExpiryConfig {
  if (!json) return DEFAULT_LISTING_EXPIRY;
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return validateExpiryConfig({ lifetimeDays: parsed?.lifetimeDays, reminderDays: parsed?.reminderDays }) ?? DEFAULT_LISTING_EXPIRY;
  } catch {
    return DEFAULT_LISTING_EXPIRY;
  }
}

export type ExpiryState = { state: "active" | "expiring" | "expired"; daysLeft: number } | null;

/** Kabinet göstəricisi üçün saf hesablama. */
export function expiryState(
  property: { status: string; listingExpiresAt: Date | null; expiredAt: Date | null },
  now = Date.now(),
  reminderDays = REMINDER_DAYS,
): ExpiryState {
  if (property.status === PROPERTY_STATUSES.EXPIRED) return { state: "expired", daysLeft: 0 };
  if (!property.listingExpiresAt || property.status !== PROPERTY_STATUSES.PUBLISHED) return null;
  const daysLeft = Math.max(0, Math.ceil((property.listingExpiresAt.getTime() - now) / DAY));
  return { state: daysLeft <= reminderDays ? "expiring" : "active", daysLeft };
}

/** Yeni müddət: bu andan `lifetimeDays` gün (defolt `LISTING_LIFETIME_DAYS`). */
export function renewedExpiry(now = new Date(), lifetimeDays = LISTING_LIFETIME_DAYS): Date {
  return new Date(now.getTime() + lifetimeDays * DAY);
}

/** Köhnə elana müddət: dərc + 60 gün, amma bu gündən ən az 14 gün sonra (qəfil arxiv olmasın). */
export function backfillExpiry(publishedAt: Date | null, now = new Date(), lifetimeDays = LISTING_LIFETIME_DAYS): Date {
  const natural = (publishedAt ?? now).getTime() + lifetimeDays * DAY;
  // Güzəşt ömürdən uzun ola bilməz (#204): paneldə 7–13 gün seçiləndə yeni elan da 14 gün yaşayardı.
  const grace = Math.min(BACKFILL_GRACE_DAYS, lifetimeDays);
  return new Date(Math.max(natural, now.getTime() + grace * DAY));
}

export type ExpiryFields = { listingExpiresAt?: Date | null; expiredAt?: Date | null };

/**
 * Elan yenidən dərc olunanda müddət işarələri (#109). Müddəti bitib arxivlənmiş və ya
 * vaxtı keçmiş elan redaktə/moderasiyadan sonra dərc olunursa, köhnə `listingExpiresAt`
 * gündəlik işin onu dərhal yenidən arxivləməsinə səbəb olardı — ona görə təzə müddət
 * başlayır. Qüvvədə olan müddətə toxunulmur (redaktə müddəti uzatmaq yolu olmasın).
 */
export function publicationExpiryReset(current: ExpiryFields, now = new Date(), lifetimeDays = LISTING_LIFETIME_DAYS) {
  const stale = current.expiredAt != null || (current.listingExpiresAt != null && current.listingExpiresAt.getTime() <= now.getTime());
  return stale ? { listingExpiresAt: renewedExpiry(now, lifetimeDays), expiredAt: null, expiryReminderSentAt: null } : {};
}
