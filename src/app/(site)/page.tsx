import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Eye,
  Handshake,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { Hero } from "@/components/site/hero";
import { PropertyCard } from "@/components/site/property-card";
import { ProjectCard } from "@/components/site/project-card";
import { PostCard } from "@/components/site/post-card";
import { ServiceIcon } from "@/components/site/service-icon";
import { demoStats, siteConfig } from "@/config/site";
import {
  getBlogCategories,
  getFeaturedProperties,
  getFilterOptions,
  getPosts,
  getProjects,
  getPropertyTypesWithCounts,
  getServices,
} from "@/lib/queries";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";



const WHY_ITEMS = [
  {
    icon: Users,
    title: "Fərdi yanaşma",
    description:
      "Hər müştərinin tələbi fərqlidir. Axtarışı sizin büdcə, ərazi və yaşayış tərzinizə uyğunlaşdırırıq.",
  },
  {
    icon: Building2,
    title: "Geniş əmlak seçimi",
    description:
      "Mənzil, villa, həyət evi, bağ evi, torpaq, ofis və kommersiya obyektləri — hamısı bir platformada.",
  },
  {
    icon: BadgeCheck,
    title: "Peşəkar xidmət",
    description:
      "Baxışdan rəsmiləşdirməyə qədər bütün mərhələlərdə komandamız sizi müşayiət edir.",
  },
  {
    icon: Eye,
    title: "Şəffaf proses",
    description:
      "Əmlakın vəziyyəti, sənədləri və şərtləri barədə məlumat açıq şəkildə təqdim olunur.",
  },
  {
    icon: ShieldCheck,
    title: "Sənəd təhlükəsizliyi",
    description:
      "Hər əməliyyatda hüquqi sənədlərin yoxlanılmasına xüsusi diqqət yetirilir.",
  },
  {
    icon: Handshake,
    title: "Kompleks xidmət",
    description:
      "Alqı-satqıdan təmir, reklam və çəkilişə qədər 7 istiqamətdə dəstək göstəririk.",
  },
];

const PROPERTY_LAYOUT = [
  "lg:col-span-7 lg:row-span-2",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
];

export default async function HomePage() {
  const [featured, propertyTypes, services, projects, posts, filterOptions, categories] =
    await Promise.all([
      getFeaturedProperties(6),
      getPropertyTypesWithCounts(),
      getServices(),
      getProjects(),
      getPosts({ pageSize: 3 }),
      getFilterOptions(),
      getBlogCategories(),
    ]);

  const typeOptions = filterOptions.types.map((type) => ({
    value: type.slug,
    label: type.name,
  }));
  // Rayon seçimi şəhərdən asılı olduğu üçün alt siyahı da ötürülür
  const cityOptions = filterOptions.cities.map((city) => ({
    value: city.slug,
    label: city.name,
    districts: city.children.map((district) => ({
      value: district.slug,
      label: district.name,
    })),
  }));

  const hasDemoContent =
    featured.some((p) => p.isDemo) || projects.some((p) => p.isDemo);

  return (
    <>
      <Hero types={typeOptions} cities={cityOptions} />

      {/* Nümunə məzmun barədə açıq bildiriş */}
      {hasDemoContent && (
        <div className="border-b border-info/20 bg-info-bg">
          <Container className="flex flex-wrap items-center justify-center gap-2 py-3 text-center text-sm text-info">
            <Badge tone="info" className="uppercase">
              Nümunə
            </Badge>
            <span>
              Saytdakı əmlak, layihə və bloq qeydləri hazırda nümunə məlumatdır —
              real elanlar admin panel vasitəsilə əlavə ediləcək.
            </span>
          </Container>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SEÇİLMİŞ ƏMLAKLAR                                                  */}
      {/* ------------------------------------------------------------------ */}
      <Section tone="ivory">
        <Container size="wide">
          <SectionHeader
            overline="Portfel"
            title="Seçilmiş Əmlaklar"
            description="Luxe Home Estate tərəfindən seçilmiş daşınmaz əmlaklar."
            action={{ label: "Bütün əmlaklar", href: "/emlaklar" }}
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
                      priority={index < 3}
                      variant={index === 0 ? "featured" : "standard"}
                    />
                  </Reveal>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Hazırda seçilmiş əmlak yoxdur"
                description="Yeni əmlaklar əlavə edildikcə bu bölmədə göstəriləcək."
                action={{ label: "Bütün əmlaklara bax", href: "/emlaklar" }}
              />
            )}
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* KATEQORİYALAR                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Section tone="paper">
        <Container>
          <SectionHeader
            overline="Kateqoriyalar"
            title="Sizə uyğun məkanı tapın"
            description="Axtardığınız əmlak növünü seçin və uyğun variantlara baxın."
          />

          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {propertyTypes.map((type, index) => (
              <Reveal
                key={type.id}
                delay={index * 50}
                className={index === 0 ? "col-span-2 lg:row-span-2" : undefined}
              >
                <Link
                  href={`/emlaklar?tip=${type.slug}`}
                  className={`group relative flex overflow-hidden rounded-md ${
                    index === 0 ? "aspect-4/3 lg:aspect-auto lg:h-full" : "aspect-4/3"
                  }`}
                >
                  {type.imageUrl ? (
                    <Image
                      src={type.imageUrl}
                      alt={type.name}
                      fill
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="size-full bg-beige" />
                  )}

                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent transition-opacity duration-300 group-hover:from-charcoal/90"
                  />

                  <div className="relative mt-auto flex w-full items-end justify-between gap-3 p-5">
                    <div>
                      <h3 className="font-display text-lg text-white sm:text-xl">
                        {type.name}
                      </h3>
                      <p className="tabular mt-1 text-sm text-white/75">
                        {type._count.properties} elan
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
        <Container>
          <SectionHeader
            overline="Nə edirik"
            title="Xidmətlərimiz"
            description="Daşınmaz əmlakla bağlı bütün ehtiyaclarınız üçün 7 əsas istiqamətdə xidmət."
            tone="dark"
            action={{ label: "Bütün xidmətlər", href: "/xidmetler" }}
          />

          <div className="mt-10 grid gap-px overflow-hidden rounded-md bg-line-dark sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => (
              <Reveal key={service.id} delay={index * 40}>
                <Link
                  href={`/xidmetler/${service.slug}`}
                  className="group flex h-full flex-col gap-4 bg-navy p-6 transition-colors duration-300 hover:bg-navy-soft"
                >
                  <span className="flex size-11 items-center justify-center rounded-xs border border-gold-soft/30 text-gold-soft transition-colors group-hover:border-gold-soft">
                    <ServiceIcon name={service.icon} className="size-5" />
                  </span>

                  <div className="flex flex-col gap-2">
                    <h3 className="font-display text-lg text-ink-invert">
                      {service.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink-invert-soft">
                      {service.shortDescription}
                    </p>
                  </div>

                  <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm text-gold-soft">
                    Ətraflı
                    <ArrowRight
                      className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
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
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal className="relative">
              <div className="relative aspect-4/5 overflow-hidden rounded-md sm:aspect-4/3 lg:aspect-4/5">
                <Image
                  src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80"
                  alt="Müasir memarlıq nümunəsi"
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

            <div className="flex flex-col gap-6">
              <SectionHeader
                overline="Haqqımızda"
                title="Luxe Home Estate haqqında"
                description={`${siteConfig.legalName} daşınmaz əmlak sahəsində alqı-satqı, icarə, ipoteka, təmir-tikinti, reklam və çəkiliş istiqamətlərində fəaliyyət göstərir.`}
              />

              <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-soft">
                <p>
                  Yanaşmamız sadədir: müştərinin real tələbini anlamaq və ona
                  uyğun əmlakı tapmaq. Hər müraciətə fərdi baxırıq — büdcə,
                  ərazi, yaşayış tərzi və gələcək planlar nəzərə alınır.
                </p>
                <p>
                  Əməliyyatın hər mərhələsində şəffaflığa önəm veririk. Əmlakın
                  vəziyyəti, sənədləri və şərtləri barədə məlumat olduğu kimi
                  təqdim olunur.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/haqqimizda" variant="outline">
                  Ətraflı oxu
                </ButtonLink>
                <ButtonLink href="/elaqe" variant="ghost">
                  Bizimlə əlaqə
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
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
            overline="Üstünlüklər"
            title="Niyə Luxe Home Estate?"
            description="Müştərilərimizə təklif etdiyimiz yanaşmanın əsas prinsipləri."
            align="center"
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_ITEMS.map((item, index) => (
              <Reveal key={item.title} delay={index * 50}>
                <div className="flex h-full flex-col gap-4 rounded-md border border-line bg-paper p-6">
                  <span className="flex size-11 items-center justify-center rounded-xs bg-zinc-900 text-gold-soft">
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-lg text-ink">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/*
            NÜMUNƏ STATİSTİKA
            Bu rəqəmlər şirkət tərəfindən təsdiqlənməyib.
            TODO: Real rəqəmləri src/config/site.ts → demoStats bölməsində yeniləyin.
          */}
          {demoStats.enabled && (
            <div className="mt-14">
              {demoStats.isDemo && (
                <p className="mb-4 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-ink-muted">
                  <Badge tone="info" className="uppercase">
                    Nümunə
                  </Badge>
                  Aşağıdakı rəqəmlər nümunədir və şirkət tərəfindən təsdiqlənməyib.
                </p>
              )}

              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-line lg:grid-cols-4">
                {demoStats.items.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center gap-1 bg-paper px-4 py-8 text-center"
                  >
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="tabular font-display text-3xl text-ink sm:text-4xl">
                      {stat.value}
                    </dd>
                    <p className="text-sm text-ink-muted">{stat.label}</p>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* LAYİHƏLƏR                                                          */}
      {/* ------------------------------------------------------------------ */}
      {projects.length > 0 && (
        <Section tone="paper">
          <Container>
            <SectionHeader
              overline="Portfolio"
              title="Layihələrimiz"
              description="Davam edən və tamamlanmış layihələr."
              action={{ label: "Bütün layihələr", href: "/layiheler" }}
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
          <Container>
            <SectionHeader
              overline="Blog"
              title="Faydalı məqalələr"
              description={`${categories.length} kateqoriya üzrə daşınmaz əmlak, bazar və interyer mövzularında yazılar.`}
              action={{ label: "Bütün yazılar", href: "/blog" }}
            />

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.items.map((post, index) => (
                <Reveal key={post.id} delay={index * 60}>
                  <PostCard post={post} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                */}
      {/* ------------------------------------------------------------------ */}
      <Section tone="dark" className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2000&q=80"
            alt=""
            fill
            loading="lazy"
            sizes="100vw"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-zinc-900/85" />
        </div>

        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-2xl font-display text-3xl text-white sm:text-4xl lg:text-5xl">
            Axtardığınız əmlakı tapmaqda kömək edək
          </h2>

          <p className="max-w-xl text-base leading-relaxed text-white/80">
            Tələbinizi bizə bildirin — uyğun variantları seçib sizinlə əlaqə
            saxlayaq.
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/elaqe" variant="primary" size="lg">
              Müraciət göndər
            </ButtonLink>
            <ButtonLink href="/emlaklar" variant="onDark" size="lg">
              Əmlaklara bax
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
