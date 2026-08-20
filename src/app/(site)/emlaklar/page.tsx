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
import { buildMetadata } from "@/lib/seo";
import { getProperties, getFilterOptions } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";
import {
  DOCUMENT_STATUS_LABELS,
  LISTING_TYPE_LABELS,
  RENOVATION_LABELS,
  SORT_OPTIONS,
  type DocumentStatus,
  type ListingType,
  type Renovation,
  type SortOption,
} from "@/lib/constants";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


export const metadata: Metadata = buildMetadata({
  title: "Əmlaklar",
  description:
    "Bakıda mənzil, villa, həyət evi, torpaq, ofis və kommersiya obyektlərinin satışı və icarəsi. Axtarış filtri ilə sizə uyğun əmlakı tapın.",
  path: "/emlaklar",
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** URL-dəki bütün filtr parametrləri — SearchPanel ilə eyni adlar. */
const FILTER_KEYS = [
  "elan",
  "axtaris",
  "tip",
  "seher",
  "rayon",
  "otaq",
  "min",
  "max",
  "sahe_min",
  "sahe_max",
  "temir",
  "sened",
] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

const SORT_VALUES = SORT_OPTIONS.map((option) => option.value);

function text(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Yalnız müsbət ədədləri qəbul edir — «abc» və ya «-5» filtri sındırmasın. */
function positiveNumber(value: string | string[] | undefined): number | undefined {
  const raw = text(value);
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;

  // --- URL → filtr obyekti ---------------------------------------------------
  const raw = Object.fromEntries(
    FILTER_KEYS.map((key) => [key, text(params[key])]),
  ) as Partial<Record<FilterKey, string>>;

  const sortParam = text(params.siralama);
  const sort: SortOption = SORT_VALUES.includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : "newest";

  const filters = {
    listingType: raw.elan,
    search: raw.axtaris,
    typeSlug: raw.tip,
    citySlug: raw.seher,
    districtSlug: raw.rayon,
    rooms: positiveNumber(params.otaq),
    minPrice: positiveNumber(params.min),
    maxPrice: positiveNumber(params.max),
    minArea: positiveNumber(params.sahe_min),
    maxArea: positiveNumber(params.sahe_max),
    renovation: raw.temir,
    documentStatus: raw.sened,
    sort,
    page: positiveNumber(params.sehife) ?? 1,
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

  // --- URL qurucusu ----------------------------------------------------------
  /**
   * Cari filtrləri saxlayaraq yalnız verilən açarları dəyişir.
   * `null` dəyəri həmin parametri silir.
   */
  function buildHref(overrides: Record<string, string | number | null> = {}) {
    const sp = new URLSearchParams();

    for (const key of FILTER_KEYS) {
      const value = raw[key];
      if (value) sp.set(key, value);
    }
    if (sort !== "newest") sp.set("siralama", sort);
    if (page > 1) sp.set("sehife", String(page));

    for (const [key, value] of Object.entries(overrides)) {
      if (value === null || value === "") sp.delete(key);
      else sp.set(key, String(value));
    }

    // Filtr dəyişəndə birinci səhifəyə qayıdılır
    if (Object.keys(overrides).some((key) => key !== "sehife")) sp.delete("sehife");

    const qs = sp.toString();
    return `/emlaklar${qs ? `?${qs}` : ""}`;
  }

  const sortHrefs = Object.fromEntries(
    SORT_VALUES.map((value) => [
      value,
      buildHref({ siralama: value === "newest" ? null : value }),
    ]),
  );

  // --- Aktiv filtr nişanları -------------------------------------------------
  const labelOf = {
    tip: (value: string) => typeOptions.find((t) => t.value === value)?.label,
    seher: (value: string) => cityOptions.find((c) => c.value === value)?.label,
    rayon: (value: string) =>
      cityOptions.flatMap((c) => c.districts).find((d) => d.value === value)?.label,
  };

  const activeFilters: { key: FilterKey; label: string }[] = [];

  if (raw.elan) {
    const label = LISTING_TYPE_LABELS[raw.elan as ListingType];
    if (label) activeFilters.push({ key: "elan", label });
  }
  if (raw.axtaris) activeFilters.push({ key: "axtaris", label: `«${raw.axtaris}»` });
  if (raw.tip) {
    const label = labelOf.tip(raw.tip);
    if (label) activeFilters.push({ key: "tip", label });
  }
  if (raw.seher) {
    const label = labelOf.seher(raw.seher);
    if (label) activeFilters.push({ key: "seher", label });
  }
  if (raw.rayon) {
    const label = labelOf.rayon(raw.rayon);
    if (label) activeFilters.push({ key: "rayon", label });
  }
  if (filters.rooms !== undefined) {
    activeFilters.push({
      key: "otaq",
      label: filters.rooms >= 5 ? "5+ otaq" : `${filters.rooms} otaq`,
    });
  }
  if (filters.minPrice !== undefined) {
    activeFilters.push({ key: "min", label: `${formatNumber(filters.minPrice)} ₼-dən` });
  }
  if (filters.maxPrice !== undefined) {
    activeFilters.push({ key: "max", label: `${formatNumber(filters.maxPrice)} ₼-dək` });
  }
  if (filters.minArea !== undefined) {
    activeFilters.push({ key: "sahe_min", label: `${formatNumber(filters.minArea)} m²-dən` });
  }
  if (filters.maxArea !== undefined) {
    activeFilters.push({ key: "sahe_max", label: `${formatNumber(filters.maxArea)} m²-dək` });
  }
  if (raw.temir) {
    const label = RENOVATION_LABELS[raw.temir as Renovation];
    if (label) activeFilters.push({ key: "temir", label });
  }
  if (raw.sened) {
    const label = DOCUMENT_STATUS_LABELS[raw.sened as DocumentStatus];
    if (label) activeFilters.push({ key: "sened", label });
  }

  const listingLabel = raw.elan
    ? LISTING_TYPE_LABELS[raw.elan as ListingType]
    : null;

  return (
    <>
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
              variant="page"
              initial={{ ...raw, siralama: sort }}
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
                      href={buildHref({ [filter.key]: null })}
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
