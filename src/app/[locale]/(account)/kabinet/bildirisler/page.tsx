import type { Metadata } from "next";
import { Bell, Settings2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { FilterChip, FilterChipRow } from "@/components/ui/filter-chip";
import { requireAccount } from "@/lib/auth/guard";
import { type Locale } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildManagedMetadata } from "@/lib/seo";
import { localizePath } from "@/i18n/path-locale";
import { formatLocalizedRelative } from "@/i18n/date";
import { resolveNotificationPreferences } from "@/lib/notification-preferences";
import { NOTIFICATION_CATEGORIES, parseCategoryChannels } from "@/lib/notification-categories";
import {
  countByCategory,
  notificationFilterHref,
  notificationListWhere,
  parseNotificationFilters,
  type NotificationFilterState,
} from "@/lib/notification-filters";
import { NotificationList, type NotificationListItem } from "./notification-list";
import { NotificationPreferences } from "./notification-preferences";
import { PushPreferences } from "./push-preferences";
import { CategoryPreferences } from "./category-preferences";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.notifications" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/bildirisler", noIndex: true, locale: locale as Locale });
}

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Bildiriş mərkəzi: əsas görünüş birbaşa siyahıdır (hamısı / oxunmamış / oxunmuş + kateqoriya çipləri),
 * kanal seçimləri ayrıca «Parametrlər» tabındadır. Əvvəl üç seçim bloku siyahını ekranın altına itələyirdi.
 */
export default async function NotificationsPage({ searchParams }: PageProps) {
  const locale = (await getLocale()) as Locale;
  const user = await requireAccount(locale);
  const t = await getTranslations("account.notifications");
  const filters = parseNotificationFilters(await searchParams);

  const [total, unread] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  const tabs = (
    <SegmentedTabs
      label={t("tabs.label")}
      className="mt-6"
      items={[
        { href: notificationFilterHref({ view: "list" }), label: t("tabs.list"), active: filters.view === "list", count: unread, icon: Bell },
        { href: notificationFilterHref({ view: "settings" }), label: t("tabs.settings"), active: filters.view === "settings", icon: Settings2 },
      ]}
    />
  );

  return (
    <div className="min-w-0">
      <PageHeader
        contained
        compact
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={unread > 0 ? t("summaryUnread", { count: total, unread }) : t("count", { count: total })}
      />
      {tabs}
      <div className="mt-6">
        {filters.view === "settings" ? <SettingsView userId={user.id} /> : <ListView userId={user.id} filters={filters} locale={locale} unread={unread} total={total} />}
      </div>
    </div>
  );
}

async function ListView({ userId, filters, locale, unread, total }: { userId: string; filters: NotificationFilterState; locale: Locale; unread: number; total: number }) {
  const t = await getTranslations("account.notifications");
  const [notifications, byType] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, ...notificationListWhere(filters) },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.notification.groupBy({ by: ["type"], where: { userId }, _count: { _all: true } }),
  ]);
  const categoryCounts = countByCategory(byType.map((row) => ({ type: row.type, count: row._count._all })));
  const categories = NOTIFICATION_CATEGORIES.filter((category) => (categoryCounts[category] ?? 0) > 0);

  const items: NotificationListItem[] = notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    actionUrl: notification.actionUrl,
    isRead: notification.readAt !== null,
    relativeTime: formatLocalizedRelative(notification.createdAt, locale) ?? "",
  }));

  if (total === 0) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        description={t("emptyDescription")}
        action={{ label: t("emptyAction"), href: localizePath("/emlaklar", locale), localized: false }}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedTabs
          label={t("filters.readLabel")}
          variant="pills"
          className="sm:w-fit"
          items={(["all", "unread", "read"] as const).map((read) => ({
            href: notificationFilterHref({ ...filters, read }),
            label: t(`filters.read.${read}`),
            active: filters.read === read,
            count: read === "unread" ? unread : undefined,
          }))}
        />
      </div>
      {categories.length > 1 && (
        <FilterChipRow label={t("filters.categoryLabel")}>
          <FilterChip href={notificationFilterHref({ ...filters, category: null })} active={filters.category === null} className="min-h-10 px-4">
            {t("filters.allCategories")}
          </FilterChip>
          {categories.map((category) => (
            <FilterChip key={category} href={notificationFilterHref({ ...filters, category })} active={filters.category === category} className="min-h-10 px-4">
              {t(`center.categories.${category}.label`)}
              <span className="text-xs tabular-nums opacity-70">{categoryCounts[category]}</span>
            </FilterChip>
          ))}
        </FilterChipRow>
      )}
      {items.length > 0 ? (
        <NotificationList items={items} hasUnread={unread > 0} />
      ) : (
        <EmptyState
          title={t("filteredEmptyTitle")}
          description={t("filteredEmptyDescription")}
          action={{ label: t("filters.reset"), href: localizePath(notificationFilterHref({ view: "list" }), locale), localized: false }}
        />
      )}
    </div>
  );
}

async function SettingsView({ userId }: { userId: string }) {
  const storedPreference = await prisma.notificationPreference.findUnique({ where: { userId } });
  const preferences = resolveNotificationPreferences(storedPreference);
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PushPreferences />
      <CategoryPreferences values={parseCategoryChannels(storedPreference?.categoryChannels)} />
      <NotificationPreferences values={preferences} />
    </div>
  );
}
