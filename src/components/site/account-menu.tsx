"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Bell, LayoutDashboard, LogIn, UserRound } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Naviqasiyadakı hesab bölməsi.
 *
 * Vəziyyət `/api/hesab/menu`-dan brauzer tərəfdə alınır: sessiyanı layout-da
 * oxumaq bütün ictimai səhifələri dinamik edərdi.
 *
 * Yüklənənə qədər heç nə göstərilmir — «Daxil ol» yazıb sonra «Kabinet»-ə dəyişmək
 * səhifə açılışında gözə çarpan sıçrayış yaradır.
 */

type MenuState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "signed-in"; name: string; isStaff: boolean; unreadNotifications: number };

export function AccountMenu({
  isOverlay = false,
  variant = "desktop",
}: {
  isOverlay?: boolean;
  variant?: "desktop" | "mobile";
}) {
  const [state, setState] = useState<MenuState>({ status: "loading" });
  const pathname = usePathname();
  const t = useTranslations("auth");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/hesab/menu", { cache: "no-store" });
        if (!response.ok) throw new Error("menu");
        const data = (await response.json()) as {
          signedIn: boolean;
          name?: string;
          isStaff?: boolean;
          unreadNotifications?: number;
        };
        if (!active) return;
        setState(
          data.signedIn
            ? {
                status: "signed-in",
                name: data.name ?? t("myAccount"),
                isStaff: data.isStaff === true,
                unreadNotifications: data.unreadNotifications ?? 0,
              }
            : { status: "anonymous" },
        );
      } catch {
        // Şəbəkə xətasında ziyarətçi qonaq kimi göstərilir — menyu sınmır
        if (active) setState({ status: "anonymous" });
      }
    }

    void load();
    return () => {
      active = false;
    };
    // Marşrut dəyişəndə yenidən oxunur: giriş/çıxışdan sonra menyu dərhal uyğunlaşır
  }, [pathname, t]);

  if (state.status === "loading") return null;

  const linkClass = cn(
    "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xs text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
    variant === "mobile" ? "w-full justify-center" : "min-w-11 justify-center px-2 2xl:min-w-0 2xl:justify-start 2xl:px-0",
    isOverlay ? "text-ink-invert-soft hover:text-gold-soft" : "text-ink-soft hover:text-gold-deep",
  );

  if (state.status === "anonymous") {
    return (
      <div className={cn("flex items-center gap-3", variant === "mobile" && "flex-col items-stretch gap-2")}>
        <Link href="/daxil-ol" aria-label={t("login")} className={linkClass}>
          <LogIn className="size-4" aria-hidden="true" />
          <span className={cn(variant === "desktop" && "sr-only 2xl:not-sr-only")}>{t("login")}</span>
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
      <span className={cn("max-w-28 truncate", variant === "desktop" && "sr-only 2xl:not-sr-only")}>
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
        className={cn(linkClass, "relative", variant === "desktop" && "min-w-11 2xl:min-w-11 2xl:justify-center 2xl:px-0")}
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
