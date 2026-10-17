import { getTranslations } from "next-intl/server";
import { ArrowRight, Map as MapIcon } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";
import type { AreaInsights as AreaInsightsData, AreaKind } from "@/lib/area-insights";
import { LISTING_TYPES, type Locale } from "@/lib/constants";

const number = new Intl.NumberFormat("en-US");

type AreaStat = { key: "total" | "sale" | "rent" | "pricePerSqm" | "monthlyRent"; value: string | null; hint?: string };

/**
 * «Ərazi haqqında» bloku (#240, PRD 12.4): satış/kirayə sayı, elanlardan median qiymət, növ və elan tipi
 * filtrləri, xəritə görünüşü və əlaqəli ərazilər. Qiymət nümunəsi azdırsa göstərilmir.
 */
export async function AreaInsights({
  data,
  kind,
  slug,
  placeName,
  locale,
}: {
  data: AreaInsightsData;
  kind: AreaKind;
  slug: string;
  placeName: string;
  locale: Locale;
}) {
  const t = await getTranslations("listings.areaInsights");
  const param = kind === "CITY" ? "seher" : "rayon";
  const search = (extra: Record<string, string> = {}) => `/emlaklar?${new URLSearchParams({ [param]: slug, ...extra }).toString()}`;
  if (data.total === 0) return null;

  return (
    <Section aria-labelledby="area-insights-title" tone="paper" spacing="compact" className="border-t border-line">
      <Container>
        <h2 id="area-insights-title" className="font-display text-3xl tracking-[-0.02em] text-ink">{t("title", { place: placeName })}</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">{t("description")}</p>

        <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {([
            { key: "total", value: number.format(data.total) },
            { key: "sale", value: number.format(data.sale) },
            { key: "rent", value: number.format(data.rent) },
            { key: "pricePerSqm", value: data.salePricePerSqm != null ? `${number.format(data.salePricePerSqm)} ₼` : null, hint: data.salePricePerSqm != null ? t("sample", { count: data.saleSample }) : t("notEnough") },
            { key: "monthlyRent", value: data.monthlyRent != null ? `${number.format(data.monthlyRent)} ₼` : null, hint: data.monthlyRent != null ? t("sample", { count: data.rentSample }) : t("notEnough") },
          ] as AreaStat[]).map((item) => (
            <div key={item.key} className="rounded-xl border border-line bg-ivory p-4">
              <dt className="text-xs text-ink-muted">{t(`${item.key}`)}</dt>
              <dd className="mt-1 font-display text-2xl text-ink tabular-nums">{item.value ?? "—"}</dd>
              {item.hint && <dd className="mt-0.5 text-xs text-ink-muted">{item.hint}</dd>}
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-ink-muted">{t("medianNote")}</p>

        <div className="mt-6 flex flex-col gap-3">
          <h3 className="text-sm font-medium text-ink">{t("filtersTitle")}</h3>
          <div className="flex flex-wrap gap-2">
            {data.sale > 0 && <Link href={search({ elan: LISTING_TYPES.SALE })} className={buttonClassName("outline", "sm")}>{t("saleLink", { count: data.sale })}</Link>}
            {data.rent > 0 && <Link href={search({ elan: LISTING_TYPES.RENT })} className={buttonClassName("outline", "sm")}>{t("rentLink", { count: data.rent })}</Link>}
            {data.types.map((type) => (
              <Link key={type.id} href={search({ tip: type.slug })} className={buttonClassName("ghost", "sm", false, "border border-line")}>
                {localizeKnownContent("propertyType", type, locale).name} <span className="text-ink-muted">({type.count})</span>
              </Link>
            ))}
            <Link href={search({ gorunus: "xerite" })} className={buttonClassName("primary", "sm")}>
              <MapIcon className="size-4" aria-hidden="true" />
              {t("map")}
            </Link>
          </div>
        </div>

        {data.related.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-ink">{t("relatedTitle")}</h3>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.related.map((item) => (
                <li key={item.id}>
                  <Link href={`/rayon/${item.slug}`} className="group flex min-h-11 items-center justify-between gap-3 border-b border-line text-sm text-ink-soft hover:text-gold-deep">
                    <span>{localizeLocation(item, locale).name} <span className="text-ink-muted">({item.count})</span></span>
                    <ArrowRight className="size-3.5 shrink-0 text-gold-deep transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </Section>
  );
}
