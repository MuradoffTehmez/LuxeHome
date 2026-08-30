import { prisma } from "@/lib/prisma";
import { NOTIFICATION_TYPES, type Locale } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";
import { sendPushToUser } from "@/lib/push";

type PriceChangeInput = {
  propertyId: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  changedById?: string | null;
  source: "ADMIN" | "OWNER" | "IMPORT" | "SYSTEM";
};

const COPY = {
  az: {
    title: "Favoritinizdəki əmlakın qiyməti düşdü",
    content: (title: string, oldPrice: string, newPrice: string) =>
      `${title}: ${oldPrice} → ${newPrice}`,
    subject: (title: string) => `${title} — qiymət endirimi`,
    link: "Elana bax",
  },
  en: {
    title: "The price of a saved property has dropped",
    content: (title: string, oldPrice: string, newPrice: string) =>
      `${title}: ${oldPrice} → ${newPrice}`,
    subject: (title: string) => `${title} — price drop`,
    link: "View listing",
  },
  ru: {
    title: "Цена сохранённого объекта снизилась",
    content: (title: string, oldPrice: string, newPrice: string) =>
      `${title}: ${oldPrice} → ${newPrice}`,
    subject: (title: string) => `${title} — снижение цены`,
    link: "Смотреть объявление",
  },
} as const;

function localeOf(value: string): Locale {
  return value === "en" || value === "ru" ? value : "az";
}

/**
 * Append-only qiymət tarixçəsini və favorit sahiblərinin alert-lərini yaradır.
 * Qiymət artımı tarixçəyə düşür, amma alert yalnız azalma üçün göndərilir.
 */
export async function recordPropertyPriceChange(input: PriceChangeInput): Promise<void> {
  if (input.oldPrice === input.newPrice) return;

  const history = await prisma.propertyPriceHistory.create({
    data: {
      propertyId: input.propertyId,
      oldPrice: input.oldPrice,
      newPrice: input.newPrice,
      currency: input.currency,
      source: input.source,
      changedById: input.changedById ?? null,
    },
    select: {
      id: true,
      property: { select: { title: true, slug: true } },
    },
  });

  if (input.newPrice >= input.oldPrice) return;

  const favorites = await prisma.favorite.findMany({
    where: { propertyId: input.propertyId },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          locale: true,
          notificationPreference: {
            select: { priceDropEmail: true, priceDropWeb: true, priceDropPush: true },
          },
        },
      },
    },
  });

  for (const { user } of favorites) {
    const locale = localeOf(user.locale);
    const copy = COPY[locale];
    const oldPrice = formatPrice(input.oldPrice, input.currency);
    const newPrice = formatPrice(input.newPrice, input.currency);
    const content = copy.content(history.property.title, oldPrice, newPrice);
    const preferences = user.notificationPreference;

    if (preferences?.priceDropWeb !== false) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: NOTIFICATION_TYPES.PRICE_DROP,
          title: copy.title,
          content,
          actionUrl: `/emlaklar/${history.property.slug}`,
          dedupeKey: `price-drop:${history.id}:${user.id}`,
        },
      }).catch(() => undefined);
    }

    if (preferences?.priceDropEmail !== false) {
      const propertyUrl = siteUrl(localizePath(`/emlaklar/${history.property.slug}`, locale));
      await sendEmail({
        to: user.email,
        subject: copy.subject(history.property.title),
        html: `<p>${content}</p><p><a href="${propertyUrl}">${copy.link}</a></p>`,
      });
    }

    if (preferences?.priceDropPush) {
      await sendPushToUser(user.id, { title: copy.title, body: content, url: localizePath(`/emlaklar/${history.property.slug}`, locale), tag: `price-drop-${history.id}` });
    }
  }
}
