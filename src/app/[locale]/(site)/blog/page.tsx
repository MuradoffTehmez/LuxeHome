import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { PostCard } from "@/components/site/post-card";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import { classifyBlogSearchParams } from "@/lib/seo-indexing";
import { routing } from "@/i18n/routing";
import { getBlogCategories } from "@/lib/queries";
import { getCachedPosts } from "@/lib/public-cache";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


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

  return buildMetadata({
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
  const t = await getTranslations({ locale, namespace: "listings" });
  const indexDecision = classifyBlogSearchParams(params);
  if (!indexDecision.validPage) notFound();

  const categorySlug =
    typeof params.kateqoriya === "string" ? params.kateqoriya : undefined;
  const rawPage = typeof params.sehife === "string" ? Number(params.sehife) : 1;
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const [postsResult, categories] = await Promise.all([
    getCachedPosts({ categorySlug, page }),
    getBlogCategories(),
  ]);
  if (page > postsResult.totalPages) notFound();

  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;

  function buildHref(p: number) {
    const sp = new URLSearchParams();
    if (categorySlug) sp.set("kateqoriya", categorySlug);
    if (p > 1) sp.set("sehife", String(p));
    const qs = sp.toString();
    return `/blog${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      <PageHeader
        eyebrow={t("blogPage.eyebrow")}
        title={activeCategory ? activeCategory.name : t("blogPage.title")}
        description={`${t("blogPage.articleCount", { count: postsResult.total })}${categories.length > 0 ? ` · ${t("blogPage.categoryCount", { count: categories.length })}` : ""}`}
      />

      {categories.length > 0 && (
        <div className="border-b border-line bg-paper">
          <Container>
            <nav
              aria-label={t("blogPage.categoriesAria")}
              className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 py-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0 [&::-webkit-scrollbar]:hidden"
            >
              <Link
                href="/blog"
                className={cn(
                  "inline-flex min-h-11 shrink-0 snap-start items-center rounded-xs border px-4 text-sm font-medium transition-colors",
                  !categorySlug
                    ? "border-charcoal bg-charcoal text-ink-invert"
                    : "border-line-strong text-ink-soft hover:border-gold hover:text-gold-deep",
                )}
              >
                {t("all")}
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blog?kateqoriya=${cat.slug}`}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 snap-start items-center rounded-xs border px-4 text-sm font-medium transition-colors",
                    categorySlug === cat.slug
                      ? "border-charcoal bg-charcoal text-ink-invert"
                      : "border-line-strong text-ink-soft hover:border-gold hover:text-gold-deep",
                  )}
                >
                  {cat.name}
                  <span className="ml-1.5 text-xs opacity-60">
                    {cat._count.posts}
                  </span>
                </Link>
              ))}
            </nav>
          </Container>
        </div>
      )}

      {/* Məqalələr */}
      <Section tone="ivory">
        <Container>
          {postsResult.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {postsResult.items.map((post, index) => (
                  <Reveal key={post.id} delay={index * 50}>
                    <PostCard post={post} priority={index === 0} />
                  </Reveal>
                ))}
              </div>

              <Pagination
                page={postsResult.page}
                totalPages={postsResult.totalPages}
                buildHref={buildHref}
                className="mt-12"
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
    </>
  );
}
