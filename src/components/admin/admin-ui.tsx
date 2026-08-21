import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// SƏHİFƏ BAŞLIĞI
// ---------------------------------------------------------------------------

type Breadcrumb = { label: string; href?: string };

export function AdminPageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8">
      {breadcrumbs.length > 0 && (
        <nav aria-label="Səhifə yolu">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-muted">
            {breadcrumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-ink-soft">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
          {description && (
            <p className="max-w-2xl text-sm text-ink-soft">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KART VƏ PANEL
// ---------------------------------------------------------------------------

export function AdminCard({
  title,
  description,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn("overflow-hidden rounded-md border border-line bg-paper", className)}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex flex-col gap-0.5">
            {title && <h2 className="font-display text-lg text-ink">{title}</h2>}
            {description && <p className="text-sm text-ink-muted">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// STATİSTİKA KARTI
// ---------------------------------------------------------------------------

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "neutral" | "gold" | "success" | "warning";
  href?: string;
}) {
  const TONES = {
    neutral: "bg-beige text-ink-soft",
    gold: "bg-gold/15 text-gold-deep",
    success: "bg-success-bg text-success",
    warning: "bg-warning-bg text-warning",
  } as const;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink-soft">{label}</p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xs", TONES[tone])}>
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </div>
      <p className="tabular mt-3 font-display text-3xl text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </>
  );

  const className =
    "block rounded-md border border-line bg-paper p-5 transition-all duration-300 ease-out-soft";

  if (href) {
    return (
      <Link href={href} className={cn(className, "hover:-translate-y-1 hover:shadow-md")}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

// ---------------------------------------------------------------------------
// CƏDVƏL
// ---------------------------------------------------------------------------

export function AdminTable({
  headers,
  children,
  caption,
}: {
  headers: { label: string; className?: string; srOnly?: boolean }[];
  children: React.ReactNode;
  caption?: string;
}) {
  return (
    // Dar ekranda cədvəl öz içində sürüşür — səhifə üfüqi sürüşmür
    <div className="overflow-x-auto">
      <table className="w-full min-w-3xl border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line">
            {headers.map((header) => (
              <th
                key={header.label}
                scope="col"
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase",
                  header.className,
                )}
              >
                {header.srOnly ? <span className="sr-only">{header.label}</span> : header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function AdminTableRow({ children }: { children: React.ReactNode }) {
  return <tr className="transition-colors duration-150 hover:bg-beige/50">{children}</tr>;
}

export function AdminTableCell({
  children,
  className,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle text-ink",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

// ---------------------------------------------------------------------------
// STATUS NİŞANI
// ---------------------------------------------------------------------------

const STATUS_TONES = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  RESERVED: "warning",
  SOLD: "danger",
  RENTED: "danger",
  ARCHIVED: "neutral",
  PLANNED: "info",
  ONGOING: "warning",
  COMPLETED: "success",
  NEW: "gold",
  CONTACTED: "warning",
  IN_PROGRESS: "warning",
  CLOSED: "neutral",
} as const;

export function StatusBadge({
  status,
  label,
}: {
  status: keyof typeof STATUS_TONES;
  label: string;
}) {
  return <Badge tone={STATUS_TONES[status] ?? "neutral"}>{label}</Badge>;
}
