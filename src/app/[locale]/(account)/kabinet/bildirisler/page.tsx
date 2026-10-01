import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { requireAccount } from "@/lib/auth/guard";
import { type Locale } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildManagedMetadata } from "@/lib/seo";
import { localizePath } from "@/i18n/path-locale";
import { formatLocalizedRelative } from "@/i18n/date";
import { resolveNotificationPreferences } from "@/lib/notification-preferences";
import { NotificationList, type NotificationListItem } from "./notification-list";
import { NotificationPreferences } from "./notification-preferences";
import { PushPreferences } from "./push-preferences";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.notifications" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/bildirisler", noIndex: true, locale: locale as Locale });
}

export default async function NotificationsPage() {
  const locale = (await getLocale()) as Locale;
  const user = await requireAccount(locale);
  const t = await getTranslations("account.notifications");

  const [notifications, storedPreference] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.notificationPreference.findUnique({ where: { userId: user.id } }),
  ]);
  const preferences = resolveNotificationPreferences(storedPreference);

  const items: NotificationListItem[] = notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    actionUrl: notification.actionUrl,
    isRead: notification.readAt !== null,
    relativeTime: formatLocalizedRelative(notification.createdAt, locale) ?? "",
  }));

  return (
    <div className="min-w-0">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("count", { count: items.length })} />

      <div className="mt-8">
        <PushPreferences />
        <NotificationPreferences values={preferences} />
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
