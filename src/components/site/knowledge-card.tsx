import Image from "next/image";
import { useTranslations } from "next-intl";
import { BookOpen, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { isUnoptimizedImage } from "@/lib/utils";
import type { KnowledgeCardData } from "@/lib/knowledge";
import type { KnowledgeAudience, KnowledgeLevel } from "@/lib/constants";

/**
 * Bilik Mərkəzi bələdçisinin kartı.
 *
 * `PostCard`-dan ayrıdır: bloq kartı tarixi önə çəkir (xəbər axını), bələdçidə
 * isə oxucunun ilk soruşduğu «kimə uyğundur / nə qədər vaxt aparır» məlumatıdır.
 * Şəkil olmadıqda kart ikon ilə düzgün görünür — bələdçilərin çoxu foto tələb etmir.
 */
export function KnowledgeCard({
  article,
  priority = false,
}: {
  article: KnowledgeCardData;
  priority?: boolean;
}) {
  const t = useTranslations("knowledge");

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-line bg-paper transition-colors duration-200 hover:border-gold-line">
      <div className="relative aspect-16/9 w-full overflow-hidden bg-beige">
        {article.coverUrl ? (
          <Image
            src={article.coverUrl}
            alt={article.coverAlt || article.title}
            fill
            unoptimized={isUnoptimizedImage(article.coverUrl)}
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <BookOpen className="size-10 text-gold" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {article.category ? (
            <Badge tone="neutral">{article.category.name}</Badge>
          ) : null}
          <Badge tone="gold">{t(`audience.${article.audience as KnowledgeAudience}`)}</Badge>
        </div>

        <h3 className="font-display text-lg leading-snug text-ink">
          <Link
            href={`/bilik-merkezi/${article.slug}`}
            className="rounded-xs after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {article.title}
          </Link>
        </h3>

        <p className="line-clamp-3 min-w-0 text-sm text-ink-soft [overflow-wrap:anywhere]">
          {article.excerpt}
        </p>

        <p className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-ink-muted">
          <Clock className="size-3.5" aria-hidden="true" />
          {t("article.readMinutes", { count: article.readMinutes })}
          <span aria-hidden="true">·</span>
          {t(`level.${article.level as KnowledgeLevel}`)}
        </p>
      </div>
    </article>
  );
}
