import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { FilterChip, FilterChipRow } from "@/components/ui/filter-chip";
import { Reveal } from "@/components/ui/reveal";
import { PostCard } from "@/components/site/post-card";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { buildManagedMetadata } from "@/lib/seo";
import { classifyBlogSearchParams } from "@/lib/seo-indexing";
import { routing } from "@/i18n/routing";
import { getBlogCategories } from "@/lib/queries";
import { getCachedPosts } from "@/lib/public-cache";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";

/**
 * Səhifə ölçüsü 10-dur: ilk səhifədə 1 «seçilmiş» yazı + 3 sütunlu şəbəkədə 9 yazı (3×3) çıxır,
 * 9 olsaydı sonuncu sətir yarımçıq qalardı.
 */
const BLOG_PAGE_SIZE = 10;

/** Səhifədə «seçilmiş» yazı ayrılması üçün minimum yazı sayı — az olanda şəbəkə daha səliqəlidir. */
const FEATURED_MIN_ITEMS = 4;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const resolvedLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "listings.blogPage" });
  const decision = classifyBlogSearchParams(query);
  const pageSuffix = decision.page > 1 ? t("pageSuffix", { page: decision.page }) : "";

  return buildManagedMetadata({
    title: `${t("metaTitle")}${pageSuffix}`,
    description: t("metaDescription"),
    path: decision.canonicalPath ?? "/blog",
    canonicalPath: decision.canonicalPath,
    indexPolicy: decision.indexPolicy,
    locale: resolvedLocale,
  });
}

export default async function BlogPage({ params: routeParams, searchParams }: Props) {
  const [{ locale }, params] = await Promise.all([routeParams, searchParams]);
  const [t, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "listings" }),
    getTranslations({ locale, namespace: "navigation" }),
  ]);
  const indexDecision = classifyBlogSearchParams(params);
  if (!indexDecision.validPage) notFound();

  const categorySlug =
    typeof params.kateqoriya === "string" ? params.kateqoriya : undefined;
  const rawPage = typeof params.sehife === "string" ? Number(params.sehife) : 1;
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const [postsResult, categories] = await Promise.all([
    getCachedPosts({ categorySlug, page, pageSize: BLOG_PAGE_SIZE }),
    getBlogCategories(),
  ]);
  if (page > postsResult.totalPages) notFound();

  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;
  // Yazısı olmayan kateqoriya çipi boş səhifəyə aparır — yalnız aktiv olan qalır.
  const visibleCategories = categories.filter(
    (category) => category._count.posts > 0 || category.slug === categorySlug,
  );

  function buildHref(p: number) {
    const sp = new URLSearchParams();
    if (categorySlug) sp.set("kateqoriya", categorySlug);
    if (p > 1) sp.set("sehife", String(p));
    const qs = sp.toString();
    return `/blog${qs ? `?${qs}` : ""}`;
  }

  const showFeatured = page === 1 && !categorySlug && postsResult.items.length >= FEATURED_MIN_ITEMS;
  const featuredPost = showFeatured ? postsResult.items[0] : null;
  const gridPosts = showFeatured ? postsResult.items.slice(1) : postsResult.items;

  return (
    <>
      <PageHeader
        eyebrow={t("blogPage.eyebrow")}
        title={activeCategory ? activeCategory.name : t("blogPage.title")}
        description={t("blogPage.lead")}
        breadcrumbs={[
          { label: navigation("home"), href: "/" },
          activeCategory
            ? { label: t("blogPage.eyebrow"), href: "/blog" }
            : { label: t("blogPage.eyebrow") },
          ...(activeCategory ? [{ label: activeCategory.name }] : []),
        ]}
      />

      {visibleCategories.length > 0 && (
        <div className="border-b border-line bg-paper">
          <Container>
            <div className="flex flex-col gap-3 py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
              <FilterChipRow label={t("blogPage.categoriesAria")}>
                <FilterChip href="/blog" active={!categorySlug}>
                  {t("all")}
                </FilterChip>
                {visibleCategories.map((cat) => (
                  <FilterChip key={cat.id} href={`/blog?kateqoriya=${cat.slug}`} active={categorySlug === cat.slug}>
                    {cat.name}
                    {/* Şəffaflıq (opacity) kontrastı 3:1-ə salırdı — sayı tokenlə rənglənir:
                        aktiv çipdə ağ mətni irsən alır, qalanlarda ink-muted (AA, 5.1:1). */}
                    <span className={cn("text-xs tabular-nums", categorySlug !== cat.slug && "text-ink-muted")}>
                      {cat._count.posts}
                    </span>
                  </FilterChip>
                ))}
              </FilterChipRow>
              <p className="shrink-0 text-sm text-ink-muted">
                {t("blogPage.articleCount", { count: postsResult.total })}
              </p>
            </div>
          </Container>
        </div>
      )}

      {/* Məqalələr */}
      <Section tone="ivory" spacing="cozy">
        <Container>
          {postsResult.items.length > 0 ? (
            <>
              {featuredPost && (
                <Reveal>
                  <div className="mb-12 sm:mb-14">
                    <h2 className="editorial-kicker mb-5 flex items-center gap-3 font-sans text-gold-deep">
                      <span aria-hidden="true" className="h-px w-8 bg-gold/60" />
                      {t("blogPage.featured")}
                    </h2>
                    <PostCard post={featuredPost} variant="wide" priority />
                  </div>
                </Reveal>
              )}

              {/* Başlıq iyerarxiyası h1 → h2 → h3 qalsın: seçilmiş yazı yoxdursa başlıq yalnız ekran oxuyucusu üçündür. */}
              {gridPosts.length > 0 && (
                <h2
                  className={
                    featuredPost
                      ? "mb-6 font-sans text-xl font-semibold text-ink sm:mb-8 sm:text-2xl"
                      : "sr-only"
                  }
                >
                  {t("blogPage.latest")}
                </h2>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 xl:grid-cols-3">
                {gridPosts.map((post, index) => (
                  <Reveal key={post.id} delay={index * 50}>
                    <PostCard post={post} priority={!featuredPost && index === 0} />
                  </Reveal>
                ))}
              </div>

              <Pagination
                page={postsResult.page}
                totalPages={postsResult.totalPages}
                buildHref={buildHref}
                className="mt-14"
              />
            </>
          ) : (
            <EmptyState
              title={t("blogPage.emptyTitle")}
              description={t("blogPage.emptyDescription")}
              action={
                categorySlug
                  ? { label: t("blogPage.viewAll"), href: "/blog" }
                  : undefined
              }
            />
          )}
        </Container>
      </Section>

      {/* Bilik Mərkəzinə keçid — bloq sual qaldıranda dərin bələdçiyə yönləndirir */}
      <Section tone="paper" spacing="compact" className="border-t border-line">
        <Container>
          <div className="flex flex-col gap-6 rounded-2xl border border-gold-line bg-ivory p-6 shadow-xs sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:p-10">
            <div className="flex min-w-0 items-start gap-5">
              <span
                aria-hidden="true"
                className="grid size-12 shrink-0 place-items-center rounded-full border border-gold-line bg-paper text-gold-deep"
              >
                <BookOpen className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl text-ink sm:text-3xl">{t("blogPage.knowledgeCtaTitle")}</h2>
                <p className="mt-2 max-w-[60ch] text-base leading-7 text-ink-soft">
                  {t("blogPage.knowledgeCtaDescription")}
                </p>
              </div>
            </div>
            <Link
              href="/bilik-merkezi"
              className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-sm border border-charcoal bg-charcoal px-6 text-sm font-medium text-ink-invert transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              {t("blogPage.knowledgeCtaAction")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
