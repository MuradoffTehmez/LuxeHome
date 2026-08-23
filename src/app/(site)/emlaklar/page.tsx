import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { PropertyCard } from "@/components/site/property-card";
import { SearchPanel } from "@/components/site/search-panel";
import { SortSelect } from "@/components/site/sort-select";
import { Pagination } from "@/components/ui/pagination";
import { buildMetadata, itemListSchema, jsonLd } from "@/lib/seo";
import { getProperties, getFilterOptions } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";
import {
  buildActivePropertyFilters,
  buildPropertySearchHref,
  parsePropertySearchParams,
} from "@/lib/property-search";
import {
  LISTING_TYPE_LABELS,
  SORT_OPTIONS,
  type ListingType,
} from "@/lib/constants";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


export const metadata: Metadata = buildMetadata({
  title: "Əmlaklar",
  description:
    "Bakıda mənzil, villa, həyət evi, torpaq, ofis və kommersiya obyektlərinin satışı və icarəsi. Axtarış filtri ilə sizə uyğun əmlakı tapın.",
  path: "/emlaklar",
  keywords: [
    "əmlak elanları",
    "Bakıda əmlak satışı",
    "mənzil satışı",
    "mənzil kirayə",
    "villa satışı",
    "günlük kirayə",
    "aylıq kirayə",
    "torpaq satışı",
    "ofis icarəsi",
    "yeni tikili mənzil",
  ],
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SORT_VALUES = SORT_OPTIONS.map((option) => option.value);

/** Yalnız müsbət ədədləri qəbul edir — «abc» və ya «-5» filtri sındırmasın. */
function positiveNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;

  // --- URL → filtr obyekti ---------------------------------------------------
  const searchState = parsePropertySearchParams(params);
  const raw = searchState.values;
  const sort = searchState.sort;

  const filters = {
    listingType: raw.elan,
    search: raw.axtaris,
    typeSlug: raw.tip,
    citySlug: raw.seher,
    districtSlug: raw.rayon,
    rooms: positiveNumber(raw.otaq),
    minPrice: positiveNumber(raw.min),
    maxPrice: positiveNumber(raw.max),
    minArea: positiveNumber(raw.sahe_min),
    maxArea: positiveNumber(raw.sahe_max),
    renovation: raw.temir,
    documentStatus: raw.sened,
    buildingType: raw.tikili,
    pricePeriod: raw.dovr,
    minFloor: positiveNumber(raw.mertebe_min),
    maxFloor: positiveNumber(raw.mertebe_max),
    excludeFirstFloor: searchState.excludeFirstFloor,
    excludeLastFloor: searchState.excludeLastFloor,
    withImagesOnly: searchState.withImagesOnly,
    featureSlugs: searchState.featureSlugs,
    sort,
    page: searchState.page,
  };

  const [{ items, total, page, totalPages }, filterOptions] = await Promise.all([
    getProperties(filters),
    getFilterOptions(),
  ]);

  const typeOptions = filterOptions.types.map((type) => ({
    value: type.slug,
    label: type.name,
  }));
  const cityOptions = filterOptions.cities.map((city) => ({
    value: city.slug,
    label: city.name,
    districts: city.children.map((district) => ({
      value: district.slug,
      label: district.name,
    })),
  }));

  // Ödəniş şərtləri xüsusiyyət cədvəlində saxlanılır, ona görə eyni siyahıdan gəlir
  const featureOptions = filterOptions.features.map((feature) => ({
    value: feature.slug,
    label: feature.name,
    group: feature.group,
  }));

  const buildHref = (overrides: Record<string, string | number | null> = {}) =>
    buildPropertySearchHref(searchState, overrides);

  const sortHrefs = Object.fromEntries(
    SORT_VALUES.map((value) => [
      value,
      buildHref({ siralama: value === "newest" ? null : value }),
    ]),
  );

  const activeFilters = buildActivePropertyFilters(searchState, {
    types: typeOptions,
    cities: cityOptions,
    features: featureOptions,
  });

  const listingLabel = raw.elan
    ? LISTING_TYPE_LABELS[raw.elan as ListingType]
    : null;

  return (
    <>
      {items.length > 0 && (
        <script
          {...jsonLd(
            itemListSchema(items.map((item) => ({ name: item.title, path: `/emlaklar/${item.slug}` }))),
          )}
        />
      )}

      {/* Axtarış paneli */}
      <Section tone="beige" spacing="compact">
        <Container>
          <SectionHeader
            as="h1"
            overline="Əmlaklar"
            title={listingLabel ? `${listingLabel} elanları` : "Bütün əmlaklar"}
            description={
              total > 0
                ? `${formatNumber(total)} nəticə tapıldı`
                : "Nəticə tapılmadı"
            }
          />
          <div className="mt-8">
            <SearchPanel
              types={typeOptions}
              cities={cityOptions}
            features={featureOptions}
              variant="page"
              initial={{
              ...raw,
              mertebe_min: raw.mertebe_min,
              mertebe_max: raw.mertebe_max,
              ilk_mertebe_yox: filters.excludeFirstFloor ? "1" : undefined,
              son_mertebe_yox: filters.excludeLastFloor ? "1" : undefined,
              sekilli: filters.withImagesOnly ? "1" : undefined,
              xususiyyet: filters.featureSlugs,
              siralama: sort,
            }}
            />
          </div>
        </Container>
      </Section>

      {/* Nəticələr — axtarış paneli ilə arada ikiqat boşluq yaranmasın deyə
          yuxarı doldurma azaldılıb, alt doldurma standart ritmdə qalır. */}
      <Section
        tone="ivory"
        spacing="none"
        className="pt-8 pb-16 sm:pt-10 sm:pb-20 lg:pt-12 lg:pb-24"
      >
        <Container>
          {/* Aktiv filtrlər + sıralama */}
          <div className="mb-8 flex flex-col gap-4 border-b border-line pb-6 lg:flex-row lg:items-center lg:justify-between">
            {activeFilters.length > 0 ? (
              <ul className="flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <li key={`${filter.key}-${filter.label}`}>
                    <Link
                      href={filter.href}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line-strong bg-paper py-1 pr-2 pl-3 text-sm text-ink transition-colors duration-200 hover:border-gold hover:text-gold-deep"
                    >
                      {filter.label}
                      <X className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="sr-only">filtrini götür</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/emlaklar"
                    className="inline-flex min-h-9 items-center px-2 text-sm text-ink-muted underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
                  >
                    Hamısını sıfırla
                  </Link>
                </li>
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">
                Filtr seçilməyib — bütün elanlar göstərilir.
              </p>
            )}

            <SortSelect value={sort} hrefs={sortHrefs} className="shrink-0" />
          </div>

          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((property, index) => (
                  <Reveal key={property.id} delay={index * 40}>
                    <PropertyCard property={property} priority={index < 3} />
                  </Reveal>
                ))}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                buildHref={(p) => buildHref({ sehife: p > 1 ? p : null })}
                className="mt-12"
              />
            </>
          ) : (
            <EmptyState
              title="Bu kriteriyalara uyğun əmlak tapılmadı"
              description="Axtarış şərtlərini genişləndirin və ya filtrləri sıfırlayaraq yenidən cəhd edin."
              action={{ label: "Bütün əmlaklara bax", href: "/emlaklar" }}
            />
          )}
        </Container>
      </Section>
    </>
  );
}
