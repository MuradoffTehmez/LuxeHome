"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { PARTNER_FILTER_GROUPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Tərəfdaş növü üzrə filtr.
 *
 * Vəziyyət URL-dədir (`?tip=`), komponent daxilində deyil: nəticə paylaşıla və
 * səhifə yenilənəndə saxlanıla bilir. `router.replace(..., { scroll: false })`
 * tam yenidən yükləmə etmir — Next.js yalnız server komponentini yenidən
 * render edir, ona görə filtr «refresh olmadan» işləyir.
 *
 * Sayı sıfır olan qrup gizlədilir — boş nəticə verən düymə istifadəçini aldadır.
 */
export function PartnerTypeFilter({
  counts,
  total,
}: {
  /** `partnershipType` → say. Qrupun sayı üzvlərinin cəmidir. */
  counts: Record<string, number>;
  total: number;
}) {
  const t = useTranslations("partners");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("tip");

  function select(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("tip", slug);
    else params.delete("tip");
    // Filtr dəyişəndə səhifələmə birinci səhifəyə qayıtmalıdır
    params.delete("sehife");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const groups = PARTNER_FILTER_GROUPS.map((group) => ({
    slug: group.slug,
    key: group.key,
    count: group.types.reduce((sum, type) => sum + (counts[type] ?? 0), 0),
  })).filter((group) => group.count > 0);

  // Yalnız bir qrup varsa filtr mənasızdır — hamısı onsuz da eyni nəticəni verir
  if (groups.length < 2) return null;

  return (
    <div
      role="group"
      aria-label={t("list.filterAria")}
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      <FilterButton active={active === null} onClick={() => select(null)}>
        {t("filters.all")}
        <Count value={total} />
      </FilterButton>

      {groups.map((group) => (
        <FilterButton
          key={group.slug}
          active={active === group.slug}
          onClick={() => select(group.slug)}
        >
          {t(`filters.${group.key}`)}
          <Count value={group.count} />
        </FilterButton>
      ))}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xs border px-4 text-sm font-medium",
        "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        active
          ? "border-gold bg-gold text-on-gold"
          : "border-line-strong text-ink-soft hover:border-gold hover:text-gold-deep",
      )}
    >
      {children}
    </button>
  );
}

function Count({ value }: { value: number }) {
  return (
    <span className="tabular text-xs text-current opacity-70" aria-hidden="true">
      {value}
    </span>
  );
}
