import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { PropertyCard } from "@/components/site/property-card";
import { Container, Section } from "@/components/ui/container";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";
import { DEFAULT_LOCALE, type Locale } from "@/lib/constants";
import type { PropertyCardData } from "@/lib/queries";
import { findSeoLanding, type SeoLanding } from "@/lib/seo-landings";
import { formatNumber } from "@/lib/utils";

type SeoLandingPageProps = {
  landing: SeoLanding;
  items: PropertyCardData[];
  total: number;
  page: number;
  totalPages: number;
  locale?: Locale;
};

export function SeoLandingPage({
  landing,
  items,
  total,
  page,
  totalPages,
  locale = DEFAULT_LOCALE,
}: SeoLandingPageProps) {
  const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;

  return (
    <>
      <div className="border-b border-line bg-beige py-8 sm:py-10">
        <Container>
          <Breadcrumbs
            locale={locale}
            items={[
              { label: "Ana səhifə", href: "/" },
              { label: "Əmlaklar", href: "/emlaklar" },
              { label: landing.h1 },
            ]}
          />
          <p className="editorial-kicker mt-6 text-gold-deep">{landing.overline}</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl leading-tight text-ink sm:text-5xl lg:text-6xl">
            {landing.h1}
          </h1>
          <p className="mt-5 text-base text-ink-soft">{formatNumber(total)} aktiv elan</p>
        </Container>
      </div>

      <Section tone="ivory" spacing="cozy">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
            <div className="flex flex-col gap-5 text-base leading-relaxed text-ink-soft">
              {landing.content.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
            <aside className="border-l border-line pl-6">
              <h2 className="font-display text-xl text-ink">Əlaqəli seçimlər</h2>
              <ul className="mt-4 flex flex-col gap-1">
                {landing.relatedPaths.map((path) => {
                  const related = findSeoLanding(path.slice(1));
                  return (
                    <li key={path}>
                      <Link
                        href={`${localePrefix}${path}`}
                        className="flex min-h-11 items-center justify-between gap-3 text-sm text-ink-soft transition-colors hover:text-gold-deep"
                      >
                        {related?.h1 ?? path.replaceAll("-", " ").slice(1)}
                        <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </div>
        </Container>
      </Section>

      <Section tone="paper" spacing="cozy" aria-labelledby="landing-results-title">
        <Container>
          <div className="mb-8 flex flex-col gap-2">
            <p className="editorial-kicker text-gold-deep">Cari portfel</p>
            <h2 id="landing-results-title" className="font-display text-3xl text-ink">
              Uyğun əmlak elanları
            </h2>
          </div>
          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((property, index) => (
                  <PropertyCard key={property.id} property={property} priority={index === 0} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                buildHref={(targetPage) =>
                  `${localePrefix}${landing.path}${targetPage > 1 ? `?sehife=${targetPage}` : ""}`
                }
                className="mt-12"
              />
            </>
          ) : (
            <EmptyState
              title="Bu kateqoriyada hazırda aktiv elan yoxdur"
              description="Yeni elanlar dərc edildikcə burada görünəcək. Cari portfelə baxaraq başqa uyğun variantları araşdıra bilərsiniz."
              action={{ label: "Bütün əmlaklara bax", href: `${localePrefix}/emlaklar` }}
            />
          )}
        </Container>
      </Section>

      <Section tone="ivory" spacing="cozy" aria-labelledby="landing-faq-title">
        <Container size="narrow">
          <h2 id="landing-faq-title" className="font-display text-3xl text-ink">
            Tez-tez verilən suallar
          </h2>
          <div className="mt-7 divide-y divide-line border-y border-line">
            {landing.faq.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="cursor-pointer list-none pr-6 font-medium text-ink marker:hidden">
                  {item.question}
                </summary>
                <p className="mt-3 leading-relaxed text-ink-soft">{item.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
