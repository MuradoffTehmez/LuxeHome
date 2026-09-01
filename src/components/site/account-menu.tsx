"use client";

import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Bell, LayoutDashboard, LogIn, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useSessionState } from "./use-session-state";

/**
 * Naviqasiyadakı hesab bölməsi.
 *
 * Sessiya vəziyyəti `useSessionState()`-dən gəlir — həmin hook `/api/hesab/menu`
 * cavabını modul səviyyəsində keşləyir və eyni səhifədəki digər istifadəçiyə
 * bağlı komponentlərlə (məsələn «axtarışı saxla» düyməsi) bölüşür.
 */

export function AccountMenu({
  isOverlay = false,
  variant = "desktop",
}: {
  isOverlay?: boolean;
  variant?: "desktop" | "mobile";
}) {
  const t = useTranslations("auth");
  const state = useSessionState(t("myAccount"));

  if (state.status === "loading") return null;

  const linkClass = cn(
    "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xs text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
    variant === "mobile" ? "w-full justify-center" : "min-w-11 justify-center rounded-full px-2 min-[1800px]:min-w-0 min-[1800px]:justify-start min-[1800px]:px-1",
    isOverlay ? "text-white hover:bg-white/10 hover:text-gold-soft" : "text-ink hover:bg-beige hover:text-gold-deep",
  );

  if (state.status === "anonymous") {
    return (
      <div className={cn("flex items-center gap-3", variant === "mobile" && "flex-col items-stretch gap-2")}>
        <Link href="/daxil-ol" aria-label={t("login")} className={linkClass}>
          <LogIn className="size-4" aria-hidden="true" />
          <span className={cn(variant === "desktop" && "sr-only min-[1800px]:not-sr-only")}>{t("login")}</span>
        </Link>
        <Link
          href="/qeydiyyat"
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center justify-center rounded-xs border px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-200",
            variant === "mobile" ? "w-full" : "hidden",
            isOverlay
              ? "border-white/40 text-ink-invert hover:border-gold-soft hover:text-gold-soft"
              : "border-ink-soft/40 text-ink hover:border-gold hover:text-gold-deep hover:bg-gold/5",
          )}
        >
          {t("register")}
        </Link>
      </div>
    );
  }

  const contents = (
    <>
      {state.isStaff ? (
        <LayoutDashboard className="size-4" aria-hidden="true" />
      ) : (
        <UserRound className="size-4" aria-hidden="true" />
      )}
      <span className={cn("max-w-28 truncate", variant === "desktop" && "sr-only min-[1800px]:not-sr-only")}>
        {state.isStaff ? t("adminPanel") : state.name}
      </span>
    </>
  );

  if (state.isStaff) {
    return (
      <NextLink href="/admin" aria-label={t("adminPanel")} className={linkClass}>
        {contents}
      </NextLink>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", variant === "mobile" && "flex-col items-stretch gap-2")}>
      <Link
        href="/kabinet/bildirisler"
        aria-label={
          state.unreadNotifications > 0
            ? t("notificationsUnread", { count: state.unreadNotifications })
            : t("notifications")
        }
        className={cn(linkClass, "relative", variant === "desktop" && "min-w-11 min-[1800px]:min-w-11 min-[1800px]:justify-center min-[1800px]:px-0")}
      >
        <Bell className="size-4" aria-hidden="true" />
        {state.unreadNotifications > 0 && (
          <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-2 rounded-full bg-gold" />
        )}
      </Link>
      <Link href="/kabinet" aria-label={state.name} className={linkClass}>
        {contents}
      </Link>
    </div>
  );
}
