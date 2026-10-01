import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { Pagination } from "@/components/ui/pagination";
import { SectionHeading } from "@/components/site/section-heading";
import { KnowledgeCard } from "@/components/site/knowledge-card";
import { breadcrumbSchema, buildManagedMetadata, itemListSchema, jsonLd } from "@/lib/seo";
import { getCachedKnowledgeArticles } from "@/lib/public-cache";
import { getKnowledgeCategoryBySlug, getKnowledgeTerms } from "@/lib/knowledge";
import type { Locale } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getKnowledgeCategoryBySlug(slug);
  if (!category) notFound();

  return buildManagedMetadata({
    title: category.name,
    description: category.description ?? category.name,
    path: `/bilik-merkezi/kateqoriya/${category.slug}`,
    locale: locale as Locale,
  });
}

export default async function KnowledgeCategoryPage({ params, searchParams }: Props) {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams]);
  const [t, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "knowledge" }),
    getTranslations({ locale, namespace: "navigation" }),
  ]);

  const category = await getKnowledgeCategoryBySlug(slug);
  if (!category) notFound();

  const search = typeof query.axtaris === "string" && query.axtaris.trim() ? query.axtaris.trim() : undefined;
  const rawPage = typeof query.sehife === "string" ? query.sehife : "1";
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  if (page < 1) notFound();

  const [result, terms] = await Promise.all([
    getCachedKnowledgeArticles({ categorySlug: slug, search, page }),
    getKnowledgeTerms(),
  ]);
  if (page > result.totalPages) notFound();

  const categoryTerms = terms.filter((term) => term.category?.slug === slug).slice(0, 12);

  return (
    <>
      <script
        {...jsonLd(
          breadcrumbSchema(
            [
              { name: navigation("home"), path: "/" },
              { name: t("hub.eyebrow"), path: "/bilik-merkezi" },
              { name: category.name, path: `/bilik-merkezi/kateqoriya/${category.slug}` },
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
        title={category.name}
        description={category.description ?? undefined}
        breadcrumbs={[
          { label: navigation("home"), href: "/" },
          { label: t("hub.eyebrow"), href: "/bilik-merkezi" },
          { label: category.name },
        ]}
      />

      <div className="border-b border-line bg-paper">
        <Container>
          <form method="GET" action="" role="search" className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-sm border border-line-strong bg-paper px-4 focus-within:border-gold">
              <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="sr-only">{t("hub.categorySearchLabel", { name: category.name })}</span>
              <input
                type="search"
                name="axtaris"
                defaultValue={search ?? ""}
                placeholder={t("hub.categorySearchPlaceholder", { name: category.name })}
                className="min-h-12 w-full bg-transparent text-base text-ink placeholder:text-ink-muted focus:outline-none sm:text-sm"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-xs border border-charcoal bg-charcoal px-8 text-sm font-medium text-ink-invert transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              {t("hub.searchAction")}
            </button>
          </form>
        </Container>
      </div>

      <Section tone="ivory" spacing="cozy">
        <Container>
          {result.items.length > 0 ? (
            <>
              <p className="mb-8 text-sm font-medium text-ink-muted">
                {t("hub.categoryCount", { count: result.total })}
              </p>
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
                buildHref={(next) => {
                  const sp = new URLSearchParams();
                  if (search) sp.set("axtaris", search);
                  if (next > 1) sp.set("sehife", String(next));
                  const qs = sp.toString();
                  return `/bilik-merkezi/kateqoriya/${category.slug}${qs ? `?${qs}` : ""}`;
                }}
                className="mt-14"
              />
            </>
          ) : (
            <EmptyState
              title={search ? t("hub.noResults") : t("hub.empty")}
              description={search ? t("hub.noResultsDescription") : t("hub.emptyDescription")}
              action={
                search
                  ? { label: t("hub.resetSearch"), href: `/bilik-merkezi/kateqoriya/${category.slug}` }
                  : { label: t("hub.allGuides"), href: "/bilik-merkezi" }
              }
            />
          )}
        </Container>
      </Section>

      {categoryTerms.length > 0 && (
        <Section tone="paper" spacing="compact" className="border-t border-line">
          <Container>
            <SectionHeading title={t("glossary.title")} description={t("glossary.description")} />
            <ul className="flex flex-wrap gap-2.5">
              {categoryTerms.map((term) => (
                <li key={term.id}>
                  <Link
                    href={`/lugat/${term.slug}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-paper px-5 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    {term.term}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}
