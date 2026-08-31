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
import { PostCard } from "@/components/site/post-card";
import { FeaturedPartnership } from "@/components/site/featured-partnership";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { buildManagedMetadata } from "@/lib/seo";
import { getCachedHomePageData } from "@/lib/public-cache";
import { getCategoryImageUrl } from "@/lib/category-images";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";
import { getApprovedTestimonials, getPublicAgents } from "@/lib/phase2";

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

const PROPERTY_LAYOUT = [
  "lg:col-span-7 lg:row-span-2",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
];

const CATEGORY_LAYOUT = [
  "col-span-2 row-span-2 lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
];

const BLOG_LAYOUT = [
  "lg:col-span-7 lg:row-span-2",
  "lg:col-span-5",
  "lg:col-span-5",
];

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "home" });
  const propertyT = await getTranslations({ locale: resolvedLocale, namespace: "property" });
  const phase2T = await getTranslations({ locale: resolvedLocale, namespace: "phase2.testimonials" });
  const wizardT = await getTranslations({ locale: resolvedLocale, namespace: "phase2.wizard" });
  const agentsT = await getTranslations({ locale: resolvedLocale, namespace: "phase2.agents" });
  const aiSearchT = await getTranslations({ locale: resolvedLocale, namespace: "phase3.search" });
  const { featured, propertyTypes, services, projects, posts, filterOptions, categories, partners } =
    await getCachedHomePageData();
  const testimonials = await getApprovedTestimonials(6);
  const agents = (await getPublicAgents()).slice(0, 3);
  const localizedServices = services.map((service) => localizeKnownContent("service", service, resolvedLocale));
  const localizedPropertyTypes = propertyTypes.map((type) => localizeKnownContent("propertyType", type, resolvedLocale));

  const typeOptions = filterOptions.types.map((type) => ({
    value: type.slug,
    label: localizeKnownContent("propertyType", type, resolvedLocale).name,
  }));
  // Rayon seçimi şəhərdən asılı olduğu üçün alt siyahı da ötürülür
  const cityOptions = filterOptions.cities.map((city) => ({
    value: city.slug,
    label: localizeLocation(city, resolvedLocale).name,
    districts: city.children.map((district) => ({
      value: district.slug,
      label: localizeLocation(district, resolvedLocale).name,
    })),
  }));
  const categoryItems = localizedPropertyTypes.map((type) => ({
    href: `/emlaklar?tip=${type.slug}`,
    label: type.name,
    count: type._count.properties,
    imageUrl: getCategoryImageUrl(type.slug, type.imageUrl),
  }));

  return (
    <>
      <Hero types={typeOptions} cities={cityOptions} />
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
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12 lg:auto-rows-fr">
                {featured.map((property, index) => (
                  <Reveal
                    key={property.id}
                    delay={index * 60}
                    className={PROPERTY_LAYOUT[index] ?? "lg:col-span-4"}
                  >
                    <PropertyCard
                      property={property}
                      variant={index === 0 ? "featured" : "standard"}
                    />
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
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Reveal key={testimonial.id} delay={index * 50}>
                  <blockquote className="flex h-full flex-col rounded-md border border-line bg-paper p-6">
                    <Quote className="size-7 text-gold-deep" aria-hidden="true" />
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

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent, index) => {
                const rating = agent.reviews.length
                  ? agent.reviews.reduce((sum, review) => sum + review.rating, 0) / agent.reviews.length
                  : null;
                return (
                  <Reveal key={agent.id} delay={index * 60}>
                    <article className="flex h-full flex-col rounded-md border border-line bg-ivory p-6">
                      <div className="flex items-start gap-4">
                        <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-beige">
                          {agent.avatarUrl ? (
                            <Image src={agent.avatarUrl} alt="" fill sizes="64px" unoptimized={isUnoptimizedImage(agent.avatarUrl)} className="object-cover" />
                          ) : (
                            <Users className="size-7 text-ink-muted" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-xl text-ink">
                            <Link href={`/agentler/${agent.slug}`} className="hover:text-gold-deep">{agent.name}</Link>
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
      <Section tone="navy">
        <Container size="wide">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <p className="editorial-kicker text-gold">{wizardT("eyebrow")}</p>
              <h2 className="mt-3 max-w-2xl font-display text-[clamp(2rem,3.4vw,3.25rem)] leading-[1.05] tracking-[-0.03em] text-ivory">
                {wizardT("title")}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ivory/75">
                {wizardT("description")}
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm text-ivory/60">
                <Sparkles className="size-4 shrink-0 text-gold" aria-hidden="true" />
                {wizardT("homeNote")}
              </p>
            </div>
            <Link href="/mene-emlak-tap" className={buttonClassName("onDark", "lg")}>
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

          <div className="mt-10 hidden auto-rows-[17rem] grid-cols-12 gap-3 lg:grid">
            {categoryItems.map((item, index) => (
              <Reveal
                key={item.href}
                delay={index * 50}
                className={CATEGORY_LAYOUT[index] ?? "lg:col-span-4"}
              >
                <Link
                  href={item.href}
                  className="group relative flex size-full min-h-40 overflow-hidden rounded-sm"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.label}
                      fill
                      unoptimized={isUnoptimizedImage(item.imageUrl)}
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="image-lift object-cover"
                    />
                  ) : (
                    <div className="size-full bg-beige" />
                  )}

                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-charcoal/90 via-charcoal/38 to-transparent transition-opacity duration-300 group-hover:opacity-95"
                  />

                  <div className="relative mt-auto flex w-full items-end justify-between gap-3 p-5">
                    <div>
                      <h3 className="font-display text-lg text-white sm:text-xl">
                        {item.label}
                      </h3>
                      <p className="tabular mt-1 text-sm text-white/75">
                        {propertyT("listingCount", { count: item.count })}
                      </p>
                    </div>
                    <ArrowUpRight
                      className="size-5 shrink-0 text-gold-soft transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
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
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <SectionHeader
              overline={t("services.overline")}
              title={t("services.title")}
              description={t("services.description")}
              tone="dark"
              action={{ label: t("services.all"), href: "/xidmetler" }}
              className="self-start lg:sticky lg:top-32"
            />

            <div className="border-t border-line-dark">
              {localizedServices.map((service, index) => (
                <Reveal key={service.id} delay={index * 40}>
                  <Link
                    href={`/xidmetler/${service.slug}`}
                    className="group grid min-h-32 grid-cols-[2.5rem_1fr_auto] items-start gap-4 border-b border-line-dark py-6 transition-colors duration-300 hover:text-gold-soft sm:grid-cols-[3rem_0.7fr_1fr_auto] sm:items-center"
                  >
                    <span className="tabular editorial-kicker pt-1 text-gold-soft sm:pt-0">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-xl text-ink-invert sm:text-2xl">
                      {service.title}
                    </h3>
                    <p className="col-start-2 text-sm leading-relaxed text-ink-invert-soft sm:col-start-auto">
                      {service.shortDescription}
                    </p>
                    <ArrowRight
                      className="mt-1 size-4 text-gold-soft transition-transform duration-300 group-hover:translate-x-1 sm:mt-0"
                      aria-hidden="true"
                    />
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* HAQQIMIZDA                                                         */}
      {/* ------------------------------------------------------------------ */}
      <Section tone="ivory">
        <Container size="wide">
          <div className="grid items-center gap-0 lg:grid-cols-12">
            <Reveal className="relative lg:col-span-7 lg:col-start-1 lg:row-start-1">
              <div className="relative aspect-4/5 overflow-hidden rounded-md sm:aspect-4/3 lg:aspect-4/5">
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
                className="absolute -right-3 -bottom-3 hidden size-32 border-r border-b border-gold lg:block"
              />
            </Reveal>

            <div className="relative z-10 mt-[-2rem] mx-4 flex flex-col gap-6 bg-paper p-7 shadow-editorial sm:mx-10 sm:p-10 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:mx-0 lg:mt-0 lg:-ml-20 lg:p-12">
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

          <div className="mt-12 grid gap-x-10 sm:grid-cols-2">
            {WHY_ITEMS.map((item, index) => (
              <Reveal key={item.key} delay={index * 50}>
                <div className="grid h-full grid-cols-[auto_1fr] gap-x-5 gap-y-3 border-t border-line-strong py-6 sm:py-8">
                  <span className="flex size-9 items-center justify-center text-gold-deep">
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-xl text-ink">{t(`why.items.${item.key}.title`)}</h3>
                    <span className="tabular editorial-kicker text-ink-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="col-start-2 text-sm leading-relaxed text-ink-soft">
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
      {projects.length > 0 && (
        <Section tone="paper">
          <Container size="wide">
            <SectionHeader
              overline={t("projects.overline")}
              title={t("projects.title")}
              description={t("projects.description")}
              action={{ label: t("projects.all"), href: "/layiheler" }}
            />

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-12 lg:auto-rows-fr">
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
          <div className="grid lg:grid-cols-12">
            <div className="relative aspect-4/3 overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[34rem]">
              <Image
                src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2000&q=80"
                alt=""
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col justify-center gap-6 bg-ivory p-7 sm:p-10 lg:col-span-5 lg:p-14">
              <p className="editorial-kicker text-gold-deep">{t("cta.overline")}</p>
              <h2 className="max-w-xl font-display text-[clamp(2.4rem,4vw,4.5rem)] leading-[0.98] tracking-[-0.04em] text-ink">
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
    </>
  );
}
