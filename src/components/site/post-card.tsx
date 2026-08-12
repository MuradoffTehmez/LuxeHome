import Image from "next/image";
import Link from "next/link";
import { Clock, Newspaper } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Badge, DemoBadge } from "@/components/ui/badge";
import type { PostCardData } from "@/lib/queries";

export function PostCard({
  post,
  priority = false,
  className,
}: {
  post: PostCardData;
  priority?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-md border border-line bg-paper",
        "transition-shadow duration-300 hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-16/10 overflow-hidden bg-beige">
        {post.coverUrl ? (
          <Image
            src={post.coverUrl}
            alt={post.coverAlt || post.title}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-muted">
            <Newspaper className="size-9" aria-hidden="true" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {post.category && <Badge tone="dark">{post.category.name}</Badge>}
          {post.isDemo && <DemoBadge />}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-lg leading-snug text-ink">
          <Link
            href={`/blog/${post.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:text-gold-deep"
          >
            {post.title}
          </Link>
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">
          {post.excerpt}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-4 text-xs text-ink-muted">
          {post.publishedAt && (
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {formatDate(post.publishedAt)}
            </time>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {post.readMinutes} dəq oxunuş
          </span>
        </div>
      </div>
    </article>
  );
}
