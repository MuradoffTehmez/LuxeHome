"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Overlay } from "@/components/ui/overlay";
import { cn } from "@/lib/utils";
import { adminNav } from "./admin-nav";
import { AdminIcon } from "./admin-icon";

type SearchItem = {
  href: string;
  label: string;
  context: string;
  icon: string;
};

export function AdminCommandMenu() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const items = useMemo<SearchItem[]>(
    () =>
      adminNav.flatMap((group) =>
        group.items.flatMap((item) => {
          const parent = {
            href: item.href,
            label: t(`nav.items.${item.labelKey}`),
            context: t(`nav.groups.${group.titleKey}`),
            icon: item.icon,
          };
          const children = (item.children ?? []).map((child) => ({
            href: child.href,
            label: t(`nav.items.${child.labelKey}`),
            context: t(`nav.items.${item.labelKey}`),
            icon: item.icon,
          }));
          return [parent, ...children];
        }),
      ),
    [t],
  );

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return items.slice(0, 9);
    return items
      .filter((item) => `${item.label} ${item.context}`.toLocaleLowerCase().includes(normalized))
      .slice(0, 12);
  }, [items, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("shell.searchButton")}
        className={cn(
          "group inline-flex size-11 min-h-11 shrink-0 items-center justify-center gap-2.5 rounded-md border border-line bg-paper px-0 text-sm text-ink-muted shadow-xs transition-colors hover:border-line-strong hover:text-ink",
          "md:w-full md:max-w-md md:justify-start md:px-3",
        )}
      >
        <Search className="size-4.5 shrink-0" aria-hidden="true" />
        <span className="hidden min-w-0 flex-1 truncate text-left md:block">{t("shell.searchPlaceholder")}</span>
        <kbd className="hidden rounded-xs border border-line bg-beige px-1.5 py-0.5 text-[11px] font-medium text-ink-muted lg:inline-flex">
          Ctrl K
        </kbd>
      </button>

      <Overlay
        open={open}
        onClose={() => {
          setOpen(false);
          setQuery("");
        }}
        title={t("shell.searchTitle")}
        description={t("shell.searchDescription")}
        className="sm:max-w-2xl"
      >
        <label className="relative block">
          <span className="sr-only">{t("shell.searchPlaceholder")}</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("shell.searchPlaceholder")}
            className="min-h-12 w-full rounded-md border border-line-strong bg-ivory pr-4 pl-12 text-base text-ink outline-none placeholder:text-ink-muted focus:border-gold"
          />
        </label>

        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-ink-muted uppercase">
            {t("shell.searchHint")}
          </p>
          {results.length > 0 ? (
            <ul className="grid gap-1">
              {results.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <button
                    type="button"
                    onClick={() => navigate(item.href)}
                    className="group flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left transition-colors hover:bg-beige focus-visible:bg-beige"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-beige text-ink-soft group-hover:bg-gold/15 group-hover:text-gold-deep">
                      <AdminIcon name={item.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{item.label}</span>
                      <span className="block truncate text-xs text-ink-muted">{item.context}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-md border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-muted">
              {t("shell.searchEmpty")}
            </p>
          )}
        </div>
      </Overlay>
    </>
  );
}
