"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/constants";
import { adminNavForRole, adminRouteIsActive, type AdminNavItemKeyOf } from "./admin-nav";

/**
 * Böyük modulun daxili tab zolağı (UX auditi): SERP-in 19 aləti ayrı-ayrı səhifələrdir, amma bir
 * modulun hissələridir. Zolaq iki səviyyəlidir — bölmə seçimi (`section`) və bölmənin alətləri —
 * və menyunun özündən, rola görə süzülmüş qurulur: yeni alət menyuya yazılanda burada da görünür.
 * Marşrutlar dəyişmir; hər tab adi linkdir (yeni tabda açma, geri düyməsi işləyir).
 */
export function AdminSectionTabs({ module, role }: { module: AdminNavItemKeyOf; role: Role }) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const item = adminNavForRole(role).flatMap((group) => group.items).find((entry) => entry.labelKey === module);
  const children = (item?.children ?? []).filter((child) => !child.href.includes("#"));
  if (children.length < 2) return null;

  const active = children
    .filter((child) => adminRouteIsActive(child.href, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const sections = [...new Set(children.map((child) => child.section).filter((section) => section !== undefined))];
  const activeSection = active?.section ?? sections[0];
  const visible = sections.length > 1 ? children.filter((child) => child.section === activeSection) : children;

  return (
    <div className="no-print mb-6 flex min-w-0 flex-col gap-3">
      {sections.length > 1 && (
        <nav aria-label={t("shell.sectionTabs", { section: t(`nav.items.${module}`) })} className="relative max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max gap-1 rounded-md border border-line bg-beige/40 p-1">
            {sections.map((section) => {
              const first = children.find((child) => child.section === section)!;
              const current = section === activeSection;
              return (
                <li key={section}>
                  <Link
                    href={first.href}
                    aria-current={current ? "true" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-sm px-3.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:min-h-9",
                      current ? "bg-paper text-ink shadow-xs" : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {t(`nav.sections.${section}`)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
      <nav aria-label={t("shell.moduleTools", { section: t(`nav.items.${module}`) })} className="relative max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max min-w-full gap-1 border-b border-line">
          {visible.map((child) => {
            const current = child.href === active?.href;
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "-mb-px inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    current ? "border-gold text-ink" : "border-transparent text-ink-soft hover:border-line-strong hover:text-ink",
                  )}
                >
                  {t(`nav.items.${child.labelKey}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
