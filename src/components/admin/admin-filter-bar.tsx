"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterSelectOption = {
  value: string;
  label: string;
};

export type FilterSelect = {
  name: string;
  label: string;
  options: FilterSelectOption[];
};

export type AdminFilterBarProps = {
  searchPlaceholder?: string;
  selects?: FilterSelect[];
  className?: string;
};

export function AdminFilterBar({
  searchPlaceholder = "Axtar…",
  selects = [],
  className,
}: AdminFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-line bg-paper-light p-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="relative min-w-[240px] flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder={searchPlaceholder}
          className="w-full rounded-xs border border-line bg-paper py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted transition-colors focus:border-gold focus:outline-none"
        />
      </div>

      {selects.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selects.map((select) => (
            <div key={select.name} className="relative">
              <select
                name={select.name}
                aria-label={select.label}
                className="h-9 rounded-xs border border-line bg-paper px-3 py-1.5 text-xs text-ink transition-colors focus:border-gold focus:outline-none"
                defaultValue=""
              >
                {select.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
