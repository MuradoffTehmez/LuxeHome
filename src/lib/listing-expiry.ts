import { prisma } from "@/lib/prisma";
import { NOTIFICATION_TYPES, PROPERTY_STATUSES, PUBLIC_ACCOUNT_TYPES, type Locale } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { emailHref, escapeHtml } from "@/lib/email-html";
import { siteUrl } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";
import { recordDomainEvent } from "@/lib/admin/events";
import { findManyInChunks } from "@/lib/d1-chunks";
import { REMINDER_DAYS, backfillExpiry, renewedExpiry } from "@/lib/listing-expiry-policy";

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

const DAY = 86_400_000;

/** Şirkət (STAFF) elanlarından başqa hamısı — yeni ictimai hesab növləri də daxil. */
const EXPIRING_ACCOUNT_TYPES = PUBLIC_ACCOUNT_TYPES;

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
  owner: Owner,
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

type Owner = { id: string; email: string; locale: string | null };

/**
 * Müəllifləri nested əlaqə ilə deyil, ayrıca və hissə-hissə oxuyur: 98-dən çox valideynli
 * əlaqə yüklənməsi D1-in 100 parametr həddini aşır və sorğunu ilişdirir.
 */
async function ownersById(authorIds: (string | null)[]): Promise<Map<string, Owner>> {
  const ids = [...new Set(authorIds.filter((id): id is string => Boolean(id)))];
  const owners = await findManyInChunks(ids, 0, (chunk) =>
    prisma.user.findMany({ where: { id: { in: chunk } }, select: { id: true, email: true, locale: true } }));
  return new Map(owners.map((owner) => [owner.id, owner]));
}

/** Gündəlik iş: müddət təyini, xatırlatma və arxiv. İdempotentdir. */
export async function runListingExpiry(now = new Date()) {
  const owners = { author: { accountType: { in: EXPIRING_ACCOUNT_TYPES } } };

  // Müddəti bitib arxivlənmiş, sonra hansısa yolla yenidən dərc olunmuş elan köhnə
  // `expiredAt`/`listingExpiresAt` daşıyırsa, onu təkrar arxivləmək yox — təzə müddət
  // vermək lazımdır. Dərc yolları bunu özü edir; bu addım unudulmuş yol üçün sığortadır.
  const republished = await prisma.property.updateMany({
    where: { deletedAt: null, status: PROPERTY_STATUSES.PUBLISHED, expiredAt: { not: null }, ...owners },
    data: { listingExpiresAt: renewedExpiry(now), expiredAt: null, expiryReminderSentAt: null },
  });

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
    select: { id: true, title: true, listingExpiresAt: true, authorId: true },
    take: 200,
  });
  const expiringOwners = await ownersById(expiring.map((property) => property.authorId));
  for (const property of expiring) {
    const days = Math.max(1, Math.ceil(((property.listingExpiresAt as Date).getTime() - now.getTime()) / DAY));
    const owner = property.authorId ? expiringOwners.get(property.authorId) : undefined;
    if (owner) await notifyOwner(owner, "reminder", property.id, property.title, days);
    await prisma.property.update({ where: { id: property.id }, data: { expiryReminderSentAt: now } });
  }

  const expired = await prisma.property.findMany({
    where: { deletedAt: null, status: PROPERTY_STATUSES.PUBLISHED, listingExpiresAt: { lte: now }, ...owners },
    select: { id: true, title: true, authorId: true },
    take: 200,
  });
  const expiredOwners = await ownersById(expired.map((property) => property.authorId));
  for (const property of expired) {
    await prisma.property.update({
      where: { id: property.id },
      data: { status: PROPERTY_STATUSES.ARCHIVED, expiredAt: now },
    });
    await recordDomainEvent("property.expired", "Property", property.id, { title: property.title });
    const owner = property.authorId ? expiredOwners.get(property.authorId) : undefined;
    if (owner) await notifyOwner(owner, "expired", property.id, property.title, 0);
  }

  return {
    renewed: republished.count,
    backfilled: missing.length,
    reminded: expiring.length,
    expired: expired.length,
    expiredIds: expired.map((item) => item.id),
  };
}
