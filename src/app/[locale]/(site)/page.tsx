import Image from "next/image";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Eye,
  Handshake,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { LOCATION_KINDS } from "@/lib/constants";
import { isProjectsSectionEnabled } from "@/lib/site-sections";
import { Badge } from "@/components/ui/badge";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { Hero } from "@/components/site/hero";
import { AiSearchForm } from "@/components/site/ai-search-form";
import { HomeSeoIntro } from "@/components/site/home-seo-intro";
import { MobileCategoryRail } from "@/components/site/mobile-category-rail";
import { PropertyCard } from "@/components/site/property-card";
import { isUnoptimizedImage } from "@/lib/utils";
import { ProjectCard } from "@/components/site/project-card";
import { ServiceIcon } from "@/components/site/service-icon";
import { PostCard } from "@/components/site/post-card";
import { FeaturedPartnership } from "@/components/site/featured-partnership";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { buildManagedMetadata } from "@/lib/seo";
import { getCachedHomePageData, getCachedHomeSocialProof } from "@/lib/public-cache";
import { getCategoryImageUrl } from "@/lib/category-images";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";

type HomePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "home" });

  return buildManagedMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/",
    locale: resolvedLocale,
  });
}


const WHY_ITEMS = [
  { icon: Users, key: "personal" }, { icon: Building2, key: "selection" },
  { icon: BadgeCheck, key: "service" }, { icon: Eye, key: "transparent" },
  { icon: ShieldCheck, key: "documents" }, { icon: Handshake, key: "complete" },
] as const;

/** Ana səhifədə xidmətlərin ilk hissəsi göstərilir; tam siyahı `/xidmetler`-dədir. */
const HOME_SERVICE_LIMIT = 6;

const BLOG_LAYOUT = [
  "lg:col-span-7 lg:row-span-2",
  "lg:col-span-5",
  "lg:col-span-5",
];

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const [
    t,
    propertyT,
    phase2T,
    wizardT,
    agentsT,
    aiSearchT,
    listingSearchT,
    { featured, propertyTypes, services, projects, posts, filterOptions, categories, partners },
    { testimonials, agents },
    projectsEnabled,
  ] = await Promise.all([
    getTranslations({ locale: resolvedLocale, namespace: "home" }),
    getTranslations({ locale: resolvedLocale, namespace: "property" }),
    getTranslations({ locale: resolvedLocale, namespace: "phase2.testimonials" }),
    getTranslations({ locale: resolvedLocale, namespace: "phase2.wizard" }),
    getTranslations({ locale: resolvedLocale, namespace: "phase2.agents" }),
    getTranslations({ locale: resolvedLocale, namespace: "phase3.search" }),
    getTranslations({ locale: resolvedLocale, namespace: "listings.search" }),
    getCachedHomePageData(),
    getCachedHomeSocialProof(),
    isProjectsSectionEnabled(),
  ]);
  const localizedServices = services.map((service) => localizeKnownContent("service", service, resolvedLocale));
  const localizedPropertyTypes = propertyTypes.map((type) => localizeKnownContent("propertyType", type, resolvedLocale));

  const typeOptions = filterOptions.types.map((type) => ({
    value: type.slug,
    label: localizeKnownContent("propertyType", type, resolvedLocale).name,
  }));
  // Rayon seçimi şəhərdən asılı olduğu üçün alt siyahı da ötürülür. Bakıda
  // qəsəbələr inzibati rayonun altındadır, ona görə iki səviyyə birləşdirilir.
  const cityOptions = filterOptions.cities.map((city) => ({
    value: city.slug,
    label: localizeLocation(city, resolvedLocale).name,
    districts: city.children.flatMap((child) => {
      const label = localizeLocation(child, resolvedLocale).name;
      const self = { value: child.slug, label, kind: child.kind };
      if (child.kind !== LOCATION_KINDS.DISTRICT) return [self];
      return [
        self,
        ...child.children.map((grandchild) => ({
          value: grandchild.slug,
          label: localizeLocation(grandchild, resolvedLocale).name,
          kind: grandchild.kind,
          group: label,
        })),
      ];
    }),
  }));
  const categoryItems = localizedPropertyTypes.map((type) => ({
    href: `/emlaklar?tip=${type.slug}`,
    label: type.name,
    count: type._count.properties,
    imageUrl: getCategoryImageUrl(type.slug, type.imageUrl),
  }));

  return (
    <>
      <Hero
        types={typeOptions}
        cities={cityOptions}
        locale={resolvedLocale}
        labels={{
          imageAlt: t("hero.imageAlt"),
          eyebrow: t("hero.eyebrow"),
          title: t("hero.title"),
          description: t("hero.description"),
          viewProperties: t("hero.viewProperties"),
          contactUs: t("hero.contactUs"),
          call: t("hero.call"),
          search: {
            listingType: listingSearchT("listingType"),
            sale: listingSearchT("sale"),
            rent: listingSearchT("rent"),
            query: listingSearchT("search"),
            queryPlaceholder: listingSearchT("queryPlaceholder"),
            propertyType: listingSearchT("propertyType"),
            city: listingSearchT("city"),
            all: listingSearchT("all"),
            submit: listingSearchT("submit"),
          },
        }}
      />
      <div className="home-deferred-content">
      <Section tone="beige" spacing="cozy">
        <Container size="wide">
          <SectionHeader
            overline={aiSearchT("overline")}
            title={aiSearchT("title")}
            description={aiSearchT("description")}
          />
          <div className="mt-8">
            <AiSearchForm
              initialQuery=""
              locale={resolvedLocale}
              labels={{
                placeholder: aiSearchT("placeholder"),
                submit: aiSearchT("submit"),
                example: aiSearchT("example"),
              }}
            />
          </div>
        </Container>
      </Section>
      <HomeSeoIntro locale={resolvedLocale} />

      {/* ------------------------------------------------------------------ */}
      {/* SEÇİLMİŞ ƏMLAKLAR                                                  */}
      {/* ------------------------------------------------------------------ */}
      <Section tone="ivory">
        <Container size="wide">
          <SectionHeader
            overline={t("featured.overline")}
            title={t("featured.title")}
            description={t("featured.description")}
            action={{ label: t("featured.all"), href: "/emlaklar" }}
          />

          <div className="mt-10">
            {featured.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((property, index) => (
                  <Reveal key={property.id} delay={index * 60}>
                    <PropertyCard property={property} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t("featured.emptyTitle")}
                description={t("featured.emptyDescription")}
                action={{ label: t("featured.emptyAction"), href: "/emlaklar" }}
              />
            )}
          </div>
        </Container>
      </Section>

      {testimonials.length > 0 && (
        <Section tone="ivory">
          <Container size="wide">
            <SectionHeader
              overline={phase2T("overline")}
              title={phase2T("title")}
              description={phase2T("description")}
              align="center"
            />
            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Reveal key={testimonial.id} delay={index * 50}>
                  <blockquote className="flex h-full flex-col rounded-lg border border-line bg-paper p-6 shadow-xs sm:p-7">
                    <Quote className="size-8 fill-gold/15 text-gold-deep" aria-hidden="true" />
                    <p className="mt-5 flex-1 text-base leading-relaxed text-ink-soft">“{testimonial.review}”</p>
                    <footer className="mt-6 border-t border-line pt-4">
                      <div className="flex gap-0.5 text-gold-deep" aria-label={`${testimonial.rating}/5`}>
                        {Array.from({ length: testimonial.rating }, (_, star) => <Star key={star} className="size-4 fill-current" aria-hidden="true" />)}
                      </div>
                      <p className="mt-2 font-medium text-ink">{testimonial.customerName}</p>
                      <p className="text-xs text-ink-muted">{testimonial.serviceType ?? testimonial.agent?.name ?? testimonial.agency?.name}</p>
                    </footer>
                  </blockquote>
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* AGENTLƏR — PRD bölmə 5.5                                           */}
      {/* ------------------------------------------------------------------ */}
      {agents.length > 0 && (
        <Section tone="paper">
          <Container size="wide">
            <SectionHeader
              overline={agentsT("title")}
              title={agentsT("homeTitle")}
              description={agentsT("description")}
              action={{ label: agentsT("homeAll"), href: "/agentler" }}
            />

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent, index) => {
                const rating = agent.reviews.length
                  ? agent.reviews.reduce((sum, review) => sum + review.rating, 0) / agent.reviews.length
                  : null;
                return (
                  <Reveal key={agent.id} delay={index * 60}>
                    <article className="card-surface relative flex h-full flex-col bg-ivory p-6">
                      <div className="flex items-start gap-4">
                        <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-beige ring-2 ring-gold/30 ring-offset-2 ring-offset-ivory">
                          {agent.avatarUrl ? (
                            <Image src={agent.avatarUrl} alt="" fill sizes="64px" unoptimized={isUnoptimizedImage(agent.avatarUrl)} className="object-cover" />
                          ) : (
                            <Users className="size-7 text-ink-muted" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg text-ink">
                            <Link
                              href={`/agentler/${agent.slug}`}
                              className="after:absolute after:inset-0 after:rounded-lg after:content-[''] hover:text-gold-deep"
                            >
                              {agent.name}
                            </Link>
                          </h3>
                          {agent.agency && <p className="text-sm text-ink-muted">{agent.agency.name}</p>}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {agent.isVerified && <Badge tone="gold">{agentsT("verified")}</Badge>}
                            {rating != null && (
                              <Badge tone="neutral">
                                <Star className="mr-1 size-3.5 fill-gold text-gold-deep" aria-hidden="true" />
                                {rating.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 flex-1 text-sm text-ink-soft">
                        {agent.specialization || agent.roleTitle || agentsT("about")}
                      </p>
                      <p className="mt-3 text-xs text-ink-muted">
                        {agentsT("soldRented", { sold: agent.soldCount, rented: agent.rentedCount })} · {agent._count.properties} {agentsT("listings").toLocaleLowerCase()}
                      </p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </Section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ƏMLAK TAPMA KÖMƏKÇİSİ                                              */}
      {/* ------------------------------------------------------------------ */}
      <Section tone="ivory" spacing="compact">
        <Container size="wide">
          <div className="on-dark relative isolate grid grid-cols-1 items-center gap-8 overflow-hidden rounded-2xl bg-navy px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-14 lg:py-14">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_88%_12%,rgb(196_165_117/0.28),transparent_42%),radial-gradient(circle_at_0%_100%,rgb(196_165_117/0.12),transparent_40%)]"
            />
            <div className="min-w-0">
              <p className="editorial-kicker text-gold-soft">{wizardT("eyebrow")}</p>
              <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.875rem,3vw,2.75rem)] leading-[1.1] tracking-[-0.025em] text-ivory">
                {wizardT("title")}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ivory/75">
                {wizardT("description")}
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm text-ivory/65">
                <Sparkles className="size-4 shrink-0 text-gold-soft" aria-hidden="true" />
                {wizardT("homeNote")}
              </p>
            </div>
            <Link href="/mene-emlak-tap" className={buttonClassName("primary", "lg")}>
              {wizardT("homeCta")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* KATEQORİYALAR                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Section tone="paper">
        <Container size="wide">
          <SectionHeader
            overline={t("categories.overline")}
            title={t("categories.title")}
            description={t("categories.description")}
          />

          <MobileCategoryRail items={categoryItems} />

          <div className="mt-10 hidden gap-4 lg:grid lg:grid-cols-4 xl:grid-cols-5">
            {categoryItems.map((item, index) => (
              <Reveal key={item.href} delay={(index % 5) * 40}>
                <Link
                  href={item.href}
                  className="group relative flex aspect-4/3 overflow-hidden rounded-lg border border-line bg-beige shadow-xs transition-shadow duration-300 hover:shadow-lg"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      unoptimized={isUnoptimizedImage(item.imageUrl)}
                      loading="lazy"
                      sizes="(max-width: 1279px) 25vw, 20vw"
                      className="image-lift object-cover"
                    />
                  ) : null}

                  {/* Sabit tünd qradiyent — `charcoal` tokeni tünd rejimdə açığa dönür. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent"
                  />

                  <div className="relative mt-auto flex w-full items-end justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-base text-white">{item.label}</h3>
                      <p className="tabular mt-0.5 text-xs text-white/80">
                        {propertyT("listingCount", { count: item.count })}
                      </p>
                    </div>
                    <span className="on-image-chip grid size-8 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:-translate-y-0.5">
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* XİDMƏTLƏR                                                          */}
      {/* ------------------------------------------------------------------ */}
      <Section tone="navy">
        <Container size="wide">
          <SectionHeader
            overline={t("services.overline")}
            title={t("services.title")}
            description={t("services.description")}
            tone="dark"
            action={{ label: t("services.all"), href: "/xidmetler" }}
          />

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {localizedServices.slice(0, HOME_SERVICE_LIMIT).map((service, index) => (
              <Reveal key={service.id} delay={index * 50}>
                <Link
                  href={`/xidmetler/${service.slug}`}
                  className="group flex h-full flex-col gap-4 rounded-lg border border-line-dark bg-navy-soft p-6 transition-[border-color,transform] duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-gold-soft/60 sm:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-12 place-items-center rounded-md bg-gold/15 text-gold-soft">
                      <ServiceIcon name={service.icon} className="size-6" />
                    </span>
                    <ArrowUpRight
                      className="size-5 text-ink-invert-soft transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold-soft"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-lg text-ink-invert">{service.title}</h3>
                  <p className="line-clamp-3 text-sm leading-relaxed text-ink-invert-soft">
                    {service.shortDescription}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* HAQQIMIZDA                                                         */}
      {/* ------------------------------------------------------------------ */}
      <Section tone="ivory">
        <Container size="wide">
          <div className="grid grid-cols-1 items-center gap-0 lg:grid-cols-12">
            <Reveal className="relative lg:col-span-7 lg:col-start-1 lg:row-start-1">
              <div className="relative aspect-4/5 overflow-hidden rounded-xl sm:aspect-4/3 lg:aspect-4/5">
                <Image
                  src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80"
                  alt={t("about.imageAlt")}
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* İncə qızılı çərçivə detalı */}
              <div
                aria-hidden="true"
                className="absolute -right-3 -bottom-3 hidden size-32 rounded-br-xl border-r border-b border-gold lg:block"
              />
            </Reveal>

            <div className="relative z-10 mt-[-2rem] mx-4 flex flex-col gap-6 rounded-xl border border-line bg-paper p-7 shadow-editorial sm:mx-10 sm:p-10 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:mx-0 lg:mt-0 lg:-ml-20 lg:p-12">
              <SectionHeader
                overline={t("about.overline")}
                title={t("about.title")}
                description={t("about.description", { legalName: siteConfig.legalName })}
              />

              <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-soft">
                <p>{t("about.paragraph1")}</p>
                <p>{t("about.paragraph2")}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/haqqimizda" className={buttonClassName("outline")}>
                  {t("about.more")}
                </Link>
                <Link href="/elaqe" className={buttonClassName("ghost")}>
                  {t("about.contact")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* NİYƏ LUXE HOME ESTATE                                               */}
      {/* ------------------------------------------------------------------ */}
      <Section tone="beige">
        <Container>
          <SectionHeader
            overline={t("why.overline")}
            title={t("why.title")}
            description={t("why.description")}
            align="center"
          />

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_ITEMS.map((item, index) => (
              <Reveal key={item.key} delay={index * 50}>
                <div className="flex h-full flex-col gap-4 rounded-lg border border-line bg-paper p-6 shadow-xs sm:p-7">
                  <span className="grid size-12 place-items-center rounded-md bg-gold/12 text-gold-deep">
                    <item.icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg text-ink">{t(`why.items.${item.key}.title`)}</h3>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {t(`why.items.${item.key}.description`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* RƏSMİ TƏRƏFDAŞLAR                                                  */}
      {/* ------------------------------------------------------------------ */}
      {/*
        Bölmə «Niyə Luxe Home Estate» ilə «Layihələr» arasındadır: etibar
        siqnalları bir yerdə toplanır, amma bölmə hero-dan aşağıdadır və
        ana səhifənin LCP elementinə toxunmur.
      */}
      <FeaturedPartnership partners={partners} locale={resolvedLocale} />

      {/* ------------------------------------------------------------------ */}
      {/* LAYİHƏLƏR                                                          */}
      {/* ------------------------------------------------------------------ */}
      {/* Bölmə paneldən bağlana bilər (`site.projects_enabled`) — #83. */}
      {projectsEnabled && projects.length > 0 && (
        <Section tone="paper">
          <Container size="wide">
            <SectionHeader
              overline={t("projects.overline")}
              title={t("projects.title")}
              description={t("projects.description")}
              action={{ label: t("projects.all"), href: "/layiheler" }}
            />

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 3).map((project, index) => (
                <Reveal key={project.id} delay={index * 60}>
                  <ProjectCard project={project} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* BLOG                                                               */}
      {/* ------------------------------------------------------------------ */}
      {posts.items.length > 0 && (
        <Section tone="ivory">
          <Container size="wide">
            <SectionHeader
              overline={t("blog.overline")}
              title={t("blog.title")}
              description={t("blog.description", { count: categories.length })}
              action={{ label: t("blog.all"), href: "/blog" }}
            />

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12 lg:auto-rows-fr">
              {posts.items.map((post, index) => (
                <Reveal
                  key={post.id}
                  delay={index * 60}
                  className={BLOG_LAYOUT[index] ?? "lg:col-span-4"}
                >
                  <PostCard
                    post={post}
                    variant={index === 0 ? "featured" : "standard"}
                  />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                */}
      {/* ------------------------------------------------------------------ */}
      <Section tone="beige" spacing="none" className="overflow-hidden">
        <Container size="wide" className="py-14 sm:py-18 lg:py-24">
          <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line shadow-md lg:grid-cols-12">
            <div className="relative aspect-4/3 overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[30rem]">
              <Image
                src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2000&q=80"
                alt=""
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col justify-center gap-6 bg-paper p-7 sm:p-10 lg:col-span-5 lg:p-14">
              <p className="editorial-kicker text-gold-deep">{t("cta.overline")}</p>
              <h2 className="max-w-xl font-display text-[clamp(2rem,3.2vw,3.25rem)] leading-[1.08] tracking-[-0.025em] text-ink">
                {t("cta.title")}
              </h2>

              <p className="max-w-lg text-base leading-relaxed text-ink-soft">
                {t("cta.description")}
              </p>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Link href="/elaqe" className={buttonClassName("primary", "lg")}>
                  {t("cta.send")}
                </Link>
                <Link href="/emlaklar" className={buttonClassName("outline", "lg")}>
                  {t("cta.view")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
      </div>
    </>
  );
}
