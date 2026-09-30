import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { BookOpen, Calculator, ChevronDown, HelpCircle, Library, Search, Tag, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { Pagination } from "@/components/ui/pagination";
import { KnowledgeCard } from "@/components/site/knowledge-card";
import { KnowledgeAdvisor } from "@/components/site/knowledge-advisor";
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
import { cn } from "@/lib/utils";

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
            className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center"
          >
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-line-strong bg-paper px-3 focus-within:border-gold">
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
            <label className="relative flex min-w-0 sm:w-64">
              <span className="sr-only">{t("hub.categoryFilterLabel")}</span>
              <select
                name="kateqoriya"
                defaultValue={categorySlug ?? ""}
                className="min-h-12 w-full cursor-pointer appearance-none rounded-sm border border-line-strong bg-paper px-4 pr-10 text-base text-ink focus:border-gold sm:text-sm"
              >
                <option value="">{t("hub.allCategories")}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            </label>
            {audience ? <input type="hidden" name="kim" value={audience} /> : null}
            {tag ? <input type="hidden" name="teq" value={tag} /> : null}
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-xs border border-charcoal bg-charcoal px-6 text-sm font-medium text-ink-invert transition-colors hover:bg-ink"
            >
              {t("hub.searchAction")}
            </button>
          </form>

          <nav
            aria-label={t("article.audienceLabel")}
            className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
            <Link
              href={audienceHref()}
              className={cn(
                "inline-flex min-h-11 shrink-0 snap-start items-center rounded-xs border px-4 text-sm font-medium transition-colors",
                !audience
                  ? "border-charcoal bg-charcoal text-ink-invert"
                  : "border-line-strong text-ink-soft hover:border-gold hover:text-gold-deep",
              )}
            >
              {t("audience.all")}
            </Link>
            {Object.values(KNOWLEDGE_AUDIENCES).map((value) => (
              <Link
                key={value}
                href={audienceHref(value)}
                className={cn(
                  "inline-flex min-h-11 shrink-0 snap-start items-center rounded-xs border px-4 text-sm font-medium transition-colors",
                  audience === value
                    ? "border-charcoal bg-charcoal text-ink-invert"
                    : "border-line-strong text-ink-soft hover:border-gold hover:text-gold-deep",
                )}
              >
                {t(`audience.${value}`)}
              </Link>
            ))}
          </nav>

          {(activeCategory || tag) && (
            <ul className="flex flex-wrap gap-2 pb-4" aria-label={t("hub.activeFilters")}>
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
        <Section tone="paper" spacing="compact">
          <Container>
            <h2 className="font-display text-2xl text-ink sm:text-3xl">{t("hub.categories")}</h2>
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <li key={category.id} className="min-w-0">
                  <Link
                    href={`/bilik-merkezi/kateqoriya/${category.slug}`}
                    className="group flex h-full min-w-0 flex-col gap-2 rounded-xl border border-line bg-ivory p-5 transition-colors hover:border-gold-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold shadow-xs"
                  >
                    <span className="flex items-center gap-2 font-display text-lg text-ink">
                      <Library className="size-4 shrink-0 text-gold" aria-hidden="true" />
                      {category.name}
                    </span>
                    {category.description ? (
                      <span className="line-clamp-4 text-sm text-ink-soft [overflow-wrap:anywhere]">
                        {category.description}
                      </span>
                    ) : null}
                    <span className="mt-auto pt-2 text-xs text-ink-muted">
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
            <h2 className="font-sans text-lg font-semibold text-ink">{t("hub.popularTags")}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {tagCounts.slice(0, 24).map((item) => (
                <li key={item.slug}>
                  <Link
                    href={hubHref({ teq: item.slug })}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong bg-paper px-4 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep"
                  >
                    <Tag className="size-3.5 text-gold" aria-hidden="true" />
                    {item.label}
                    <span className="text-xs text-ink-muted">{item.count}</span>
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
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {matchedTerms.length > 0 && (
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-ink">
                    <BookOpen className="size-5 text-gold" aria-hidden="true" />
                    {t("hub.termResults", { count: matchedTerms.length })}
                  </h2>
                  <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-ivory">
                    {matchedTerms.map((term) => (
                      <li key={term.id}>
                        <Link
                          href={`/lugat/${term.slug}`}
                          className="block px-4 py-3 transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                        >
                          <span className="block font-medium text-ink">{term.term}</span>
                          <span className="mt-0.5 line-clamp-2 block text-sm text-ink-soft">{term.shortDefinition}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {matchedFaqs.length > 0 && (
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-ink">
                    <HelpCircle className="size-5 text-gold" aria-hidden="true" />
                    {t("hub.faqResults", { count: matchedFaqs.length })}
                  </h2>
                  <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-ivory">
                    {matchedFaqs.map((entry) => (
                      <li key={entry.id}>
                        <Link
                          href="/bilik-merkezi/suallar"
                          className="block px-4 py-3 font-medium text-ink transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
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
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl text-ink sm:text-3xl">
              {filtered ? t("hub.resultCount", { count: result.total }) : t("hub.allGuides")}
            </h2>
            {filtered ? (
              <Link
                href="/bilik-merkezi"
                className="rounded-xs text-sm font-medium text-gold-deep underline underline-offset-4 hover:text-ink"
              >
                {t("hub.resetSearch")}
              </Link>
            ) : null}
          </div>

          {result.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
                className="mt-12"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/lugat"
              className="group flex min-w-0 items-start gap-4 rounded-xl border border-line bg-ivory p-6 transition-colors hover:border-gold-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold shadow-xs"
            >
              <BookOpen className="size-6 shrink-0 text-gold" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-display text-lg text-ink">{t("glossary.title")}</span>
                <span className="mt-1 block text-sm text-ink-soft">{t("glossary.description")}</span>
              </span>
            </Link>
            <Link
              href="/kalkulyator"
              className="group flex min-w-0 items-start gap-4 rounded-xl border border-line bg-ivory p-6 transition-colors hover:border-gold-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold shadow-xs"
            >
              <Calculator className="size-6 shrink-0 text-gold" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-display text-lg text-ink">{t("calculator.title")}</span>
                <span className="mt-1 block text-sm text-ink-soft">{t("calculator.description")}</span>
              </span>
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
