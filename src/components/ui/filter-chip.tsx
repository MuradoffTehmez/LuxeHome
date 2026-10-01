import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Kateqoriya / auditoriya / hərf filtri çipi — bloq, Bilik Mərkəzi və lüğət eyni görünüşü paylaşır.
 * Aktiv çip tünd doldurulur; qalanlarında sərhəd hover-də qızıla dönür. Hədəf ≥44 px-dir.
 */
export function FilterChip({
  href,
  active,
  className,
  children,
}: {
  href: string;
  active: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 shrink-0 snap-start items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        active
          ? "border-charcoal bg-charcoal text-ink-invert"
          : "border-line-strong bg-paper text-ink-soft hover:border-gold hover:text-gold-deep",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Üfüqi sürüşən çip zolağı: mobil ekranda kənardan-kənara, desktopda sətirlərə bölünür. */
export function FilterChipRow({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        // `relative`: overflow-x-auto sərhədi olan konteyner mövqe konteksti yaratmalıdır — əks halda
        // içindəki absolute element (məs. sr-only) kənar ancestor-a görə yerləşib sənədi daşdırır.
        "relative -mx-5 flex snap-x gap-2.5 overflow-x-auto px-5 py-0.5 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0 [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </nav>
  );
}
