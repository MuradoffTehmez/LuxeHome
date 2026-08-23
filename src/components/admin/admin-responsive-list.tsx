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
  meta?: React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function AdminListCard({
  title,
  meta,
  status,
  actions,
  children,
  className,
}: AdminListCardProps) {
  return (
    <article className={cn("min-w-0 rounded-md border border-line bg-paper p-4 shadow-sm", className)}>
      <header className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-ink [overflow-wrap:anywhere]">{title}</div>
          {meta ? <div className="mt-1 text-xs text-ink-muted [overflow-wrap:anywhere]">{meta}</div> : null}
        </div>
        {status ? <div className="shrink-0">{status}</div> : null}
      </header>
      {children ? <div className="mt-4 min-w-0 text-sm text-ink-soft">{children}</div> : null}
      {actions ? <footer className="mt-4 flex min-h-11 items-center justify-end gap-2 border-t border-line pt-3">{actions}</footer> : null}
    </article>
  );
}
