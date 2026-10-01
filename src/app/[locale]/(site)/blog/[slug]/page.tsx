import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { ShareButtons } from "@/components/site/share-buttons";
import { PostCard } from "@/components/site/post-card";
import { ArticleTrustMeta } from "@/components/site/article-trust-meta";
import { articleSchema, buildManagedMetadata, jsonLd, breadcrumbSchema } from "@/lib/seo";
import { getRelatedPosts } from "@/lib/queries";
import { getCachedPostBySlug } from "@/lib/public-cache";
import { recordView } from "@/lib/view-counter";
import { isUnoptimizedImage } from "@/lib/utils";
import { resolveBlogCover } from "@/lib/blog-covers";
import { TRANSLATION_ENTITY_TYPES, type Locale } from "@/lib/constants";
import { applyContentTranslation, getPublishedContentTranslation } from "@/lib/content-translation";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const sourcePost = await getCachedPostBySlug(slug);

  if (!sourcePost) notFound();
  const post = applyContentTranslation(
    TRANSLATION_ENTITY_TYPES.BLOG_POST,
    sourcePost,
    await getPublishedContentTranslation(TRANSLATION_ENTITY_TYPES.BLOG_POST, sourcePost.id, locale as Locale),
  );
  const cover = resolveBlogCover(post);

  return buildManagedMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    image: cover.url,
    type: "article",
    noIndex: post.noIndex,
    canonicalPath: post.canonicalUrl || undefined,
    ogTitle: post.ogTitle,
    ogDescription: post.ogDescription,
    ogImage: post.ogImage,
    locale: locale as Locale,
    managedEntity: { type: TRANSLATION_ENTITY_TYPES.BLOG_POST, id: sourcePost.id },
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const [content, listings, navigation, knowledge] = await Promise.all([
    getTranslations({ locale, namespace: "content" }),
    getTranslations({ locale, namespace: "listings" }),
    getTranslations({ locale, namespace: "navigation" }),
    getTranslations({ locale, namespace: "knowledge" }),
  ]);
  const sourcePost = await getCachedPostBySlug(slug);

  if (!sourcePost) notFound();
  const post = applyContentTranslation(
    TRANSLATION_ENTITY_TYPES.BLOG_POST,
    sourcePost,
    await getPublishedContentTranslation(TRANSLATION_ENTITY_TYPES.BLOG_POST, sourcePost.id, locale as Locale),
  );

  // Sayğac cavabı gözlətmir — `waitUntil` ilə render bitdikdən sonra yazılır
  recordView("post", post.id, (await headers()).get("user-agent"));

  const relatedPosts = await getRelatedPosts(post.id, post.categoryId, 3);
  const publishedAt = new Date(post.publishedAt || post.createdAt);
  const updatedAt = new Date(post.updatedAt);
  const cover = resolveBlogCover(post);

  return (
    <>
      <script
        {...jsonLd(
          articleSchema({
            title: post.title,
            description: post.excerpt,
            slug: post.slug,
            image: cover.url,
            publishedAt: post.publishedAt || post.createdAt,
            updatedAt: post.updatedAt,
            authorName: post.author?.name,
          }, locale as Locale),
        )}
      />
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: navigation("home"), path: "/" },
            { name: navigation("blog"), path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ], locale as Locale),
        )}
      />

      <PageHeader
        compact
        eyebrow={post.category?.name || listings("blogPage.journal")}
        title={post.title}
        description={post.excerpt}
        breadcrumbs={[
          { label: navigation("home"), href: "/" },
          { label: navigation("blog"), href: "/blog" },
          { label: post.title },
        ]}
        footer={
          <ArticleTrustMeta
            authorName={post.author?.name}
            publishedAt={publishedAt}
            updatedAt={updatedAt}
            readMinutes={post.readMinutes}
            viewCount={post.viewCount}
          />
        }
      />

      <Section tone="ivory" spacing="compact">
        {/* Qapaq mətn sütunundan genişdir — dar sütunda 16:9 şəkil 1440px ekranda
            kiçik «marka» kimi görünürdü. Üz qabığı yüklənməyibsə mövzuya uyğun brend fotosu çıxır. */}
        <Container className="mb-12 sm:mb-16">
          <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl bg-beige shadow-md lg:aspect-[21/9]">
            <Image
              src={cover.url}
              alt={cover.alt}
              fill
              unoptimized={isUnoptimizedImage(cover.url)}
              priority
              className="object-cover"
              sizes="(max-width: 1279px) calc(100vw - 2.5rem), 1200px"
            />
          </div>
        </Container>

        <Container size="narrow">
          <div className="min-w-0">
            {/* Content */}
            <article className="prose-luxe min-w-0 max-w-[68ch] text-base [overflow-wrap:anywhere] sm:text-lg">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>

            {/* Share */}
            <div className="mt-14 flex flex-col gap-4 rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-6">
              <h2 className="font-sans text-base font-semibold text-ink">{content("articleShare")}</h2>
              <ShareButtons title={post.title} path={`/blog/${post.slug}`} showLabel={false} />
            </div>

            <div className="mt-8 flex flex-col gap-5 rounded-xl border border-gold-line bg-beige p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="min-w-0">
                <h2 className="font-sans text-lg font-semibold text-ink">{knowledge("article.ctaTitle")}</h2>
                <p className="mt-1.5 text-sm leading-6 text-ink-soft">{knowledge("article.ctaDescription")}</p>
              </div>
              <Link
                href="/elaqe"
                className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-sm border border-charcoal bg-charcoal px-6 text-sm font-medium text-ink-invert transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                {knowledge("article.ctaAction")}
              </Link>
            </div>

            <Link
              href="/blog"
              className="group relative mt-10 inline-flex min-h-11 items-center gap-2 rounded-xs text-sm font-medium text-gold-deep transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              {listings("blogPage.viewAll")}
            </Link>
          </div>
        </Container>
      </Section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <Section tone="paper" spacing="cozy" className="border-t border-line">
          <Container>
            <div className="mb-10 flex flex-col gap-3">
              <p className="editorial-kicker flex items-center gap-3 text-gold-deep">
                <span aria-hidden="true" className="h-px w-8 bg-gold/60" />
                {listings("blogPage.eyebrow")}
              </p>
              <h2 className="font-display text-2xl text-ink sm:text-3xl">{content("similarArticles")}</h2>
              <p className="max-w-[60ch] text-base leading-7 text-ink-soft">{content("relatedArticlesDescription")}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3">
              {relatedPosts.map((relatedPost, index) => (
                <Reveal key={relatedPost.id} delay={index * 50}>
                  <PostCard post={relatedPost} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
