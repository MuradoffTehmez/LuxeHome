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
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { Hero } from "@/components/site/hero";
import { MobileCategoryRail } from "@/components/site/mobile-category-rail";
import { PropertyCard } from "@/components/site/property-card";
import { ProjectCard } from "@/components/site/project-card";
import { PostCard } from "@/components/site/post-card";
import { siteConfig } from "@/config/site";
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
  const categoryItems = propertyTypes.map((type) => ({
    href: `/emlaklar?tip=${type.slug}`,
    label: type.name,
    count: type._count.properties,
    imageUrl: type.imageUrl,
  }));

  return (
    <>
      <Hero types={typeOptions} cities={cityOptions} />

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
        <Container size="wide">
          <SectionHeader
            overline="Kateqoriyalar"
            title="Sizə uyğun məkanı tapın"
            description="Axtardığınız əmlak növünü seçin və uyğun variantlara baxın."
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
                        {item.count} elan
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
              overline="Nə edirik"
              title="Xidmətlərimiz"
              description="Daşınmaz əmlakla bağlı bütün ehtiyaclarınız üçün 7 əsas istiqamətdə xidmət."
              tone="dark"
              action={{ label: "Bütün xidmətlər", href: "/xidmetler" }}
              className="self-start lg:sticky lg:top-32"
            />

            <div className="border-t border-line-dark">
              {services.map((service, index) => (
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
                  alt="Müasir premium memarlıq"
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

          <div className="mt-12 grid gap-x-10 sm:grid-cols-2">
            {WHY_ITEMS.map((item, index) => (
              <Reveal key={item.title} delay={index * 50}>
                <div className="grid h-full grid-cols-[auto_1fr] gap-x-5 gap-y-3 border-t border-line-strong py-6 sm:py-8">
                  <span className="flex size-9 items-center justify-center text-gold-deep">
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-xl text-ink">{item.title}</h3>
                    <span className="tabular editorial-kicker text-ink-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="col-start-2 text-sm leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* LAYİHƏLƏR                                                          */}
      {/* ------------------------------------------------------------------ */}
      {projects.length > 0 && (
        <Section tone="paper">
          <Container size="wide">
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
          <Container size="wide">
            <SectionHeader
              overline="Blog"
              title="Faydalı məqalələr"
              description={`${categories.length} kateqoriya üzrə daşınmaz əmlak, bazar və interyer mövzularında yazılar.`}
              action={{ label: "Bütün yazılar", href: "/blog" }}
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
              <p className="editorial-kicker text-gold-deep">Fərdi seçim</p>
              <h2 className="max-w-xl font-display text-[clamp(2.4rem,4vw,4.5rem)] leading-[0.98] tracking-[-0.04em] text-ink">
                Axtardığınız əmlakı tapmaqda kömək edək
              </h2>

              <p className="max-w-lg text-base leading-relaxed text-ink-soft">
                Tələbinizi bizə bildirin — uyğun variantları seçib sizinlə əlaqə
                saxlayaq.
              </p>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/elaqe" variant="primary" size="lg">
                  Müraciət göndər
                </ButtonLink>
                <ButtonLink href="/emlaklar" variant="outline" size="lg">
                  Əmlaklara bax
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
