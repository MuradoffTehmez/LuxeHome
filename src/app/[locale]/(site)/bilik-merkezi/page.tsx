import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight, BookOpen, Calculator, HelpCircle, Library, Search, Tag, X } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { FilterChip, FilterChipRow } from "@/components/ui/filter-chip";
import { Reveal } from "@/components/ui/reveal";
import { Pagination } from "@/components/ui/pagination";
import { KnowledgeCard } from "@/components/site/knowledge-card";
import { KnowledgeAdvisor } from "@/components/site/knowledge-advisor";
import { SectionHeading } from "@/components/site/section-heading";
import { buildManagedMetadata, breadcrumbSchema, itemListSchema, jsonLd } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import { FAQ_CATEGORIES, KNOWLEDGE_AUDIENCES, type Locale } from "@/lib/constants";
import {
  getCachedFaqEntries,
  getCachedKnowledgeArticles,
  getCachedKnowledgeCategories,
  getCachedKnowledgeTagCounts,
  getCachedKnowledgeTerms,
} from "@/lib/public-cache";
import { knowledgeTagSlug, searchFaqEntries } from "@/lib/knowledge";

// D1 binding yalnız sorğu kontekstində əlçatandır.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "knowledge.hub" });

  return buildManagedMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/bilik-merkezi",
    locale: resolved as Locale,
  });
}

export default async function KnowledgeHubPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const [t, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "knowledge" }),
    getTranslations({ locale, namespace: "navigation" }),
  ]);

  const search = one(query, "axtaris");
  const audience = one(query, "kim");
  const categorySlug = one(query, "kateqoriya");
  const tag = one(query, "teq");
  const rawPage = one(query, "sehife");
  const page = rawPage && /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  if (page < 1) notFound();

  const [result, categories, tagCounts, terms, faqEntries] = await Promise.all([
    getCachedKnowledgeArticles({ search, audience, categorySlug, tag, page }),
    getCachedKnowledgeCategories(),
    getCachedKnowledgeTagCounts(),
    search ? getCachedKnowledgeTerms({ search }) : Promise.resolve([]),
    search ? getCachedFaqEntries() : Promise.resolve([]),
  ]);
  if (page > result.totalPages) notFound();

  const activeCategory = categories.find((category) => category.slug === categorySlug);
  const activeTag = tag ? tagCounts.find((item) => item.slug === knowledgeTagSlug(tag)) : undefined;
  const matchedTerms = terms.slice(0, 8);
  // Platforma sualları `/suallar`-dadır; burada yalnız əmlak üzrə FAQ göstərilir.
  const matchedFaqs = searchFaqEntries(
    faqEntries.filter((entry) => entry.category !== FAQ_CATEGORIES.PLATFORM),
    search,
  );
  const filtered = Boolean(search || audience || categorySlug || tag);

  /** Cari filtrləri saxlayıb yalnız verilən açarları dəyişən keçid. */
  function hubHref(changes: Record<string, string | undefined>) {
    const current: Record<string, string | undefined> = {
      axtaris: search,
      kateqoriya: categorySlug,
      teq: tag,
      kim: audience,
    };
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...current, ...changes })) {
      if (value) sp.set(key, value);
    }
    const qs = sp.toString();
    return `/bilik-merkezi${qs ? `?${qs}` : ""}`;
  }

  const buildHref = (next: number) => hubHref({ sehife: next > 1 ? String(next) : undefined });
  const audienceHref = (value?: string) => hubHref({ kim: value });

  return (
    <>
      <script
        {...jsonLd(
          breadcrumbSchema(
            [
              { name: navigation("home"), path: "/" },
              { name: t("hub.eyebrow"), path: "/bilik-merkezi" },
            ],
            locale as Locale,
          ),
        )}
      />
      {result.items.length > 0 && (
        <script
          {...jsonLd(
            itemListSchema(
              result.items.map((item) => ({
                name: item.title,
                path: `/bilik-merkezi/${item.slug}`,
              })),
              locale as Locale,
            ),
          )}
        />
      )}

      <PageHeader
        eyebrow={t("hub.eyebrow")}
        title={t("hub.title")}
        description={t("hub.description")}
        breadcrumbs={[
          { label: navigation("home"), href: "/" },
          { label: t("hub.eyebrow") },
        ]}
      />

      {/* Axtarış və auditoriya filtri — GET forma, JavaScript tələb etmir. */}
      <div className="border-b border-line bg-paper">
        <Container>
          <form
            method="GET"
            action=""
            role="search"
            className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center"
          >
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-sm border border-line-strong bg-paper px-4 focus-within:border-gold">
              <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="sr-only">{t("hub.searchLabel")}</span>
              <input
                type="search"
                name="axtaris"
                defaultValue={search ?? ""}
                placeholder={t("hub.searchPlaceholder")}
                className="min-h-12 w-full bg-transparent text-base text-ink placeholder:text-ink-muted focus:outline-none sm:text-sm"
              />
            </label>
            <Combobox
              name="kateqoriya"
              label={t("hub.categoryFilterLabel")}
              hideLabel
              placeholder={t("hub.allCategories")}
              defaultValue={categorySlug ?? ""}
              options={categories.map((category) => ({ value: category.slug, label: category.name }))}
              className="min-w-0 sm:w-72"
            />
            {audience ? <input type="hidden" name="kim" value={audience} /> : null}
            {tag ? <input type="hidden" name="teq" value={tag} /> : null}
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-xs border border-charcoal bg-charcoal px-8 text-sm font-medium text-ink-invert transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              {t("hub.searchAction")}
            </button>
          </form>

          <div className="flex flex-col gap-3 py-5 lg:flex-row lg:items-center lg:gap-5">
            <span className="text-sm font-medium text-ink-muted lg:shrink-0">{t("article.audienceLabel")}</span>
            <FilterChipRow label={t("article.audienceLabel")}>
              <FilterChip href={audienceHref()} active={!audience}>
                {t("audience.all")}
              </FilterChip>
              {Object.values(KNOWLEDGE_AUDIENCES).map((value) => (
                <FilterChip key={value} href={audienceHref(value)} active={audience === value}>
                  {t(`audience.${value}`)}
                </FilterChip>
              ))}
            </FilterChipRow>
          </div>

          {(activeCategory || tag) && (
            <ul className="flex flex-wrap gap-2 pb-5" aria-label={t("hub.activeFilters")}>
              {activeCategory ? (
                <li>
                  <Link
                    href={hubHref({ kateqoriya: undefined })}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold-line bg-ivory px-4 text-sm text-ink"
                    aria-label={t("hub.removeFilter", { name: activeCategory.name })}
                  >
                    {activeCategory.name}
                    <X className="size-3.5 text-ink-muted" aria-hidden="true" />
                  </Link>
                </li>
              ) : null}
              {tag ? (
                <li>
                  <Link
                    href={hubHref({ teq: undefined })}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold-line bg-ivory px-4 text-sm text-ink"
                    aria-label={t("hub.removeFilter", { name: activeTag?.label ?? tag })}
                  >
                    <Tag className="size-3.5 text-gold-deep" aria-hidden="true" />
                    {activeTag?.label ?? tag}
                    <X className="size-3.5 text-ink-muted" aria-hidden="true" />
                  </Link>
                </li>
              ) : null}
            </ul>
          )}
        </Container>
      </div>

      {/* AI məsləhətçi (#109) — yalnız dərc olunmuş məqalələrdən, mənbə ilə cavab verir */}
      {!filtered && (
        <Section tone="ivory" spacing="compact">
          <Container>
            <KnowledgeAdvisor examples={[t("advisor.example1"), t("advisor.example2"), t("advisor.example3")]} />
          </Container>
        </Section>
      )}

      {/* Mövzular — hər kateqoriyanın öz izahı ilə */}
      {categories.length > 0 && !filtered && (
        <Section tone="paper" spacing="cozy">
          <Container>
            <SectionHeading title={t("hub.categories")} description={t("hub.categoriesLead")} />
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <li key={category.id} className="min-w-0">
                  <Link
                    href={`/bilik-merkezi/kateqoriya/${category.slug}`}
                    className="card-surface group flex h-full min-w-0 flex-col gap-4 bg-ivory p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <span className="flex items-start justify-between gap-4">
                      <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-gold-line bg-paper text-gold-deep">
                        <Library className="size-5" aria-hidden="true" />
                      </span>
                      <ArrowUpRight
                        className="size-5 text-ink-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold-deep"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="font-sans text-lg font-semibold leading-snug text-ink">{category.name}</span>
                    {category.description ? (
                      <span className="line-clamp-3 text-[0.9375rem] leading-7 text-ink-soft [overflow-wrap:anywhere]">
                        {category.description}
                      </span>
                    ) : null}
                    <span className="mt-auto border-t border-line pt-4 text-sm text-ink-muted">
                      {t("hub.categoryCount", { count: category._count.articles })}
                      {category._count.terms > 0
                        ? ` · ${t("hub.termCount", { count: category._count.terms })}`
                        : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {!filtered && tagCounts.length > 0 && (
        <Section tone="ivory" spacing="compact">
          <Container>
            <SectionHeading title={t("hub.popularTags")} className="mb-6 sm:mb-6" />
            <ul className="flex flex-wrap gap-2.5">
              {tagCounts.slice(0, 24).map((item) => (
                <li key={item.slug}>
                  <Link
                    href={hubHref({ teq: item.slug })}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-paper px-4 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <Tag className="size-3.5 text-gold" aria-hidden="true" />
                    {item.label}
                    <span className="text-xs tabular-nums text-ink-muted">{item.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {(matchedTerms.length > 0 || matchedFaqs.length > 0) && (
        <Section tone="paper" spacing="compact" className="border-b border-line">
          <Container>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              {matchedTerms.length > 0 && (
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2.5 font-sans text-lg font-semibold text-ink">
                    <BookOpen className="size-5 text-gold" aria-hidden="true" />
                    {t("hub.termResults", { count: matchedTerms.length })}
                  </h2>
                  <ul className="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-ivory">
                    {matchedTerms.map((term) => (
                      <li key={term.id}>
                        <Link
                          href={`/lugat/${term.slug}`}
                          className="block px-5 py-4 transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
                        >
                          <span className="block font-semibold text-ink">{term.term}</span>
                          <span className="mt-1 line-clamp-2 block text-sm leading-6 text-ink-soft">{term.shortDefinition}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {matchedFaqs.length > 0 && (
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2.5 font-sans text-lg font-semibold text-ink">
                    <HelpCircle className="size-5 text-gold" aria-hidden="true" />
                    {t("hub.faqResults", { count: matchedFaqs.length })}
                  </h2>
                  <ul className="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-ivory">
                    {matchedFaqs.map((entry) => (
                      <li key={entry.id}>
                        <Link
                          href="/bilik-merkezi/suallar"
                          className="block px-5 py-4 font-medium leading-6 text-ink transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
                        >
                          {entry.question}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Container>
        </Section>
      )}

      <Section tone="ivory" spacing="cozy">
        <Container>
          <SectionHeading
            title={filtered ? t("hub.resultCount", { count: result.total }) : t("hub.allGuides")}
            description={filtered ? undefined : t("hub.categoryCount", { count: result.total })}
            action={
              filtered ? (
                <Link
                  href="/bilik-merkezi"
                  className="relative inline-flex min-h-11 items-center rounded-xs font-medium text-gold-deep underline underline-offset-4 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {t("hub.resetSearch")}
                </Link>
              ) : undefined
            }
          />

          {result.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 xl:grid-cols-3">
                {result.items.map((article, index) => (
                  <Reveal key={article.id} delay={index * 50}>
                    <KnowledgeCard article={article} priority={index === 0} />
                  </Reveal>
                ))}
              </div>
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                buildHref={buildHref}
                className="mt-14"
              />
            </>
          ) : (
            <EmptyState
              title={filtered ? t("hub.noResults") : t("hub.empty")}
              description={
                filtered ? t("hub.noResultsDescription") : t("hub.emptyDescription")
              }
              action={
                filtered
                  ? { label: t("hub.resetSearch"), href: "/bilik-merkezi" }
                  : { label: t("article.ctaAction"), href: "/elaqe" }
              }
            />
          )}
        </Container>
      </Section>

      {/* Lüğət və hesablayıcı keçidləri */}
      <Section tone="paper" spacing="compact" className="border-t border-line">
        <Container>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Link
              href="/lugat"
              className="card-surface group flex min-w-0 items-start gap-5 bg-ivory p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:p-7"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-gold-line bg-paper text-gold-deep">
                <BookOpen className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-sans text-lg font-semibold text-ink">{t("glossary.title")}</span>
                <span className="mt-1.5 block text-[0.9375rem] leading-7 text-ink-soft">{t("glossary.description")}</span>
              </span>
            </Link>
            <Link
              href="/kalkulyator"
              className="card-surface group flex min-w-0 items-start gap-5 bg-ivory p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:p-7"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-gold-line bg-paper text-gold-deep">
                <Calculator className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-sans text-lg font-semibold text-ink">{t("calculator.title")}</span>
                <span className="mt-1.5 block text-[0.9375rem] leading-7 text-ink-soft">{t("calculator.description")}</span>
              </span>
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
