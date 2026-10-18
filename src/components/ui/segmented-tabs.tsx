import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type SegmentedTabItem = {
  href: string;
  label: string;
  active: boolean;
  /** Etiketin yanında kiçik sayğac (məs. oxunmamış bildirişlər). */
  count?: number;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
};

/**
 * Link əsaslı seqment idarəsi / tab zolağı — kabinet bölmələrində görünüş və filtr seçimi.
 *
 * Vəziyyət URL-dədir (server komponenti oxuyur), ona görə client JS lazım deyil, geri düyməsi
 * və yeni tabda açma işləyir. Aktiv bənd `aria-current="page"` daşıyır. Hədəf ≥44 px; dar ekranda
 * zolaq üfüqi sürüşür (konteyner `relative` — sr-only nəsil sənədi daşdırmasın).
 */
export function SegmentedTabs({
  label,
  items,
  variant = "tabs",
  className,
}: {
  label: string;
  items: readonly SegmentedTabItem[];
  /** `tabs` — səhifə səviyyəli alt xətli tablar; `pills` — kompakt seqment idarəsi. */
  variant?: "tabs" | "pills";
  className?: string;
}) {
  const pills = variant === "pills";
  return (
    <nav aria-label={label} className={cn("relative max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      <ul className={cn("flex w-max min-w-full", pills ? "gap-1 rounded-md border border-line bg-beige/40 p-1" : "gap-1 border-b border-line")}>
        {items.map(({ href, label: itemLabel, active, count, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 whitespace-nowrap px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                pills
                  ? cn("rounded-sm", active ? "bg-paper text-ink shadow-xs" : "text-ink-soft hover:text-ink")
                  : cn("-mb-px border-b-2", active ? "border-gold text-ink" : "border-transparent text-ink-soft hover:border-line-strong hover:text-ink"),
              )}
            >
              {Icon ? <Icon className={cn("size-4", active ? "text-gold-deep" : "text-ink-muted")} aria-hidden="true" /> : null}
              {itemLabel}
              {typeof count === "number" && count > 0 ? (
                <span className={cn("inline-flex min-w-5 justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums", active ? "bg-gold text-on-gold" : "bg-beige text-ink-soft")}>
                  {count}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
