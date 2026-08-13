"use client";

import { useRouter } from "next/navigation";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SortSelectProps = {
  /** Cari sıralama dəyəri. */
  value: string;
  /**
   * Hər sıralama seçimi üçün hazır URL.
   * Server tərəfdə qurulur ki, digər filtrlər itməsin.
   */
  hrefs: Record<string, string>;
  className?: string;
};

/**
 * Nəticə sıralaması. Seçim URL-i dəyişir — vəziyyət paylaşıla və geri düyməsi ilə
 * bərpa oluna bilər.
 */
export function SortSelect({ value, hrefs, className }: SortSelectProps) {
  const router = useRouter();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ArrowUpDown className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
      <label htmlFor="sort-select" className="text-sm whitespace-nowrap text-ink-soft">
        Sıralama
      </label>
      <div className="relative">
        <select
          id="sort-select"
          value={value}
          onChange={(event) => {
            const href = hrefs[event.target.value];
            if (href) router.push(href);
          }}
          className="min-h-11 w-full cursor-pointer appearance-none rounded-xs border border-line-strong bg-paper pr-9 pl-3 text-sm text-ink transition-colors duration-200 hover:border-ink-muted focus:border-gold"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
