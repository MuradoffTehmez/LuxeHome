import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { PropertyCard } from "@/components/site/property-card";
import { SearchPanel } from "@/components/site/search-panel";
import { Pagination } from "@/components/ui/pagination";
import { buildMetadata } from "@/lib/seo";
import { getProperties, getFilterOptions } from "@/lib/queries";
import { LISTING_TYPE_LABELS } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Əmlaklar",
  description:
    "Bakıda mənzil, villa, həyət evi, torpaq, ofis və kommersiya obyektlərinin satışı və icarəsi. Axtarış filtri ilə sizə uyğun əmlakı tapın.",
  path: "/emlaklar",
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;

  const filters = {
    listingType: typeof params.elan === "string" ? params.elan : undefined,
    typeSlug: typeof params.tip === "string" ? params.tip : undefined,
    citySlug: typeof params.seher === "string" ? params.seher : undefined,
    minPrice: params.min ? Number(params.min) : undefined,
    maxPrice: params.max ? Number(params.max) : undefined,
    rooms: params.otaq ? Number(params.otaq) : undefined,
    sort:
      typeof params.siralama === "string"
        ? (params.siralama as "newest" | "price_asc" | "price_desc" | "area_desc" | "featured")
        : undefined,
    page: params.sehife ? Number(params.sehife) : 1,
  };

  const [{ items, total, page, totalPages }, filterOptions] = await Promise.all([
    getProperties(filters),
    getFilterOptions(),
  ]);

  const typeOptions = filterOptions.types.map((t) => ({
    value: t.slug,
    label: t.name,
  }));
  const cityOptions = filterOptions.cities.map((c) => ({
    value: c.slug,
    label: c.name,
  }));

  /** URL query parametrlərini saxlayaraq səhifə nömrəsini dəyişir. */
  function buildHref(p: number) {
    const sp = new URLSearchParams();
    if (filters.listingType) sp.set("elan", filters.listingType);
    if (filters.typeSlug) sp.set("tip", filters.typeSlug);
    if (filters.citySlug) sp.set("seher", filters.citySlug);
    if (filters.minPrice) sp.set("min", String(filters.minPrice));
    if (filters.maxPrice) sp.set("max", String(filters.maxPrice));
    if (filters.rooms) sp.set("otaq", String(filters.rooms));
    if (filters.sort) sp.set("siralama", filters.sort);
    if (p > 1) sp.set("sehife", String(p));
    const qs = sp.toString();
    return `/emlaklar${qs ? `?${qs}` : ""}`;
  }

  const listingLabel = filters.listingType
    ? LISTING_TYPE_LABELS[filters.listingType as keyof typeof LISTING_TYPE_LABELS]
    : null;

  return (
    <>
      {/* Axtarış paneli */}
      <Section tone="beige" className="py-10 sm:py-12">
        <Container>
          <SectionHeader
            as="h1"
            overline="Əmlaklar"
            title={listingLabel ? `${listingLabel} elanları` : "Bütün əmlaklar"}
            description={`${total} nəticə tapıldı`}
          />
          <div className="mt-8">
            <SearchPanel types={typeOptions} cities={cityOptions} />
          </div>
        </Container>
      </Section>

      {/* Nəticələr */}
      <Section tone="ivory">
        <Container>
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
                buildHref={buildHref}
                className="mt-12"
              />
            </>
          ) : (
            <EmptyState
              title="Bu kriteriyalara uyğun əmlak tapılmadı"
              description="Axtarış şərtlərini dəyişərək yenidən cəhd edin."
              action={{ label: "Bütün əmlaklara bax", href: "/emlaklar" }}
            />
          )}
        </Container>
      </Section>
    </>
  );
}
