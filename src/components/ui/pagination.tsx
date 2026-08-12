import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Mövcud query parametrlərini saxlamaq üçün baza URL qurucusu. */
  buildHref: (page: number) => string;
  className?: string;
};

/** 1 … 4 5 6 … 12 şəklində qısaldılmış səhifə siyahısı qurur. */
function pageRange(page: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  let previous = 0;
  for (const current of sorted) {
    if (previous && current - previous > 1) result.push("gap");
    result.push(current);
    previous = current;
  }
  return result;
}

const ITEM =
  "inline-flex size-11 items-center justify-center rounded-xs border text-sm " +
  "transition-colors duration-200";

export function Pagination({ page, totalPages, buildHref, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = pageRange(page, totalPages);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Səhifələmə"
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
    >
      {hasPrevious ? (
        <Link
          href={buildHref(page - 1)}
          rel="prev"
          aria-label="Əvvəlki səhifə"
          className={cn(ITEM, "border-line-strong text-ink hover:border-gold hover:text-gold-deep")}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className={cn(ITEM, "border-line text-ink-muted opacity-40")}
        >
          <ChevronLeft className="size-4" />
        </span>
      )}

      {items.map((item, index) =>
        item === "gap" ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="px-1 text-sm text-ink-muted"
          >
            …
          </span>
        ) : item === page ? (
          <span
            key={item}
            aria-current="page"
            className={cn(ITEM, "tabular border-transparent bg-charcoal font-medium text-ink-invert")}
          >
            {item}
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            aria-label={`Səhifə ${item}`}
            className={cn(
              ITEM,
              "tabular border-line-strong text-ink hover:border-gold hover:text-gold-deep",
            )}
          >
            {item}
          </Link>
        ),
      )}

      {hasNext ? (
        <Link
          href={buildHref(page + 1)}
          rel="next"
          aria-label="Növbəti səhifə"
          className={cn(ITEM, "border-line-strong text-ink hover:border-gold hover:text-gold-deep")}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className={cn(ITEM, "border-line text-ink-muted opacity-40")}
        >
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
