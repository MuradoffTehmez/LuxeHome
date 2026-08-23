import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "./container";

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  compact?: boolean;
};

/** İctimai və kabinet səhifələri üçün vahid semantik başlıq sahəsi. */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  compact = false,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "border-b border-line bg-[var(--surface-page)] text-[var(--text-primary)]",
        compact ? "py-7 sm:py-9" : "py-10 sm:py-14 lg:py-16",
      )}
    >
      <Container>
        {breadcrumbs?.length ? (
          <nav aria-label="Naviqasiya yolu" className="mb-5">
            <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-2 text-sm text-ink-muted">
              {breadcrumbs.map((item, index) => {
                const isCurrent = index === breadcrumbs.length - 1;

                return (
                  <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                    {index > 0 ? (
                      <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
                    ) : null}
                    {item.href && !isCurrent ? (
                      <Link
                        href={item.href}
                        className="rounded-xs transition-colors hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span aria-current={isCurrent ? "page" : undefined} className="truncate text-ink-soft">
                        {item.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            {eyebrow ? (
              <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-gold-deep uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={cn(
                "text-balance font-display leading-[1.08] tracking-[-0.025em] text-ink",
                compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl lg:text-6xl",
              )}
            >
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-[65ch] text-pretty text-base leading-7 text-ink-soft sm:text-lg">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div
              aria-label="Səhifə əməliyyatları"
              className="flex shrink-0 flex-wrap items-center gap-3"
            >
              {actions}
            </div>
          ) : null}
        </div>
      </Container>
    </header>
  );
}
