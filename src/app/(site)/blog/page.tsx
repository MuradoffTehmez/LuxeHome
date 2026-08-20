import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { PostCard } from "@/components/site/post-card";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import { getPosts, getBlogCategories } from "@/lib/queries";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description:
    "Daşınmaz əmlak bazarı, interyer dizaynı, tikinti yenilikləri və investisiya haqqında faydalı məqalələr.",
  path: "/blog",
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams;

  const categorySlug =
    typeof params.kateqoriya === "string" ? params.kateqoriya : undefined;
  const page = params.sehife ? Number(params.sehife) : 1;

  const [postsResult, categories] = await Promise.all([
    getPosts({ categorySlug, page }),
    getBlogCategories(),
  ]);

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
      {/* Başlıq */}
      <Section tone="beige" spacing="compact">
        <Container>
          <SectionHeader
            as="h1"
            overline="Blog"
            title={activeCategory ? activeCategory.name : "Faydalı məqalələr"}
            description={`${postsResult.total} məqalə${categories.length > 0 ? ` · ${categories.length} kateqoriya` : ""}`}
          />

          {/* Kateqoriya tabları */}
          {categories.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              <Link
                href="/blog"
                className={cn(
                  "inline-flex min-h-10 items-center rounded-xs border px-4 text-sm font-medium transition-colors",
                  !categorySlug
                    ? "border-charcoal bg-charcoal text-ink-invert"
                    : "border-line-strong text-ink-soft hover:border-gold hover:text-gold-deep",
                )}
              >
                Hamısı
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blog?kateqoriya=${cat.slug}`}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-xs border px-4 text-sm font-medium transition-colors",
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
            </div>
          )}
        </Container>
      </Section>

      {/* Məqalələr */}
      <Section tone="ivory">
        <Container>
          {postsResult.items.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {postsResult.items.map((post, index) => (
                  <Reveal key={post.id} delay={index * 50}>
                    <PostCard post={post} />
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
              title="Hazırda məqalə əlavə edilməyib"
              description="Yeni məqalələr dərc edildikcə bu səhifədə göstəriləcək."
              action={
                categorySlug
                  ? { label: "Bütün məqalələr", href: "/blog" }
                  : undefined
              }
            />
          )}
        </Container>
      </Section>
    </>
  );
}
