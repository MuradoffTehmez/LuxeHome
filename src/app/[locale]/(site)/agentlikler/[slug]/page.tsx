import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ReviewForm } from "@/components/site/review-form";
import { ReviewCard, ReviewCriteriaSummary } from "@/components/site/review-parts";
import { REVIEW_CRITERIA } from "@/lib/constants";
import { submitAgencyReview } from "./actions";
import { Building2, Clock, Eye, FileBadge, Globe, KeyRound, MapPin, MessageSquare, ShieldCheck, Star, Tag, Users, Zap } from "lucide-react";
import { InstagramIcon } from "@/components/site/brand-icons";
import { Container, Section } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { PropertyCard } from "@/components/site/property-card";
import { AgentCard } from "@/components/site/agent-card";
import { PublisherContactButtons } from "@/components/site/publisher-contact";
import { normalizeTelegramUsername } from "@/lib/accounts/telegram";
import { SafetyTips } from "@/components/site/safety-tips";
import { ContactSafetyWarning } from "@/components/site/contact-safety-warning";
import { ClosedDeals } from "@/components/site/closed-deals";
import { ContactForm } from "@/app/[locale]/(site)/elaqe/contact-form";
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
    // Paylaşım kartı (#157): loqo + təklif sayı, 1200×630 — çılpaq loqo əvəzinə.
    image: `/api/og/agency/${encodeURIComponent(data.agency.slug)}?l=${locale}`,
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

  const [t, detail, navigation, content, reviewT] = await Promise.all([
    getTranslations({ locale, namespace: "listings.agencyProfile" }),
    getTranslations({ locale, namespace: "listings.detail" }),
    getTranslations({ locale, namespace: "navigation" }),
    getTranslations({ locale, namespace: "content.propertyDetail" }),
    getTranslations({ locale, namespace: "phase2.agents" }),
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
      <script {...jsonLd(agencySchema({ ...agency, phone, rating: data.rating }, locale as Locale))} />
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
          {/* Örtük şəkli (#157): varsa loqo lövhəsi onun alt kənarına asılır. */}
          {agency.coverUrl && (
            <div className="relative h-40 overflow-hidden rounded-xl border border-line bg-beige shadow-xs sm:h-56 lg:h-64">
              <Image
                src={agency.coverUrl}
                alt=""
                fill
                priority
                sizes="(min-width: 1280px) 1200px, 100vw"
                unoptimized={isUnoptimizedImage(agency.coverUrl)}
                className="object-cover"
              />
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent" />
            </div>
          )}
          <div className={cn("flex flex-col gap-4 sm:flex-row sm:gap-6", agency.coverUrl ? "sm:items-end" : "sm:items-center")}>
            <div
              className={cn(
                "relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-gold-line bg-paper shadow-md sm:size-28",
                agency.coverUrl && "-mt-12 ml-4 ring-4 ring-ivory sm:-mt-14 sm:ml-6",
              )}
            >
              {agency.logoUrl ? (
                <Image
                  src={agency.logoUrl}
                  alt={agency.name}
                  fill
                  priority
                  sizes="112px"
                  unoptimized={isUnoptimizedImage(agency.logoUrl)}
                  className="object-contain"
                />
              ) : (
                <Building2 className="size-10 text-gold-deep" strokeWidth={1.5} aria-hidden="true" />
              )}
            </div>
            <div className={cn("min-w-0", agency.coverUrl && "sm:pt-4")}>
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
                {data.rating && (
                  <a
                    href="#reyler"
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-xs text-ink-soft transition-colors hover:border-gold"
                  >
                    <Star className="size-3.5 fill-gold text-gold-deep" aria-hidden="true" />
                    <span className="sr-only">{t("ratingLabel")}:</span>
                    {t("ratingSummary", { rating: data.rating.average.toFixed(1), count: data.rating.count })}
                  </a>
                )}
                {data.fastResponse && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-deep">
                    <Zap className="size-3.5" aria-hidden="true" />
                    {t("fastResponse")}
                  </span>
                )}
                <span className="text-xs text-ink-muted">
                  {t("since", { date: formatLocalizedDate(agency.createdAt, locale as Locale, "monthYear") ?? "" })}
                </span>
              </div>
            </div>
          </div>

          {/* Statistika zolağı — təklif agentlik üçün, elan agent üçün (sahibin tələbi). */}
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-xs sm:grid-cols-5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
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

              <ClosedDeals deals={data.deals} />

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

              {data.offices.length > 0 && (
                <section aria-labelledby="ofisler-title">
                  <h2 id="ofisler-title" className="font-sans text-lg font-semibold text-ink">{t("officesTitle")}</h2>
                  <p className="mt-1 text-sm text-ink-muted">{t("officesDescription", { count: data.offices.length })}</p>
                  <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {data.offices.map((office) => {
                      const officePhone = isPhoneLike(office.phone) ? office.phone : null;
                      const place = [office.city ? localizeLocation(office.city, locale as Locale).name : null, office.address]
                        .filter(Boolean)
                        .join(", ");
                      return (
                        <li key={office.id} className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-4 shadow-xs">
                          <div>
                            <p className="font-medium text-ink">{office.name}</p>
                            <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-soft">
                              <MapPin className="mt-0.5 size-3.5 shrink-0 text-gold-deep" aria-hidden="true" />
                              <span className="[overflow-wrap:anywhere]">{place}</span>
                            </p>
                            {office.workingHours && (
                              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                                <Clock className="size-3.5 shrink-0 text-gold-deep" aria-hidden="true" />
                                {office.workingHours}
                              </p>
                            )}
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative mt-1 inline-block text-sm font-medium text-gold-deep underline-offset-4 after:absolute after:inset-x-0 after:-inset-y-3 hover:underline"
                            >
                              {t("openMap")}
                            </a>
                          </div>
                          {officePhone && (
                            <PublisherContactButtons
                              propertyId={`${agency.slug}:${office.id}`}
                              endpoint={`/api/agentlikler/${encodeURIComponent(agency.slug)}/elaqe?ofis=${encodeURIComponent(office.id)}`}
                              maskedPhone={maskPhone(officePhone)}
                              hasEmail={false}
                              whatsappMessage={`${agency.name} — ${office.name}`}
                              labels={{
                                showPhone: content("showPhone"),
                                showEmail: content("showEmail"),
                                revealError: content("revealError"),
                                noPhone: content("publisherNoPhone"),
                              }}
                            />
                          )}
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

              {/* Agentlik reytinqi (#161): agentlərin və agentliyin təsdiqlənmiş rəyləri. */}
              {data.reviews.length > 0 && (
                <section id="reyler" aria-labelledby="reyler-title" className="scroll-mt-28">
                  <h2 id="reyler-title" className="font-display text-3xl tracking-[-0.02em] text-ink">{t("reviewsTitle")}</h2>
                  {data.rating && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                      <Star className="size-4 fill-gold text-gold-deep" aria-hidden="true" />
                      {t("reviewsSummary", { rating: data.rating.average.toFixed(1), count: data.rating.count })}
                    </p>
                  )}
                  <ReviewCriteriaSummary averages={data.criteria} />
                  <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {data.reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        footer={review.agentName && review.agentSlug ? (
                          <>
                            {" · "}
                            <Link href={`/agentler/${review.agentSlug}`} className="text-gold-deep underline-offset-4 hover:underline">
                              {t("reviewAgent", { name: review.agentName })}
                            </Link>
                          </>
                        ) : null}
                      />
                    ))}
                  </ul>
                </section>
              )}

              {/* Agentliyə birbaşa rəy (#230, PRD 10.3) — moderasiyadan sonra görünür. */}
              <ReviewForm
                action={submitAgencyReview}
                targetField="agencyId"
                targetId={agency.id}
                labels={{
                  title: reviewT("agencyReviewTitle"),
                  hint: reviewT("reviewHint"),
                  criteria: Object.fromEntries(REVIEW_CRITERIA.map((criterion) => [criterion, reviewT(`criteria.${criterion}`)])) as Record<(typeof REVIEW_CRITERIA)[number], string>,
                  comment: reviewT("comment"),
                  serviceType: reviewT("serviceType"),
                  submit: reviewT("submitReview"),
                }}
              />

              {/* Agentliyə müraciət (#161): bölgü açıqdırsa agentlərdən birinə düşür. */}
              <section id="muraciet" aria-labelledby="muraciet-title" className="scroll-mt-28 rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-6">
                <h2 id="muraciet-title" className="font-sans text-lg font-semibold text-ink">{t("enquiryTitle")}</h2>
                <p className="mt-1 mb-5 text-sm text-ink-soft">{t("enquiryDescription", { name: agency.name })}</p>
                <ContactForm agencySlug={agency.slug} placement="agency_profile" defaultSubject={agency.name} />
              </section>
            </div>

            {/* Yapışqan əlaqə paneli: nömrə HTML-də maskalıdır, kliklə limitli API-dən açılır. */}
            <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
              <div className="rounded-xl border border-line bg-paper p-5 shadow-md sm:p-6">
                <h2 className="font-display text-2xl text-ink">{t("contactTitle")}</h2>
                <p className="mt-1 mb-5 text-sm text-ink-soft">{t("contactDescription")}</p>
                <a
                  href="#muraciet"
                  className="mb-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-gold px-4 text-sm font-semibold text-on-gold shadow-xs transition-colors hover:bg-gold-soft"
                >
                  <MessageSquare className="size-4" aria-hidden="true" />
                  {t("enquiryButton")}
                </a>
                <ContactSafetyWarning className="mb-3" />
                <PublisherContactButtons
                  propertyId={agency.slug}
                  endpoint={`/api/agentlikler/${encodeURIComponent(agency.slug)}/elaqe`}
                  maskedPhone={phone ? maskPhone(phone) : null}
                  hasEmail={Boolean(agency.email?.trim() || agency.phone?.includes("@"))}
                  hasTelegram={Boolean(normalizeTelegramUsername(agency.telegram ?? ""))}
                  whatsappMessage={agency.name}
                  labels={{
                    showPhone: content("showPhone"),
                    showEmail: content("showEmail"),
                    showTelegram: content("showTelegram"),
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
                <SafetyTips className="mt-5" />
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
