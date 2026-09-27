import {
  AdaptiveDataList,
  type AdaptiveDataListProps,
} from "@/components/ui/adaptive-data-list";
import { cn } from "@/lib/utils";

export type AdminResponsiveListProps<T> = AdaptiveDataListProps<T> & {
  ariaLabel: string;
};

export function AdminResponsiveList<T>({ ariaLabel, ...props }: AdminResponsiveListProps<T>) {
  return (
    <section aria-label={ariaLabel}>
      <AdaptiveDataList {...props} />
    </section>
  );
}

export type AdminListCardProps = {
  title: React.ReactNode;
  /** Toplu seçim checkbox-u (`BulkRowCheckbox`) — başlığın solunda. */
  select?: React.ReactNode;
  meta?: React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function AdminListCard({
  title,
  select,
  meta,
  status,
  actions,
  children,
  className,
}: AdminListCardProps) {
  return (
    <article className={cn("min-w-0 rounded-xl border border-line bg-paper p-4 shadow-xs", className)}>
      {/* 25rem-dən dar kartda status başlığın altına düşür — yanında qalanda başlıq
          hər sətirdə bir söz olan dar sütuna sıxılırdı. */}
      <header className="flex min-w-0 flex-col gap-2 min-[25rem]:flex-row min-[25rem]:items-start min-[25rem]:justify-between min-[25rem]:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 font-medium text-ink [overflow-wrap:anywhere]">
            {select ? <span className="flex min-h-6 shrink-0 items-center">{select}</span> : null}
            <div className="min-w-0">{title}</div>
          </div>
          {meta ? <div className="mt-1 text-xs text-ink-muted [overflow-wrap:anywhere]">{meta}</div> : null}
        </div>
        {status ? <div className="shrink-0">{status}</div> : null}
      </header>
      {children ? <div className="mt-4 min-w-0 text-sm text-ink-soft">{children}</div> : null}
      {actions ? <footer className="mt-4 flex min-h-11 items-center justify-end gap-2 border-t border-line pt-3">{actions}</footer> : null}
    </article>
  );
}
