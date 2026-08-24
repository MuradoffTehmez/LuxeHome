import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Clock, Eye, Calendar } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ShareButtons } from "@/components/site/share-buttons";
import { PostCard } from "@/components/site/post-card";
import { articleSchema, buildMetadata, jsonLd, breadcrumbSchema } from "@/lib/seo";
import { getPostBySlug, getRelatedPosts } from "@/lib/queries";
import { isUnoptimizedImage } from "@/lib/utils";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return { title: "Məqalə tapılmadı" };

  return buildMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.coverUrl || undefined,
    type: "article",
    noIndex: post.noIndex,
    canonicalPath: post.canonicalUrl,
    ogTitle: post.ogTitle,
    ogDescription: post.ogDescription,
    ogImage: post.ogImage,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(post.id, post.categoryId, 3);

  return (
    <>
      <script
        {...jsonLd(
          articleSchema({
            title: post.title,
            description: post.excerpt,
            slug: post.slug,
            image: post.coverUrl,
            publishedAt: post.publishedAt || post.createdAt,
            updatedAt: post.updatedAt,
            authorName: post.author?.name,
          }),
        )}
      />
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: "Ana səhifə", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        )}
      />

      <PageHeader
        compact
        eyebrow={post.category?.name || "Luxe jurnal"}
        title={post.title}
        description={post.excerpt}
        breadcrumbs={[
          { label: "Ana səhifə", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title },
        ]}
        actions={
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4" aria-hidden="true" />
                  {new Intl.DateTimeFormat("az-AZ", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(post.publishedAt || post.createdAt))}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden="true" />
                  {post.readMinutes} dəq oxuma
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="size-4" aria-hidden="true" />
                  {post.viewCount} baxış
                </span>
              </div>
        }
      />

      <Section tone="ivory" spacing="compact">
        <Container size="narrow">
          <div className="min-w-0">
            {/* Cover */}
            {post.coverUrl && (
              <div className="relative mb-10 aspect-16/9 w-full overflow-hidden rounded-md bg-beige shadow-sm">
                <Image
                  src={post.coverUrl}
                  alt={post.coverAlt || post.title}
                  fill
                  unoptimized={isUnoptimizedImage(post.coverUrl)}
                  priority
                  className="object-cover"
                  sizes="(max-width: 767px) calc(100vw - 2.5rem), 720px"
                />
              </div>
            )}

            {/* Content */}
            <article className="prose-luxe min-w-0 max-w-[68ch] text-base [overflow-wrap:anywhere] sm:text-lg">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>

            {/* Share */}
            <div className="mt-12 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-display text-lg text-ink">Məqaləni paylaş</span>
              <ShareButtons title={post.title} path={`/blog/${post.slug}`} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <Section tone="paper" spacing="cozy" className="border-t border-line">
          <Container>
            <div className="mb-8 flex flex-col gap-2">
              <h2 className="font-display text-2xl text-ink sm:text-3xl">Oxşar məqalələr</h2>
              <p className="text-sm text-ink-soft">Bu mövzu ilə maraqlananlar üçün digər yazılarımız.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <PostCard key={relatedPost.id} post={relatedPost as any} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
