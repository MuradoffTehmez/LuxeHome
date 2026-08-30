import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { requireAccount } from "@/lib/auth/guard";
import { type Locale } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { localizePath } from "@/i18n/path-locale";
import { NotificationList, type NotificationListItem } from "./notification-list";
import { PushPreferences } from "./push-preferences";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.notifications" });
  return buildMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/bildirisler", noIndex: true, locale: locale as Locale });
}

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

/** `createdAt`-i "3 saat əvvəl" formatında insan-oxunaqlı nisbi vaxta çevirir. */
function formatRelativeTime(date: Date, locale: Locale): string {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  let duration = (date.getTime() - Date.now()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return formatter.format(Math.round(duration), "years");
}

export default async function NotificationsPage() {
  const locale = (await getLocale()) as Locale;
  const user = await requireAccount(locale);
  const t = await getTranslations("account.notifications");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const items: NotificationListItem[] = notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    actionUrl: notification.actionUrl,
    isRead: notification.readAt !== null,
    relativeTime: formatRelativeTime(notification.createdAt, locale),
  }));

  return (
    <div className="min-w-0">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("count", { count: items.length })} />

      <div className="mt-8">
        <PushPreferences />
        {items.length > 0 ? (
          <NotificationList items={items} />
        ) : (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={{ label: t("emptyAction"), href: localizePath("/emlaklar", locale), localized: false }}
          />
        )}
      </div>
    </div>
  );
}
