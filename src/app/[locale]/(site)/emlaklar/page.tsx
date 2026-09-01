import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container, Section } from "@/components/ui/container";
import { ActiveFilterChips } from "@/components/ui/active-filter-chips";
import { ResponsiveToolbar } from "@/components/ui/responsive-toolbar";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { PropertyCard } from "@/components/site/property-card";
import { PropertyFilterSheet } from "@/components/site/property-filter-sheet";
import { SaveSearchSlot } from "@/components/site/save-search-slot";
import { SearchPanel } from "@/components/site/search-panel";
import { SortSelect } from "@/components/site/sort-select";
import { Pagination } from "@/components/ui/pagination";
import { buildManagedMetadata, itemListSchema, jsonLd } from "@/lib/seo";
import { classifyPropertySearchParams } from "@/lib/seo-indexing";
import { routing } from "@/i18n/routing";
import { getCachedFilterOptions, getCachedProperties } from "@/lib/public-cache";
import {
  buildActivePropertyFilters,
  buildPropertySearchHref,
  parsePropertySearchParams,
} from "@/lib/property-search";
import { SORT_OPTIONS, type Locale } from "@/lib/constants";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const resolvedLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "listings.propertiesPage" });
  const decision = classifyPropertySearchParams(query);
  const pageSuffix = decision.page > 1 ? t("pageSuffix", { page: decision.page }) : "";

  return buildManagedMetadata({
    title: `${t("metaTitle")}${pageSuffix}`,
    description: t("metaDescription"),
    path: decision.canonicalPath ?? "/emlaklar",
    canonicalPath: decision.canonicalPath,
    indexPolicy: decision.indexPolicy,
    locale: resolvedLocale,
  });
}

const SORT_VALUES = SORT_OPTIONS.map((option) => option.value);

/** Yalnız müsbət ədədləri qəbul edir — «abc» və ya «-5» filtri sındırmasın. */
function positiveNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default async function PropertiesPage({ params: routeParams, searchParams }: Props) {
  const [{ locale }, params] = await Promise.all([routeParams, searchParams]);
  const t = await getTranslations({ locale, namespace: "listings" });
  const propertyT = await getTranslations({ locale, namespace: "property" });
  const indexDecision = classifyPropertySearchParams(params);
  if (!indexDecision.validPage) notFound();

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
    metroSlug: raw.metro,
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
    getCachedProperties(filters),
    getCachedFilterOptions(),
  ]);
  if (page > totalPages) notFound();

  const { sort: _savedSort, page: _savedPage, ...saveableFilters } = filters;
  void _savedSort;
  void _savedPage;

  const typeOptions = filterOptions.types.map((type) => ({
    value: type.slug,
    label: localizeKnownContent("propertyType", type, locale as Locale).name,
  }));
  const cityOptions = filterOptions.cities.map((city) => ({
    value: city.slug,
    label: localizeLocation(city, locale as Locale).name,
    districts: city.children.map((district) => ({
      value: district.slug,
      label: localizeLocation(district, locale as Locale).name,
    })),
  }));
  const metroOptions = filterOptions.metros.map((metro) => ({
    value: metro.slug,
    label: localizeLocation(metro, locale as Locale).name,
  }));

  // Ödəniş şərtləri xüsusiyyət cədvəlində saxlanılır, ona görə eyni siyahıdan gəlir
  const featureOptions = filterOptions.features.map((feature) => ({
    value: feature.slug,
    label: localizeKnownContent("feature", feature, locale as Locale).name,
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
    metros: metroOptions,
    features: featureOptions,
    translateLabel: (key, fallback) => {
      if (key === "elan") return raw.elan === "SALE" ? t("search.sale") : t("search.rent");
      if (key === "otaq" && raw.otaq) return Number(raw.otaq) >= 5 ? t("search.fivePlusRooms") : t("search.roomOption", { count: Number(raw.otaq) });
      if (key === "min" && raw.min) return `${t("search.min")}: ${raw.min} ₼`;
      if (key === "max" && raw.max) return `${t("search.max")}: ${raw.max} ₼`;
      if (key === "sahe_min" && raw.sahe_min) return `${t("search.min")}: ${raw.sahe_min} m²`;
      if (key === "sahe_max" && raw.sahe_max) return `${t("search.max")}: ${raw.sahe_max} m²`;
      if (key === "mertebe_min" && raw.mertebe_min) return `${t("search.min")}: ${raw.mertebe_min} ${t("search.floor").toLocaleLowerCase(locale)}`;
      if (key === "mertebe_max" && raw.mertebe_max) return `${t("search.max")}: ${raw.mertebe_max} ${t("search.floor").toLocaleLowerCase(locale)}`;
      if (key === "temir" && raw.temir) {
        const labels: Record<string, string> = { COSMETIC: propertyT("renovation.cosmetic"), RENOVATED: propertyT("renovation.renovated"), DESIGNER: propertyT("renovation.designer"), UNRENOVATED: propertyT("renovation.unrenovated"), NEW_BUILDING: propertyT("renovation.newBuilding") };
        return labels[raw.temir] ?? fallback;
      }
      if (key === "sened" && raw.sened) {
        const labels: Record<string, string> = { TITLE_DEED: propertyT("document.titleDeed"), CONTRACT: propertyT("document.contract"), MUNICIPAL: propertyT("document.municipal"), DECREE: propertyT("document.decree"), POWER_OF_ATTORNEY: propertyT("document.powerOfAttorney"), COMMERCIAL_EXTRACT: propertyT("document.commercialExtract"), NONE: propertyT("document.none") };
        return labels[raw.sened] ?? fallback;
      }
      if (key === "tikili" && raw.tikili) return raw.tikili === "NEW" ? propertyT("building.new") : propertyT("building.old");
      if (key === "dovr" && raw.dovr) return raw.dovr === "MONTH" ? t("search.monthly") : t("search.daily");
      if (key === "ilk_mertebe_yox") return t("search.notFirstFloor");
      if (key === "son_mertebe_yox") return t("search.notLastFloor");
      if (key === "sekilli") return t("search.withPhotos");
      if (key === "siralama") {
        const labels: Record<string, string> = { newest: t("search.sortNewest"), price_asc: t("search.sortPriceAsc"), price_desc: t("search.sortPriceDesc"), area_desc: t("search.sortAreaDesc") };
        return labels[sort] ?? fallback;
      }
      return fallback;
    },
  });

  const listingLabel = raw.elan === "SALE"
    ? t("search.sale")
    : raw.elan === "RENT"
      ? t("search.rent")
      : null;
  const initialSearch = {
    ...raw,
    mertebe_min: raw.mertebe_min,
    mertebe_max: raw.mertebe_max,
    ilk_mertebe_yox: filters.excludeFirstFloor ? "1" : undefined,
    son_mertebe_yox: filters.excludeLastFloor ? "1" : undefined,
    sekilli: filters.withImagesOnly ? "1" : undefined,
    xususiyyet: filters.featureSlugs,
    siralama: sort,
  };

  return (
    <>
      {items.length > 0 && (
        <script
          {...jsonLd(
            itemListSchema(
              items.map((item) => ({ name: item.title, path: `/emlaklar/${item.slug}` })),
              locale as Locale,
            ),
          )}
        />
      )}

      {/* Axtarış paneli */}
      <Section tone="beige" spacing="compact">
        <Container>
          <SectionHeader
            as="h1"
            overline={t("propertiesPage.overline")}
            title={listingLabel ? t("propertiesPage.typedTitle", { type: listingLabel }) : t("propertiesPage.allTitle")}
            description={t("results", { count: total })}
          />
          <div className="mt-8">
            <SearchPanel
              types={typeOptions}
              cities={cityOptions}
              metros={metroOptions}
              features={featureOptions}
              variant="page"
              initial={initialSearch}
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
          <ResponsiveToolbar
            mobile={
              <div className="-mx-4 flex min-h-14 items-center justify-between gap-2 px-2 sm:-mx-6 sm:px-4">
                <PropertyFilterSheet
                  types={typeOptions}
                  cities={cityOptions}
                  metros={metroOptions}
                  features={featureOptions}
                  initial={initialSearch}
                  resultCount={total}
                  activeCount={activeFilters.length}
                />
                <SortSelect
                  value={sort}
                  hrefs={sortHrefs}
                  compact
                  className="shrink-0"
                />
              </div>
            }
            desktop={
              <div className="mb-8 flex items-start justify-between gap-6 border-b border-line pb-6">
                {activeFilters.length > 0 ? (
                  <ActiveFilterChips items={activeFilters} resetHref="/emlaklar" />
                ) : (
                  <p className="text-sm text-ink-muted">
                    {t("propertiesPage.noFilters")}
                  </p>
                )}
                <div className="flex shrink-0 items-center gap-3">
                  <SaveSearchSlot filters={saveableFilters} />
                  <SortSelect value={sort} hrefs={sortHrefs} />
                </div>
              </div>
            }
          />

          {activeFilters.length > 0 ? (
            <ActiveFilterChips
              items={activeFilters}
              resetHref="/emlaklar"
              className="mt-4 mb-6 lg:hidden"
            />
          ) : (
            <p className="mt-4 mb-6 text-sm text-ink-muted lg:hidden">
              {t("propertiesPage.noFilters")}
            </p>
          )}

          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((property, index) => (
                  <Reveal key={property.id} delay={index * 40}>
                    <PropertyCard property={property} priority={index === 0} />
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
              title={t("propertiesPage.emptyTitle")}
              description={t("propertiesPage.emptyDescription")}
              action={{ label: t("propertiesPage.viewAll"), href: "/emlaklar" }}
            />
          )}
        </Container>
      </Section>
    </>
  );
}
