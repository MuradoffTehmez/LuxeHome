import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { FilterChip, FilterChipRow } from "@/components/ui/filter-chip";
import {
  breadcrumbSchema,
  buildManagedMetadata,
  definedTermSetSchema,
  jsonLd,
} from "@/lib/seo";
import { routing } from "@/i18n/routing";
import { getCachedKnowledgeTerms } from "@/lib/public-cache";
import { groupTermsByInitial } from "@/lib/knowledge";
import type { Locale } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "knowledge.glossary" });

  return buildManagedMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/lugat",
    locale: resolved as Locale,
  });
}

export default async function GlossaryPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const [t, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "knowledge" }),
    getTranslations({ locale, namespace: "navigation" }),
  ]);

  const search = typeof query.axtaris === "string" ? query.axtaris.trim() : "";
  const initial = typeof query.herf === "string" ? query.herf.trim().toUpperCase() : "";

  // Hərf indeksi həmişə tam siyahıdan qurulur — filtr tətbiq olunanda da
  // istifadəçi digər hərflərə keçə bilməlidir.
  const [allTerms, terms] = await Promise.all([
    getCachedKnowledgeTerms({}),
    getCachedKnowledgeTerms({ search: search || undefined, initial: initial || undefined }),
  ]);

  const letters = [...new Set(allTerms.map((term) => term.initial || "#"))].sort((a, b) =>
    a.localeCompare(b, "az"),
  );
  const groups = groupTermsByInitial(terms);

  return (
    <>
      <script
        {...jsonLd(
          breadcrumbSchema(
            [
              { name: navigation("home"), path: "/" },
              { name: t("hub.eyebrow"), path: "/bilik-merkezi" },
              { name: t("glossary.title"), path: "/lugat" },
            ],
            locale as Locale,
          ),
        )}
      />
      {allTerms.length > 0 && (
        <script {...jsonLd(definedTermSetSchema(allTerms, locale as Locale))} />
      )}

      <PageHeader
        eyebrow={t("glossary.eyebrow")}
        title={t("glossary.title")}
        description={t("glossary.description")}
        breadcrumbs={[
          { label: navigation("home"), href: "/" },
          { label: t("hub.eyebrow"), href: "/bilik-merkezi" },
          { label: t("glossary.title") },
        ]}
      />

      <div className="border-b border-line bg-paper">
        <Container>
          <form
            method="GET"
            action=""
            role="search"
            className="flex flex-col gap-3 pt-6 pb-5 sm:flex-row sm:items-center"
          >
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-sm border border-line-strong bg-paper px-4 focus-within:border-gold">
              <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="sr-only">{t("glossary.searchLabel")}</span>
              <input
                type="search"
                name="axtaris"
                defaultValue={search}
                placeholder={t("glossary.searchPlaceholder")}
                className="min-h-12 w-full bg-transparent text-base text-ink placeholder:text-ink-muted focus:outline-none sm:text-sm"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-xs border border-charcoal bg-charcoal px-8 text-sm font-medium text-ink-invert transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              {t("glossary.searchAction")}
            </button>
          </form>

          {letters.length > 0 && (
            <FilterChipRow label={t("glossary.allLetters")} className="pb-5">
              <FilterChip href="/lugat" active={!initial}>
                {t("glossary.allLetters")}
              </FilterChip>
              {letters.map((letter) => (
                <FilterChip
                  key={letter}
                  href={`/lugat?herf=${encodeURIComponent(letter)}`}
                  active={initial === letter}
                  className="min-w-11 px-0"
                >
                  {letter}
                </FilterChip>
              ))}
            </FilterChipRow>
          )}
        </Container>
      </div>

      <Section tone="ivory" spacing="cozy">
        <Container>
          {groups.length > 0 ? (
            <div className="flex flex-col gap-14">
              {groups.map(([letter, items]) => (
                <section key={letter} aria-labelledby={`letter-${letter}`} className="min-w-0">
                  <h2
                    id={`letter-${letter}`}
                    className="border-b border-gold-line pb-3 font-display text-3xl text-gold-deep"
                  >
                    {letter}
                  </h2>
                  <dl className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-2">
                    {items.map((term) => (
                      <div key={term.id} className="min-w-0">
                        <dt className="font-sans text-lg font-semibold leading-snug text-ink">
                          <Link
                            href={`/lugat/${term.slug}`}
                            className="rounded-xs transition-colors hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                          >
                            {term.term}
                          </Link>
                        </dt>
                        <dd className="mt-2 text-[0.9375rem] leading-7 text-ink-soft [overflow-wrap:anywhere]">
                          {term.shortDefinition}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState
              title={search || initial ? t("glossary.noResults") : t("glossary.empty")}
              description={t("glossary.emptyDescription")}
              action={{ label: t("glossary.allLetters"), href: "/lugat" }}
            />
          )}
        </Container>
      </Section>
    </>
  );
}
