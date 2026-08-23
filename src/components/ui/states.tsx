import { AlertTriangle, Inbox, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "./button";
import { Container, Section } from "./container";

// ---------------------------------------------------------------------------
// SKELETON
// ---------------------------------------------------------------------------

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton rounded-xs", className)}
      {...props}
    />
  );
}

/** Əmlak kartının yüklənmə vəziyyəti — real kartla eyni ölçüdə, CLS yaratmır. */
export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-paper">
      <Skeleton className="aspect-4/3 w-full rounded-none sm:aspect-[16/11]" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-6 w-2/5" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <div className="mt-2 flex gap-4 border-t border-line pt-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-paper">
      <Skeleton className="aspect-16/10 w-full rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function CollectionPageSkeleton({
  cards = 6,
  variant = "property",
}: {
  cards?: number;
  variant?: "property" | "article";
}) {
  return (
    <div role="status" aria-label="Məzmun yüklənir" aria-busy="true">
      <header className="border-b border-line bg-[var(--surface-page)] py-7 sm:py-9">
        <Container>
          <Skeleton className="mb-4 h-4 w-28" />
          <Skeleton className="h-10 w-full max-w-xl sm:h-12" />
          <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
        </Container>
      </header>
      <Section tone="ivory" spacing="cozy">
        <Container>
          {variant === "article" ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: cards }, (_, index) => (
                <ArticleCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <PropertyGridSkeleton count={cards} />
          )}
        </Container>
      </Section>
      <span className="sr-only">Məzmun yüklənir…</span>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Detal səhifəsi yüklənir" aria-busy="true">
      <header className="border-b border-line bg-[var(--surface-page)] py-7 sm:py-9">
        <Container>
          <Skeleton className="mb-4 h-4 w-36" />
          <Skeleton className="h-10 w-full max-w-2xl sm:h-12" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl" />
        </Container>
      </header>
      <Section tone="ivory" spacing="cozy">
        <Container>
          <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
            <div className="flex min-w-0 flex-col gap-6">
              <Skeleton className="aspect-16/9 w-full rounded-md" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
              <Skeleton className="h-80 w-full rounded-md" />
            </div>
          </div>
        </Container>
      </Section>
      <span className="sr-only">Detal məlumatları yüklənir…</span>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-px overflow-hidden rounded-md border border-line bg-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 bg-paper px-4 py-4">
          <Skeleton className="size-12 shrink-0 rounded-xs" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="hidden h-4 w-20 md:block" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BOŞ VƏZİYYƏT
// ---------------------------------------------------------------------------

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; href: string };
  onAction?: { label: string; onClick: () => void };
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-md border border-dashed border-line-strong",
        "bg-paper px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-beige text-ink-muted">
        {icon ?? <Inbox className="size-6" aria-hidden="true" />}
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-xl text-ink">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-ink-muted">{description}</p>
        )}
      </div>

      {action && (
        <ButtonLink href={action.href} variant="outline" size="sm">
          {action.label}
        </ButtonLink>
      )}
      {onAction && (
        <Button type="button" variant="outline" size="sm" onClick={onAction.onClick}>
          {onAction.label}
        </Button>
      )}
    </div>
  );
}

/** Filtrlərə uyğun əmlak tapılmadıqda göstərilir. */
export function NoResultsState({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon={<SearchX className="size-6" aria-hidden="true" />}
      title="Bu kriteriyalara uyğun əmlak tapılmadı"
      description="Axtarış şərtlərini dəyişərək və ya filtrləri sıfırlayaraq yenidən cəhd edin."
      onAction={onReset ? { label: "Filtrləri sıfırla", onClick: onReset } : undefined}
      action={onReset ? undefined : { label: "Bütün əmlaklara bax", href: "/emlaklar" }}
    />
  );
}

// ---------------------------------------------------------------------------
// XƏTA VƏZİYYƏTİ
// ---------------------------------------------------------------------------

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

/**
 * İstifadəçiyə texniki xəta detalları göstərilmir —
 * yalnız anlaşılan mesaj və bərpa yolu.
 */
export function ErrorState({
  title = "Xidmət müvəqqəti olaraq əlçatan deyil",
  description = "Bir qədər sonra yenidən cəhd edin. Problem davam edərsə, bizimlə əlaqə saxlayın.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-md border border-danger/25",
        "bg-danger-bg/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-paper text-danger">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-xl text-ink">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-ink-soft">{description}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {onRetry && (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Yenidən cəhd et
          </Button>
        )}
        <ButtonLink href="/elaqe" variant="ghost" size="sm">
          Bizimlə əlaqə
        </ButtonLink>
      </div>
    </div>
  );
}
