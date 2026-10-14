import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Building2, Clock, Eye, FileBadge, Globe, KeyRound, MapPin, ShieldCheck, Tag, Users } from "lucide-react";
import { InstagramIcon } from "@/components/site/brand-icons";
import { Container, Section } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { PropertyCard } from "@/components/site/property-card";
import { AgentCard } from "@/components/site/agent-card";
import { PublisherContactButtons } from "@/components/site/publisher-contact";
import { Link } from "@/i18n/navigation";
import { agencySchema, buildManagedMetadata, jsonLd, breadcrumbSchema } from "@/lib/seo";
import { getAgencyProfile } from "@/lib/agency-profile";
import { recordView } from "@/lib/view-counter";
import { maskPhone } from "@/lib/accounts/listing-publisher";
import { isPhoneLike } from "@/lib/accounts/profile-fields";
import { cn, isUnoptimizedImage } from "@/lib/utils";
import { formatLocalizedDate } from "@/i18n/date";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";
import { LISTING_TYPES, LOCATION_KINDS, type Locale, type SortOption } from "@/lib/constants";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SORTS: SortOption[] = ["newest", "price_asc", "price_desc"];

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "listings.detail" });
  const data = await getAgencyProfile(slug);
  if (!data) notFound();

  return buildManagedMetadata({
    title: data.agency.name,
    description: data.agency.description || t("agencyFallback", { name: data.agency.name }),
    path: `/agentlikler/${data.agency.slug}`,
    image: data.agency.logoUrl ?? undefined,
    locale: locale as Locale,
    managedEntity: { type: "AGENCY", id: data.agency.id },
  });
}

/**
 * Agentliyin ictimai profili (#155).
 *
 * bina.az (baxış/təklif sayı, ünvan, iş saatları, «Nömrəni göstər», bölmələr),
 * Property Finder (aktiv elan/agent sayı, lisenziya, «Haqqında», Satış/Kirayə) və
 * Zillow (xidmət əraziləri) profillərindən sintez, Luxe Home brendində: qızılı
 * şəbəkəli örtük, asılan loqo lövhəsi, statistika zolağı, yapışqan əlaqə paneli.
 */
export default async function AgencyProfilePage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const query = await searchParams;
  const listingType = single(query.elan);
  const typeSlug = single(query.tip);
  const sortParam = single(query.siralama) as SortOption | undefined;
  const sort = sortParam && SORTS.includes(sortParam) ? sortParam : "newest";
  const page = Math.max(1, Number(single(query.sehife)) || 1);

  const data = await getAgencyProfile(slug, { listingType, typeSlug, sort, page });
  if (!data) notFound();
  const { agency, stats } = data;
  recordView("agency", agency.id, (await headers()).get("user-agent"));

  const [t, detail, navigation, content] = await Promise.all([
    getTranslations({ locale, namespace: "listings.agencyProfile" }),
    getTranslations({ locale, namespace: "listings.detail" }),
    getTranslations({ locale, namespace: "navigation" }),
    getTranslations({ locale, namespace: "content.propertyDetail" }),
  ]);

  const basePath = `/agentlikler/${agency.slug}`;
  const hrefWith = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { elan: listingType, tip: typeSlug, siralama: sort === "newest" ? undefined : sort, ...changes };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const text = next.toString();
    return text ? `${basePath}?${text}#teklifler` : `${basePath}#teklifler`;
  };
  const activeType = listingType === LISTING_TYPES.SALE || listingType === LISTING_TYPES.RENT ? listingType : undefined;
  const phone = isPhoneLike(agency.phone) ? agency.phone : null;
  const statItems = [
    { icon: Building2, label: t("statOffers"), value: stats.total },
    { icon: Tag, label: t("statSale"), value: stats.sale },
    { icon: KeyRound, label: t("statRent"), value: stats.rent },
    { icon: Users, label: t("statAgents"), value: data.agents.length },
    { icon: Eye, label: t("statViews"), value: agency.viewCount },
  ];
  const tabs = [
    { value: undefined, label: t("tabAll"), count: stats.total },
    { value: LISTING_TYPES.SALE, label: t("tabSale"), count: stats.sale },
    { value: LISTING_TYPES.RENT, label: t("tabRent"), count: stats.rent },
  ];
  const sortLabels: Record<string, string> = {
    newest: t("sortNewest"),
    price_asc: t("sortPriceAsc"),
    price_desc: t("sortPriceDesc"),
  };
  const mapHref = agency.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(agency.address)}`
    : null;
  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors",
      active
        ? "border-gold bg-gold/10 font-medium text-ink"
        : "border-line bg-paper text-ink-soft hover:border-gold hover:text-gold-deep",
    );

  return (
    <>
      <script {...jsonLd(agencySchema({ ...agency, phone }, locale as Locale))} />
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: navigation("home"), path: "/" },
            { name: navigation("agencies"), path: "/agentlikler" },
            { name: agency.name, path: basePath },
          ], locale as Locale),
        )}
      />

      {/* Örtük: qızılı «çertyoj» şəbəkəsi + asılan loqo lövhəsi — brendin imza səthi. */}
      <section className="relative isolate overflow-hidden border-b border-line bg-[linear-gradient(135deg,var(--color-beige)_0%,var(--color-ivory)_70%)]">
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(196_165_117/0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgb(196_165_117/0.2)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_top_right,black_20%,transparent_75%)]"
        />
        <Container className="pt-6 pb-8 sm:pt-8 sm:pb-10">
          <Breadcrumbs
            locale={locale as Locale}
            items={[
              { label: navigation("home"), href: "/" },
              { label: navigation("agencies"), href: "/agentlikler" },
              { label: agency.name },
            ]}
            className="mb-6"
          />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-gold-line bg-paper shadow-md sm:size-28">
              {agency.logoUrl ? (
                <Image
                  src={agency.logoUrl}
                  alt={agency.name}
                  fill
                  priority
                  sizes="112px"
                  unoptimized={isUnoptimizedImage(agency.logoUrl)}
                  className="object-contain p-2"
                />
              ) : (
                <Building2 className="size-10 text-gold-deep" strokeWidth={1.5} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.18em] text-gold-deep uppercase">{t("eyebrow")}</p>
              <h1 className="mt-1 font-display text-3xl leading-tight tracking-[-0.02em] text-ink sm:text-4xl">{agency.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-3 py-1 text-xs font-semibold text-success">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  {t("verified")}
                </span>
                {agency.user.companyTaxId && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-xs text-ink-soft">
                    <FileBadge className="size-3.5 text-gold-deep" aria-hidden="true" />
                    {t("taxId", { value: agency.user.companyTaxId })}
                  </span>
                )}
                <span className="text-xs text-ink-muted">
                  {t("since", { date: formatLocalizedDate(agency.createdAt, locale as Locale, "monthYear") ?? "" })}
                </span>
              </div>
            </div>
          </div>

          {/* Statistika zolağı — təklif agentlik üçün, elan agent üçün (sahibin tələbi). */}
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-xs sm:grid-cols-5">
            {statItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-paper px-4 py-3.5">
                <item.icon className="size-5 shrink-0 text-gold-deep" strokeWidth={1.5} aria-hidden="true" />
                <div className="min-w-0">
                  <dd className="tabular text-xl leading-tight font-semibold text-ink">{item.value}</dd>
                  <dt className="text-xs text-ink-muted">{item.label}</dt>
                </div>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Section tone="ivory" spacing="cozy">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
            <div className="flex min-w-0 flex-col gap-12">
              {/* Təkliflər */}
              <section id="teklifler" aria-labelledby="teklifler-title" className="scroll-mt-28">
                <div className="flex flex-col gap-1">
                  <h2 id="teklifler-title" className="font-display text-3xl tracking-[-0.02em] text-ink">{t("offersTitle")}</h2>
                  <p className="text-sm text-ink-soft">{t("offersDescription", { name: agency.name })}</p>
                </div>

                <nav aria-label={t("filterNav")} className="mt-5 flex flex-col gap-3">
                  <ul className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                      <li key={tab.label}>
                        <Link
                          href={hrefWith({ elan: tab.value, tip: undefined, sehife: undefined })}
                          aria-current={activeType === tab.value ? "page" : undefined}
                          className={chip(activeType === tab.value)}
                        >
                          {tab.label}
                          <span className="tabular text-xs text-ink-muted">{tab.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {data.types.length > 1 && (
                    <ul className="flex flex-wrap gap-2">
                      <li>
                        <Link href={hrefWith({ tip: undefined, sehife: undefined })} className={chip(!typeSlug)}>
                          {t("allTypes")}
                        </Link>
                      </li>
                      {data.types.map((type) => (
                        <li key={type.id}>
                          <Link
                            href={hrefWith({ tip: type.slug, sehife: undefined })}
                            aria-current={typeSlug === type.slug ? "page" : undefined}
                            className={chip(typeSlug === type.slug)}
                          >
                            {localizeKnownContent("propertyType", type, locale as Locale).name}
                            <span className="tabular text-xs text-ink-muted">{type.count}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                    <p className="text-sm text-ink-muted" aria-live="polite">{t("resultCount", { count: data.filteredCount })}</p>
                    <div className="flex flex-wrap items-center gap-1 text-sm">
                      <span className="mr-1 text-ink-muted">{t("sortLabel")}:</span>
                      {SORTS.map((value) => (
                        <Link
                          key={value}
                          href={hrefWith({ siralama: value === "newest" ? undefined : value, sehife: undefined })}
                          aria-current={sort === value ? "true" : undefined}
                          className={cn(
                            "inline-flex min-h-11 items-center rounded-sm px-2.5",
                            sort === value ? "font-semibold text-gold-deep" : "text-ink-soft hover:text-ink",
                          )}
                        >
                          {sortLabels[value]}
                        </Link>
                      ))}
                    </div>
                  </div>
                </nav>

                {data.properties.length > 0 ? (
                  <>
                    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {data.properties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                      ))}
                    </div>
                    {data.pageCount > 1 && (
                      <Pagination
                        className="mt-8"
                        page={data.page}
                        totalPages={data.pageCount}
                        buildHref={(target) => hrefWith({ sehife: target > 1 ? String(target) : undefined })}
                      />
                    )}
                  </>
                ) : (
                  <div className="mt-6">
                    <EmptyState
                      title={stats.total > 0 ? t("emptyFiltered") : detail("agencyEmptyTitle")}
                      description={stats.total > 0 ? t("emptyFilteredDescription") : detail("agencyEmptyDescription")}
                      action={stats.total > 0 ? { label: t("resetFilters"), href: `${basePath}#teklifler` } : undefined}
                    />
                  </div>
                )}
              </section>

              {agency.description && (
                <section aria-labelledby="haqqinda-title">
                  <h2 id="haqqinda-title" className="font-sans text-lg font-semibold text-ink">{t("about")}</h2>
                  <div className="mt-3 flex max-w-[72ch] flex-col gap-3 text-base leading-relaxed text-ink-soft">
                    {agency.description.split("\n").filter(Boolean).map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              )}

              {data.serviceAreas.length > 0 && (
                <section aria-labelledby="eraziler-title">
                  <h2 id="eraziler-title" className="font-sans text-lg font-semibold text-ink">{t("areas")}</h2>
                  <p className="mt-1 text-sm text-ink-muted">{t("areasDescription")}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {data.serviceAreas.map((area) => {
                      const place = localizeLocation(area, locale as Locale);
                      const href = area.kind === LOCATION_KINDS.CITY
                        ? `/emlaklar?seher=${encodeURIComponent(area.slug)}`
                        : `/emlaklar?rayon=${encodeURIComponent(area.slug)}`;
                      return (
                        <li key={area.id}>
                          <Link href={href} className={chip(false)}>
                            <MapPin className="size-3.5 text-gold-deep" aria-hidden="true" />
                            {place.name}
                            <span className="tabular text-xs text-ink-muted">{area.count}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {data.agents.length > 0 && (
                <section aria-labelledby="agentler-title">
                  <h2 id="agentler-title" className="font-display text-3xl tracking-[-0.02em] text-ink">{t("agentsTitle")}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{t("agentsDescription", { name: agency.name })}</p>
                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {data.agents.map((agent) => (
                      <AgentCard key={agent.id} agent={agent} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Yapışqan əlaqə paneli: nömrə HTML-də maskalıdır, kliklə limitli API-dən açılır. */}
            <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
              <div className="rounded-xl border border-line bg-paper p-5 shadow-md sm:p-6">
                <h2 className="font-display text-2xl text-ink">{t("contactTitle")}</h2>
                <p className="mt-1 mb-5 text-sm text-ink-soft">{t("contactDescription")}</p>
                <PublisherContactButtons
                  propertyId={agency.slug}
                  endpoint={`/api/agentlikler/${encodeURIComponent(agency.slug)}/elaqe`}
                  maskedPhone={phone ? maskPhone(phone) : null}
                  hasEmail
                  whatsappMessage={agency.name}
                  labels={{
                    showPhone: content("showPhone"),
                    showEmail: content("showEmail"),
                    revealError: content("revealError"),
                    noPhone: content("publisherNoPhone"),
                  }}
                />

                <dl className="mt-6 flex flex-col gap-4 border-t border-line pt-5 text-sm">
                  {agency.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" />
                      <div className="min-w-0">
                        <dt className="text-xs text-ink-muted">{t("address")}</dt>
                        <dd className="text-ink [overflow-wrap:anywhere]">{agency.address}</dd>
                        {mapHref && (
                          <a
                            href={mapHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative mt-1 inline-block text-sm font-medium text-gold-deep underline-offset-4 after:absolute after:inset-x-0 after:-inset-y-3 hover:underline"
                          >
                            {t("openMap")}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {agency.workingHours && (
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" />
                      <div>
                        <dt className="text-xs text-ink-muted">{t("hours")}</dt>
                        <dd className="text-ink">{agency.workingHours}</dd>
                      </div>
                    </div>
                  )}
                  {agency.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" />
                      <div className="min-w-0">
                        <dt className="text-xs text-ink-muted">{t("website")}</dt>
                        <dd>
                          <a href={agency.website} target="_blank" rel="noopener noreferrer" className="break-all text-ink hover:text-gold-deep">
                            {agency.website.replace(/^https?:\/\//, "")}
                          </a>
                        </dd>
                      </div>
                    </div>
                  )}
                  {agency.instagram && (
                    <div className="flex items-start gap-3">
                      <InstagramIcon className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" />
                      <div className="min-w-0">
                        <dt className="text-xs text-ink-muted">{t("instagram")}</dt>
                        <dd>
                          <a
                            href={`https://www.instagram.com/${agency.instagram.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ink hover:text-gold-deep"
                          >
                            @{agency.instagram.replace(/^@/, "")}
                          </a>
                        </dd>
                      </div>
                    </div>
                  )}
                </dl>
                <p className="mt-5 rounded-md bg-warning-bg p-3 text-xs leading-5 text-ink-soft">{t("notice")}</p>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
