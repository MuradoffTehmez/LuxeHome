"use client";

import { useTranslations } from "next-intl";

import { useRef, useState } from "react";
import Link from "next/link";
import { ListFilter, Search, X } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { cn } from "@/lib/utils";

export type FilterSelectOption = { value: string; label: string };
export type FilterSelect = {
  name: string;
  label: string;
  options: FilterSelectOption[];
  value?: string;
};

export type AdminFilterBarProps = {
  action: string;
  searchName?: string;
  searchValue?: string;
  searchPlaceholder?: string;
  selects?: FilterSelect[];
  hidden?: Record<string, string>;
  resultLabel?: string;
  className?: string;
};

export function AdminFilterBar({
  action,
  searchName = "q",
  searchValue = "",
  searchPlaceholder = "Axtar…",
  selects = [],
  hidden = {},
  resultLabel,
  className,
}: AdminFilterBarProps) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const hasFilters = searchValue !== "" || selects.some((select) => select.value);
  const shared = { action, searchName, searchValue, searchPlaceholder, selects, hidden, hasFilters };

  return (
    <div className={cn("border-b border-line bg-paper-light", className)}>
      <div className="flex min-h-14 items-center justify-between gap-3 p-3 lg:hidden">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{t("components.filterBar.title")}</p>
          {resultLabel ? <p className="truncate text-xs text-ink-muted">{resultLabel}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xs border border-line-strong px-4 text-sm font-medium text-ink"
        >
          <ListFilter className="size-4" aria-hidden="true" />
          {t("components.filterBar.button")}{hasFilters ? <span className="size-2 rounded-full bg-gold" aria-label={t("components.filterBar.activeFilter")} /> : null}
        </button>
      </div>

      <div className="hidden lg:block">
        <FilterForm {...shared} />
      </div>

      <Overlay open={open} onClose={() => setOpen(false)} title={t("components.filterBar.title")} placement="bottom">
        <FilterForm {...shared} mobile />
      </Overlay>
    </div>
  );
}

function FilterForm({
  action,
  searchName,
  searchValue,
  searchPlaceholder,
  selects,
  hidden,
  hasFilters,
  mobile = false,
}: Required<Pick<AdminFilterBarProps, "action" | "searchName" | "searchValue" | "searchPlaceholder" | "selects" | "hidden">> & {
  hasFilters: boolean;
  mobile?: boolean;
}) {
  const t = useTranslations("admin");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={action}
      method="get"
      className={cn("flex gap-3", mobile ? "flex-col" : "items-center justify-between p-4")}
    >
      {Object.entries(hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <input
          type="search"
          name={searchName}
          defaultValue={searchValue}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="min-h-11 w-full rounded-xs border border-line bg-paper pr-3 pl-9 text-base text-ink transition-colors placeholder:text-ink-muted focus:border-gold lg:text-sm"
        />
      </div>
      <div className={cn("flex gap-2", mobile ? "flex-col" : "flex-wrap items-center")}>
        {selects.map((select) => (
          <select
            key={select.name}
            name={select.name}
            aria-label={select.label}
            defaultValue={select.value ?? ""}
            onChange={() => formRef.current?.requestSubmit()}
            className="min-h-11 cursor-pointer rounded-xs border border-line bg-paper px-3 text-base text-ink transition-colors focus:border-gold lg:text-xs"
          >
            {select.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ))}
        <button type="submit" className="min-h-11 cursor-pointer rounded-xs border border-line-strong bg-gold px-4 text-sm font-medium text-ink transition-colors hover:bg-gold-soft">
          {t("actions.apply")}
        </button>
        {hasFilters ? (
          <Link href={action} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xs px-3 text-sm text-ink-muted transition-colors hover:text-danger">
            <X className="size-4" aria-hidden="true" />{t("actions.reset")}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
