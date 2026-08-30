"use client";

import { useTransition } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Bookmark, CalendarClock, CheckCheck, Sparkles, Trash2, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale, NotificationType } from "@/lib/constants";
import { localizePath, pathnameWithoutLocale } from "@/i18n/path-locale";
import { markAllNotificationsRead, markNotificationRead, deleteNotification } from "./actions";

export type NotificationListItem = {
  id: string;
  type: string;
  title: string;
  content: string;
  actionUrl: string | null;
  isRead: boolean;
  relativeTime: string;
};

const ICONS: Record<NotificationType, typeof Bookmark> = {
  SAVED_SEARCH_MATCH: Bookmark,
  PRICE_DROP: TrendingDown,
  RESERVATION_STATUS: CalendarClock,
  RECOMMENDATION: Sparkles,
  MEETING_REMINDER: CalendarClock,
};

function NotificationRow({ item }: { item: NotificationListItem }) {
  const t = useTranslations("account.notifications");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const Icon = ICONS[item.type as NotificationType] ?? Bookmark;

  function handleOpen() {
    if (item.isRead) return;
    startTransition(async () => {
      await markNotificationRead(item.id);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteNotification(item.id);
      router.refresh();
    });
  }

  const body = (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full",
          item.isRead ? "bg-beige text-ink-muted" : "bg-gold/15 text-gold-deep",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium [overflow-wrap:anywhere]", item.isRead ? "text-ink-soft" : "text-ink")}>
          {item.title}
        </p>
        <p className="mt-0.5 truncate text-sm text-ink-muted">{item.content}</p>
        <p className="mt-1 text-xs text-ink-muted">{item.relativeTime}</p>
      </div>
      {!item.isRead && <span aria-hidden="true" className="mt-1 size-2 shrink-0 rounded-full bg-gold" />}
    </div>
  );

  return (
    <li
      className={cn(
        "flex min-w-0 items-center gap-2 p-4 transition-colors",
        !item.isRead && "bg-gold/5",
      )}
    >
      {item.actionUrl ? (
        // Bildiriş bazada dilsiz yolla saxlanılır; link oxucunun cari dilinə burada
        // uyğunlaşdırılır. Köhnə qeydlərdə prefiks ola bilər — əvvəlcə təmizlənir.
        <NextLink
          href={localizePath(pathnameWithoutLocale(item.actionUrl), locale)}
          onClick={handleOpen}
          className="flex min-w-0 flex-1 items-start gap-3"
        >
          {body}
        </NextLink>
      ) : (
        <button type="button" onClick={handleOpen} className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left">
          {body}
        </button>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        aria-label={t("delete")}
        title={t("delete")}
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger disabled:opacity-50"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

export function NotificationList({ items }: { items: NotificationListItem[] }) {
  const t = useTranslations("account.notifications");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hasUnread = items.some((item) => !item.isRead);

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <div className="min-w-0">
      {hasUnread && (
        <div className="mb-4 flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={handleMarkAll} loading={pending}>
            <CheckCheck className="size-4" aria-hidden="true" />
            {t("markAllRead")}
          </Button>
        </div>
      )}
      <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-paper">
        {items.map((item) => (
          <NotificationRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}
