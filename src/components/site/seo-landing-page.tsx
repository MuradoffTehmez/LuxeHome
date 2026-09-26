"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { PropertyCard } from "@/components/site/property-card";
import { Container, Section } from "@/components/ui/container";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";
import { DEFAULT_LOCALE, type Locale } from "@/lib/constants";
import type { PropertyCardData } from "@/lib/queries";
import { findSeoLanding, localizeSeoLanding, type SeoLanding } from "@/lib/seo-landings";

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
  const nav = useTranslations("navigation");
  const t = useTranslations("seoLandings");
  const content = useTranslations("content");

  return (
    <>
      <div className="border-b border-line bg-[linear-gradient(180deg,var(--color-paper)_0%,var(--surface-page)_100%)] py-10 sm:py-14">
        <Container>
          <Breadcrumbs
            locale={locale}
            items={[
              { label: nav("home"), href: "/" },
              { label: nav("properties"), href: "/emlaklar" },
              { label: landing.h1 },
            ]}
          />
          <p className="editorial-kicker mt-6 flex items-center gap-3 text-gold-deep"><span aria-hidden="true" className="h-px w-8 bg-gold/60" />{landing.overline}</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.1] tracking-[-0.025em] text-ink sm:text-5xl lg:text-[3.5rem]">
            {landing.h1}
          </h1>
          <p className="mt-5 inline-flex min-h-9 items-center rounded-full border border-line bg-paper px-4 text-sm font-medium text-ink-soft shadow-xs">{content("activeListings", { count: total })}</p>
        </Container>
      </div>

      <Section tone="ivory" spacing="cozy">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
            <div className="flex max-w-[72ch] flex-col gap-5 text-base leading-relaxed text-ink-soft">
              {landing.content.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
            <aside className="self-start rounded-xl border border-line bg-paper p-5 shadow-xs lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              <h2 className="font-sans text-base font-semibold text-ink">{t("related")}</h2>
              <ul className="mt-3 flex flex-col divide-y divide-line">
                {landing.relatedPaths.map((path) => {
                  const related = findSeoLanding(path.slice(1));
                  const localizedRelated = related ? localizeSeoLanding(related, locale) : null;
                  return (
                    <li key={path}>
                      <Link
                        href={path}
                        className="group/related flex min-h-11 items-center justify-between gap-3 text-sm text-ink-soft transition-colors hover:text-gold-deep"
                      >
                        {localizedRelated?.h1 ?? path.replaceAll("-", " ").slice(1)}
                        <ArrowRight className="size-3.5 shrink-0 text-gold-deep transition-transform duration-200 group-hover/related:translate-x-0.5" aria-hidden="true" />
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
            <p className="editorial-kicker text-gold-deep">{content("portfolio")}</p>
            <h2 id="landing-results-title" className="font-display text-3xl text-ink">
              {content("matchingListings")}
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
                  `${landing.path}${targetPage > 1 ? `?sehife=${targetPage}` : ""}`
                }
                className="mt-12"
              />
            </>
          ) : (
            <EmptyState
              title={t("emptyTitle")}
              description={t("emptyDescription")}
              action={{ label: t("allProperties"), href: "/emlaklar" }}
            />
          )}
        </Container>
      </Section>

      <Section tone="ivory" spacing="cozy" aria-labelledby="landing-faq-title">
        <Container size="narrow">
          <h2 id="landing-faq-title" className="font-display text-3xl text-ink">
            {nav("faq")}
          </h2>
          <div className="mt-7 flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper shadow-xs">
            {landing.faq.map((item) => (
              <details key={item.question} className="group px-4 transition-colors open:bg-ivory/50 sm:px-6">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[0.9375rem] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">{item.question}</span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-beige text-ink-soft transition-colors group-open:bg-gold/15 group-open:text-gold-deep">
                    <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                  </span>
                </summary>
                <p className="pb-4 leading-relaxed text-ink-soft">{item.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
