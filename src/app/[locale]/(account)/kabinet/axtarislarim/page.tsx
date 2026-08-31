import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AdaptiveDataList } from "@/components/ui/adaptive-data-list";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { requireAccount } from "@/lib/auth/guard";
import {
  BUILDING_TYPES,
  DOCUMENT_STATUSES,
  LISTING_TYPES,
  RENOVATIONS,
  type Locale,
  type SavedSearchFrequency,
} from "@/lib/constants";
import { getFilterOptions, type PropertyFilters } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { buildManagedMetadata } from "@/lib/seo";
import { localizePath } from "@/i18n/path-locale";
import { SavedSearchActions } from "./saved-search-list";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.savedSearches" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/axtarislarim", noIndex: true, locale: locale as Locale });
}

/** `PropertyFilters` JSON-unu insan-oxunaqlı etiket siyahısına çevirir. */
function summarizeFilters(
  filters: PropertyFilters,
  labels: {
    types: Map<string, string>;
    cities: Map<string, string>;
    metros: Map<string, string>;
    listingTypes: Map<string, string>;
    renovations: Map<string, string>;
    documents: Map<string, string>;
    buildings: Map<string, string>;
    room: (count: number) => string;
  },
): string[] {
  const parts: string[] = [];

  if (filters.listingType) parts.push(labels.listingTypes.get(filters.listingType) ?? filters.listingType);
  if (filters.typeSlug) parts.push(labels.types.get(filters.typeSlug) ?? filters.typeSlug);
  if (filters.citySlug) parts.push(labels.cities.get(filters.citySlug) ?? filters.citySlug);
  if (filters.districtSlug) parts.push(labels.cities.get(filters.districtSlug) ?? filters.districtSlug);
  if (filters.metroSlug) parts.push(labels.metros.get(filters.metroSlug) ?? filters.metroSlug);
  if (filters.rooms !== undefined) parts.push(labels.room(filters.rooms));
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    parts.push(`${filters.minPrice ?? 0}–${filters.maxPrice ?? "∞"} ₼`);
  }
  if (filters.renovation) parts.push(labels.renovations.get(filters.renovation) ?? filters.renovation);
  if (filters.documentStatus) parts.push(labels.documents.get(filters.documentStatus) ?? filters.documentStatus);
  if (filters.buildingType) parts.push(labels.buildings.get(filters.buildingType) ?? filters.buildingType);
  if (filters.search) parts.push(`"${filters.search}"`);

  return parts;
}

/** Saxlanmış filtrləri `/emlaklar` axtarış query-sinə çevirir ("nəticələrə bax" üçün). */
function filtersToSearchParams(filters: PropertyFilters): string {
  const params = new URLSearchParams();
  if (filters.listingType) params.set("elan", filters.listingType);
  if (filters.search) params.set("axtaris", filters.search);
  if (filters.typeSlug) params.set("tip", filters.typeSlug);
  if (filters.citySlug) params.set("seher", filters.citySlug);
  if (filters.districtSlug) params.set("rayon", filters.districtSlug);
  if (filters.metroSlug) params.set("metro", filters.metroSlug);
  if (filters.rooms !== undefined) params.set("otaq", String(filters.rooms));
  if (filters.minPrice !== undefined) params.set("min", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("max", String(filters.maxPrice));
  if (filters.minArea !== undefined) params.set("sahe_min", String(filters.minArea));
  if (filters.maxArea !== undefined) params.set("sahe_max", String(filters.maxArea));
  if (filters.renovation) params.set("temir", filters.renovation);
  if (filters.documentStatus) params.set("sened", filters.documentStatus);
  const query = params.toString();
  return query ? `/emlaklar?${query}` : "/emlaklar";
}

const FREQUENCY_KEYS: Record<SavedSearchFrequency, "immediate" | "daily" | "weekly" | "off"> = {
  IMMEDIATE: "immediate",
  DAILY: "daily",
  WEEKLY: "weekly",
  OFF: "off",
};
const RENOVATION_KEYS = { COSMETIC: "cosmetic", RENOVATED: "renovated", DESIGNER: "designer", UNRENOVATED: "unrenovated", NEW_BUILDING: "newBuilding" } as const;
const DOCUMENT_KEYS = { TITLE_DEED: "titleDeed", CONTRACT: "contract", MUNICIPAL: "municipal", DECREE: "decree", POWER_OF_ATTORNEY: "powerOfAttorney", EXTRACT_COMMERCIAL: "commercialExtract", NONE: "none" } as const;
const BUILDING_KEYS = { NEW: "new", OLD: "old" } as const;

export default async function SavedSearchesPage() {
  const locale = (await getLocale()) as Locale;
  const user = await requireAccount(locale);
  const t = await getTranslations("account.savedSearches");
  const propertyT = await getTranslations("property");
  const searchT = await getTranslations("listings.search");

  const [searches, filterOptions] = await Promise.all([
    prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { matches: { where: { notifiedAt: null } } } } },
    }),
    getFilterOptions(),
  ]);

  // Səhifəyə baxış "yeni nəticələri gördü" sayılır — say göstərildikdən sonra sıfırlanır.
  const unseenMatchIds = searches.filter((s) => s._count.matches > 0).map((s) => s.id);
  if (unseenMatchIds.length > 0) {
    await prisma.savedSearchMatch.updateMany({
      where: { savedSearchId: { in: unseenMatchIds }, notifiedAt: null },
      data: { notifiedAt: new Date() },
    });
  }

  const typeLabels = new Map(filterOptions.types.map((type) => [type.slug, localizeKnownContent("propertyType", type, locale).name]));
  const cityLabels = new Map(
    filterOptions.cities.flatMap((city) => [
      [city.slug, localizeLocation(city, locale).name] as const,
      ...city.children.map((district) => [district.slug, localizeLocation(district, locale).name] as const),
    ]),
  );
  const metroLabels = new Map(filterOptions.metros.map((metro) => [metro.slug, localizeLocation(metro, locale).name]));
  const summaryLabels = {
    types: typeLabels,
    cities: cityLabels,
    metros: metroLabels,
    listingTypes: new Map([
      [LISTING_TYPES.SALE, propertyT("listingType.sale")],
      [LISTING_TYPES.RENT, propertyT("listingType.rent")],
    ]),
    renovations: new Map(Object.values(RENOVATIONS).map((value) => [value, propertyT(`renovation.${RENOVATION_KEYS[value]}`)])),
    documents: new Map(Object.values(DOCUMENT_STATUSES).map((value) => [value, propertyT(`document.${DOCUMENT_KEYS[value]}`)])),
    buildings: new Map(Object.values(BUILDING_TYPES).map((value) => [value, propertyT(`building.${BUILDING_KEYS[value]}`)])),
    room: (count: number) => count >= 5 ? searchT("fivePlusRooms") : searchT("roomOption", { count }),
  };

  type SavedSearchRow = (typeof searches)[number];

  function renderCard(item: SavedSearchRow) {
    const filters = JSON.parse(item.filters) as PropertyFilters;
    const summary = summarizeFilters(filters, summaryLabels);
    return (
      <article className="min-w-0 rounded-md border border-line bg-paper p-4 shadow-sm">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-medium text-ink [overflow-wrap:anywhere]">{item.name}</h2>
            <p className="mt-1 text-sm text-ink-soft">{summary.length > 0 ? summary.join(" · ") : t("noFilters")}</p>
          </div>
          {item._count.matches > 0 && <Badge tone="gold">{t("newMatches", { count: item._count.matches })}</Badge>}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <span>{t(`frequency.${FREQUENCY_KEYS[item.frequency as SavedSearchFrequency]}`)}</span>
            {!item.enabled && <Badge tone="neutral">{t("pausedBadge")}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink href={localizePath(filtersToSearchParams(filters), locale)} variant="ghost" size="sm">
              {t("viewResults")}
            </ButtonLink>
            <SavedSearchActions id={item.id} name={item.name} frequency={item.frequency} enabled={item.enabled} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="min-w-0">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("count", { count: searches.length })} />

      <div className="mt-8">
        <AdaptiveDataList
          items={searches}
          getKey={(item) => item.id}
          renderCard={renderCard}
          renderTable={(items) => <div className="flex flex-col gap-4">{items.map((item) => renderCard(item))}</div>}
          empty={
            <EmptyState
              title={t("emptyTitle")}
              description={t("emptyDescription")}
              action={{ label: t("emptyAction"), href: localizePath("/emlaklar", locale), localized: false }}
            />
          }
        />
      </div>
    </div>
  );
}
