import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Clock } from "lucide-react";
import { cn, isUnoptimizedImage } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatLocalizedDate } from "@/i18n/date";
import { resolveBlogCover } from "@/lib/blog-covers";
import type { Locale } from "@/lib/constants";
import type { PostCardData } from "@/lib/queries";

/**
 * Bloq kartı.
 *
 * Şəkil, kateqoriya çipi, tarix, başlıq, xülasə və «Oxu» sətri aydın ayrılmış ardıcıllıqla
 * düzülür; bütün kart başlıq linkinin `after` qatı ilə kliklənəndir. Üz qabığı yüklənməyibsə
 * `resolveBlogCover` mövzuya uyğun brend fotosu verir.
 *
 * Variantlar: `standard` — şəbəkə kartı; `featured` — şəkil yuxarıda, iri başlıqlı şaquli kart
 * (ana səhifədə dar sütun); `wide` — tam enli üfüqi kart (bloq siyahısının «seçilmiş» yazısı).
 */
export async function PostCard({
  post,
  priority = false,
  className,
  variant = "standard",
}: {
  post: PostCardData;
  priority?: boolean;
  className?: string;
  variant?: "standard" | "featured" | "wide";
}) {
  const [t, blog, locale] = await Promise.all([
    getTranslations("property"),
    getTranslations("listings.blogPage"),
    getLocale(),
  ]);
  const wide = variant === "wide";
  const featured = variant !== "standard";
  const cover = resolveBlogCover(post);
  const published = post.publishedAt ? new Date(post.publishedAt) : null;
  const dateLabel = published ? formatLocalizedDate(published, locale as Locale) : null;

  return (
    <article
      className={cn(
        "card-surface group relative flex h-full flex-col overflow-hidden",
        wide && "lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-beige",
          wide
            ? "aspect-16/10 lg:aspect-auto lg:min-h-[26rem]"
            : featured
              ? "aspect-16/10 lg:aspect-auto lg:min-h-[22rem] lg:flex-1"
              : "aspect-16/10",
        )}
      >
        <Image
          src={cover.url}
          alt={cover.alt}
          fill
          unoptimized={isUnoptimizedImage(cover.url)}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes={
            wide
              ? "(max-width: 1023px) 100vw, 760px"
              : featured
                ? "(max-width: 1023px) 100vw, 58vw"
              : "(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1279px) calc(50vw - 2.25rem), 448px"
          }
          className="image-lift object-cover"
        />

        {post.category && (
          <div className="absolute top-4 left-4">
            <Badge tone="overlay" className="px-3 py-1">
              {post.category.name}
            </Badge>
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex flex-col gap-4 p-6",
          // Standart kartda mətn bloku boşluğu doldurur (altdakı sətir hizalı qalır); «featured»-də
          // artıq hündürlüyü şəkil götürür.
          !featured && "flex-1",
          featured && "sm:p-8",
          wide && "lg:justify-center lg:p-10",
        )}
      >
        {published && dateLabel && (
          <time dateTime={published.toISOString()} className="text-[0.8125rem] font-medium text-ink-muted">
            {dateLabel}
          </time>
        )}

        <h3
          className={cn(
            "leading-snug tracking-tight text-ink",
            featured ? "font-display text-2xl font-medium sm:text-3xl" : "text-xl font-semibold",
          )}
        >
          <Link
            href={`/blog/${post.slug}`}
            className="line-clamp-3 min-h-11 rounded-xs transition-colors duration-300 after:absolute after:inset-0 after:rounded-lg after:content-[''] hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {post.title}
          </Link>
        </h3>

        <p
          className={cn(
            "text-[0.9375rem] leading-7 text-ink-soft",
            featured ? "line-clamp-4 sm:text-base" : "line-clamp-3",
          )}
        >
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-4 text-sm">
          <span className="inline-flex items-center gap-1.5 text-ink-muted">
            <Clock className="size-4" aria-hidden="true" />
            {t("readMinutes", { count: post.readMinutes })}
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-gold-deep">
            {blog("readMore")}
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </article>
  );
}
