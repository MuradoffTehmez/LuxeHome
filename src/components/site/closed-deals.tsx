import { getTranslations } from "next-intl/server";
import { BadgeCheck } from "lucide-react";
import { PropertyCard } from "@/components/site/property-card";
import type { DealStats } from "@/lib/agency-profile";
import type { PropertyCardData } from "@/lib/queries";
import { cn } from "@/lib/utils";

/**
 * «Uğurlu sövdələşmələr» (#159, Zillow «Past sales»): son 12 ayda satılmış və icarəyə
 * verilmiş elanlar. Təkliflər siyahısı yalnız aktiv elanları göstərir — bağlanmış elan
 * burada sayılır. Sövdələşmə yoxdursa bölmə göstərilmir.
 */
export async function ClosedDeals({
  deals,
  className,
  columns = "sm:grid-cols-2",
}: {
  deals: { stats: DealStats; recent: PropertyCardData[] };
  className?: string;
  columns?: string;
}) {
  if (deals.stats.total === 0) return null;
  const t = await getTranslations("listings.deals");

  return (
    <section aria-labelledby="sovdelesmeler-title" className={cn("scroll-mt-28", className)} id="sovdelesmeler">
      <h2 id="sovdelesmeler-title" className="font-display text-3xl tracking-[-0.02em] text-ink">{t("title")}</h2>
      <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
        <BadgeCheck className="size-4 shrink-0 text-gold-deep" aria-hidden="true" />
        {t("summary", { sold: deals.stats.sold, rented: deals.stats.rented })}
      </p>
      {deals.recent.length > 0 && (
        <div className={cn("mt-6 grid grid-cols-1 gap-6", columns)}>
          {deals.recent.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </section>
  );
}
