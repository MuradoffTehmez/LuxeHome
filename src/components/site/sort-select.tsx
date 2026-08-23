"use client";

import { useId } from "react";
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
  /** Mobil toolbar-da label və dekorativ icon-u vizual olaraq yığcamlaşdırır. */
  compact?: boolean;
  className?: string;
};

/**
 * Nəticə sıralaması. Seçim URL-i dəyişir — vəziyyət paylaşıla və geri düyməsi ilə
 * bərpa oluna bilər.
 */
export function SortSelect({ value, hrefs, compact = false, className }: SortSelectProps) {
  const router = useRouter();
  const id = useId();

  return (
    <div className={cn("flex min-w-0 items-center gap-2", compact && "gap-0", className)}>
      <ArrowUpDown
        className={cn("size-4 shrink-0 text-ink-muted", compact && "hidden")}
        aria-hidden="true"
      />
      <label
        htmlFor={id}
        className={cn("text-sm whitespace-nowrap text-ink-soft", compact && "sr-only")}
      >
        Sıralama
      </label>
      <div className={cn("relative", compact && "min-w-0 max-w-36")}>
        <select
          id={id}
          value={value}
          onChange={(event) => {
            const href = hrefs[event.target.value];
            if (href) router.push(href);
          }}
          className={cn(
            "min-h-11 w-full cursor-pointer appearance-none rounded-xs border border-line-strong bg-paper pr-9 pl-3 text-sm text-ink transition-colors duration-200 hover:border-ink-muted focus:border-gold",
            compact && "max-w-36",
          )}
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
