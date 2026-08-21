"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type FilterSelectOption = {
  value: string;
  label: string;
};

export type FilterSelect = {
  name: string;
  label: string;
  options: FilterSelectOption[];
  value?: string;
};

export type AdminFilterBarProps = {
  /** Formanın göndərildiyi ünvan — cari siyahı səhifəsi. */
  action: string;
  searchName?: string;
  searchValue?: string;
  searchPlaceholder?: string;
  selects?: FilterSelect[];
  /** Filtrdən kənarda saxlanılan gizli parametrlər (məsələn zibil qutusu rejimi). */
  hidden?: Record<string, string>;
  className?: string;
};

/**
 * Panel siyahılarının filtr paneli.
 *
 * Adi GET formasıdır: filtr vəziyyəti URL-də qalır, səhifə paylaşıla və yenilənə bilir.
 * Seçim dəyişəndə forma özü göndərilir — «Tətbiq et» düyməsini axtarmaq lazım gəlmir,
 * amma düymə klaviatura və JavaScript söndürülmüş hal üçün yerində qalır.
 *
 * Qeyd: `focus:outline-none` yazılmır — klaviatura fokusu görünən qalmalıdır (WCAG 2.4.7).
 */
export function AdminFilterBar({
  action,
  searchName = "q",
  searchValue = "",
  searchPlaceholder = "Axtar…",
  selects = [],
  hidden = {},
  className,
}: AdminFilterBarProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const hasFilters = searchValue !== "" || selects.some((select) => select.value);

  return (
    <form
      ref={formRef}
      action={action}
      method="get"
      className={cn(
        "flex flex-col gap-3 border-b border-line bg-paper-light p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div className="relative min-w-[240px] flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          name={searchName}
          defaultValue={searchValue}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full rounded-xs border border-line bg-paper py-2 pr-3 pl-9 text-sm text-ink transition-colors placeholder:text-ink-muted focus:border-gold"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {selects.map((select) => (
          <select
            key={select.name}
            name={select.name}
            aria-label={select.label}
            defaultValue={select.value ?? ""}
            onChange={() => formRef.current?.requestSubmit()}
            className="min-h-9 cursor-pointer rounded-xs border border-line bg-paper px-3 py-1.5 text-xs text-ink transition-colors focus:border-gold"
          >
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}

        <button
          type="submit"
          className="min-h-9 cursor-pointer rounded-xs border border-line-strong px-3 text-xs font-medium text-ink transition-colors hover:border-gold hover:text-gold-deep"
        >
          Tətbiq et
        </button>

        {hasFilters && (
          <Link
            href={action}
            className="inline-flex min-h-9 items-center gap-1 rounded-xs px-2 text-xs text-ink-muted transition-colors hover:text-danger"
          >
            <X className="size-3.5" aria-hidden="true" />
            Sıfırla
          </Link>
        )}
      </div>
    </form>
  );
}
