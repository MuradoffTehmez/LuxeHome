import type { NotificationType } from "@/lib/constants";
import { NOTIFICATION_CATEGORIES, NOTIFICATION_TYPE_CATEGORY, type NotificationCategory } from "@/lib/notification-categories";

/**
 * Bildiriş mərkəzinin görünüş və filtr vəziyyəti (saf modul — Prisma idxal etmir).
 *
 * Səhifənin əsas görünüşü bildiriş siyahısıdır; parametrlər ayrıca tabdadır (`?gorunus=parametrler`),
 * ona görə seçimlər siyahını aşağı itələmir. Vəziyyət yalnız URL-dədir: tab və filtrlər server
 * komponentində oxunur, klaviatura və geri düyməsi adi link kimi işləyir.
 */

export const NOTIFICATION_VIEWS = ["list", "settings"] as const;
export type NotificationView = (typeof NOTIFICATION_VIEWS)[number];

export const NOTIFICATION_READ_FILTERS = ["all", "unread", "read"] as const;
export type NotificationReadFilter = (typeof NOTIFICATION_READ_FILTERS)[number];

/** URL dəyərləri azərbaycancadır (layihənin query konvensiyası). */
const VIEW_PARAM: Record<NotificationView, string | null> = { list: null, settings: "parametrler" };
const READ_PARAM: Record<NotificationReadFilter, string | null> = { all: null, unread: "oxunmamis", read: "oxunmus" };

export type NotificationFilterState = {
  view: NotificationView;
  read: NotificationReadFilter;
  category: NotificationCategory | null;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseNotificationFilters(params: RawParams): NotificationFilterState {
  const view = first(params.gorunus) === VIEW_PARAM.settings ? "settings" : "list";
  const readParam = first(params.status);
  const read = (NOTIFICATION_READ_FILTERS.find((key) => READ_PARAM[key] !== null && READ_PARAM[key] === readParam) ?? "all");
  const categoryParam = first(params.kateqoriya);
  const category = NOTIFICATION_CATEGORIES.find((value) => value === categoryParam) ?? null;
  return { view, read, category };
}

/** Vəziyyətdən dilsiz kabinet yolu; defolt dəyərlər URL-ə yazılmır. */
export function notificationFilterHref(state: Partial<NotificationFilterState>): string {
  const params = new URLSearchParams();
  const view = state.view ?? "list";
  if (VIEW_PARAM[view]) params.set("gorunus", VIEW_PARAM[view]!);
  if (view === "list") {
    const read = state.read ?? "all";
    if (READ_PARAM[read]) params.set("status", READ_PARAM[read]!);
    if (state.category) params.set("kateqoriya", state.category);
  }
  const query = params.toString();
  return query ? `/kabinet/bildirisler?${query}` : "/kabinet/bildirisler";
}

/** Kateqoriyanın bildiriş tipləri — `type IN (...)` şərti üçün. */
export function notificationTypesFor(category: NotificationCategory): NotificationType[] {
  return (Object.keys(NOTIFICATION_TYPE_CATEGORY) as NotificationType[]).filter((type) => NOTIFICATION_TYPE_CATEGORY[type] === category);
}

/** Siyahı sorğusunun `where` şərti (istifadəçi id-si çağıran tərəfdən əlavə olunur). */
export function notificationListWhere(state: NotificationFilterState): { readAt?: null | { not: null }; type?: { in: NotificationType[] } } {
  const where: { readAt?: null | { not: null }; type?: { in: NotificationType[] } } = {};
  if (state.read === "unread") where.readAt = null;
  if (state.read === "read") where.readAt = { not: null };
  if (state.category) where.type = { in: notificationTypesFor(state.category) };
  return where;
}

/** Tip üzrə saylardan kateqoriya sayları; boş kateqoriya çip zolağına düşmür. */
export function countByCategory(rows: readonly { type: string; count: number }[]): Partial<Record<NotificationCategory, number>> {
  const result: Partial<Record<NotificationCategory, number>> = {};
  for (const row of rows) {
    const category = NOTIFICATION_TYPE_CATEGORY[row.type as NotificationType];
    if (!category) continue;
    result[category] = (result[category] ?? 0) + row.count;
  }
  return result;
}
