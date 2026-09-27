import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, NOTIFICATION_TYPES, PROPERTY_STATUSES, type Locale } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { emailHref, escapeHtml } from "@/lib/email-html";
import { siteUrl } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";
import { recordDomainEvent } from "@/lib/admin/events";

/**
 * Elan müddəti və yeniləmə (#109).
 *
 * Sahib və agentlik hesablarının elanları dərcdən sonra `LISTING_LIFETIME_DAYS` gün
 * aktiv qalır; bitməyə `REMINDER_DAYS` qalanda sahibə xatırlatma gedir, müddət bitəndə
 * elan arxivlənir (`expiredAt` işarəsi ilə — sahib bir kliklə bərpa edə bilsin).
 * Şirkətin öz portfeli (STAFF müəllifli) vaxtsızdır.
 *
 * Müddət dərc yollarında deyil, gündəlik işdə təyin olunur: müddəti olmayan dərc edilmiş
 * elana `publishedAt + 60 gün` (ən az `BACKFILL_GRACE_DAYS` gün sonra) yazılır. Beləliklə
 * yeni dərc yolu əlavə olunanda onu unutmaq mümkün deyil.
 */

export const LISTING_LIFETIME_DAYS = 60;
export const REMINDER_DAYS = 7;
export const BACKFILL_GRACE_DAYS = 14;
const DAY = 86_400_000;

const EXPIRING_ACCOUNT_TYPES = [ACCOUNT_TYPES.USER, ACCOUNT_TYPES.OWNER, ACCOUNT_TYPES.AGENCY];

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

const COPY = {
  az: {
    reminderTitle: "Elanınızın müddəti bitir",
    reminder: (title: string, days: number) => `«${title}» elanının müddəti ${days} gün sonra bitir. Aktual qalması üçün kabinetdən yeniləyin.`,
    expiredTitle: "Elanınız arxivləndi",
    expired: (title: string) => `«${title}» elanının müddəti bitdi və arxivləndi. Hələ aktualdırsa kabinetdən bir kliklə bərpa edin.`,
    link: "Elanlarıma keç",
  },
  en: {
    reminderTitle: "Your listing is about to expire",
    reminder: (title: string, days: number) => `Your listing “${title}” expires in ${days} days. Renew it in your account to keep it live.`,
    expiredTitle: "Your listing has been archived",
    expired: (title: string) => `Your listing “${title}” has expired and was archived. If it is still available, restore it from your account in one click.`,
    link: "Go to my listings",
  },
  ru: {
    reminderTitle: "Срок объявления заканчивается",
    reminder: (title: string, days: number) => `Срок объявления «${title}» истекает через ${days} дн. Продлите его в кабинете, чтобы оно оставалось активным.`,
    expiredTitle: "Объявление перенесено в архив",
    expired: (title: string) => `Срок объявления «${title}» истёк, оно перенесено в архив. Если оно ещё актуально, восстановите его в кабинете одним кликом.`,
    link: "Мои объявления",
  },
} as const;

const localeOf = (value: string | null | undefined): Locale => (value === "en" || value === "ru" ? value : "az");

async function notifyOwner(
  owner: { id: string; email: string; locale: string | null },
  kind: "reminder" | "expired",
  propertyId: string,
  title: string,
  days: number,
) {
  const locale = localeOf(owner.locale);
  const copy = COPY[locale];
  const content = kind === "reminder" ? copy.reminder(title, days) : copy.expired(title);
  const heading = kind === "reminder" ? copy.reminderTitle : copy.expiredTitle;
  await prisma.notification.create({
    data: {
      userId: owner.id,
      type: NOTIFICATION_TYPES.LISTING_EXPIRY,
      title: heading,
      content,
      actionUrl: "/kabinet/elanlar",
      dedupeKey: `listing-${kind}:${propertyId}:${days}`,
    },
  }).catch(() => undefined);
  const url = siteUrl(localizePath("/kabinet/elanlar", locale));
  await sendEmail({
    to: owner.email,
    subject: heading,
    html: `<p>${escapeHtml(content)}</p><p><a href="${emailHref(url)}">${copy.link}</a></p>`,
  }).catch(() => undefined);
}

/** Gündəlik iş: müddət təyini, xatırlatma və arxiv. İdempotentdir. */
export async function runListingExpiry(now = new Date()) {
  const owners = { author: { accountType: { in: EXPIRING_ACCOUNT_TYPES } } };

  const missing = await prisma.property.findMany({
    where: { deletedAt: null, status: PROPERTY_STATUSES.PUBLISHED, listingExpiresAt: null, ...owners },
    select: { id: true, publishedAt: true },
    take: 500,
  });
  for (const property of missing) {
    await prisma.property.update({ where: { id: property.id }, data: { listingExpiresAt: backfillExpiry(property.publishedAt, now) } });
  }

  const reminderCutoff = new Date(now.getTime() + REMINDER_DAYS * DAY);
  const expiring = await prisma.property.findMany({
    where: {
      deletedAt: null,
      status: PROPERTY_STATUSES.PUBLISHED,
      expiryReminderSentAt: null,
      listingExpiresAt: { gt: now, lte: reminderCutoff },
      ...owners,
    },
    select: { id: true, title: true, listingExpiresAt: true, author: { select: { id: true, email: true, locale: true } } },
    take: 200,
  });
  for (const property of expiring) {
    const days = Math.max(1, Math.ceil(((property.listingExpiresAt as Date).getTime() - now.getTime()) / DAY));
    if (property.author) await notifyOwner(property.author, "reminder", property.id, property.title, days);
    await prisma.property.update({ where: { id: property.id }, data: { expiryReminderSentAt: now } });
  }

  const expired = await prisma.property.findMany({
    where: { deletedAt: null, status: PROPERTY_STATUSES.PUBLISHED, listingExpiresAt: { lte: now }, ...owners },
    select: { id: true, title: true, author: { select: { id: true, email: true, locale: true } } },
    take: 200,
  });
  for (const property of expired) {
    await prisma.property.update({
      where: { id: property.id },
      data: { status: PROPERTY_STATUSES.ARCHIVED, expiredAt: now },
    });
    await recordDomainEvent("property.expired", "Property", property.id, { title: property.title });
    if (property.author) await notifyOwner(property.author, "expired", property.id, property.title, 0);
  }

  return { backfilled: missing.length, reminded: expiring.length, expired: expired.length, expiredIds: expired.map((item) => item.id) };
}
