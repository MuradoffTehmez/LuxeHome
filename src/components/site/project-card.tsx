import Image from "next/image";
import Link from "next/link";
import { Building2, CalendarDays, MapPin } from "lucide-react";
import { cn, isUnoptimizedImage } from "@/lib/utils";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  type ProjectStatus,
  type ProjectType,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import type { ProjectCardData } from "@/lib/queries";

const STATUS_TONE: Record<ProjectStatus, "gold" | "success" | "neutral"> = {
  PLANNED: "neutral",
  ONGOING: "gold",
  COMPLETED: "success",
};

export function ProjectCard({
  project,
  priority = false,
  className,
}: {
  project: ProjectCardData;
  priority?: boolean;
  className?: string;
}) {
  const status = project.status as ProjectStatus;
  const type = project.projectType as ProjectType;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col",
        className,
      )}
    >
      <div className="relative aspect-16/11 overflow-hidden rounded-sm bg-beige">
        {project.coverUrl ? (
          <Image
            src={project.coverUrl}
            alt={`${project.name} layihəsi`}
            fill
            unoptimized={isUnoptimizedImage(project.coverUrl)}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1279px) calc(50vw - 2.25rem), 448px"
            className="image-lift object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-muted">
            <Building2 className="size-10" aria-hidden="true" />
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent"
        />

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge tone={STATUS_TONE[status]}>{PROJECT_STATUS_LABELS[status]}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 pt-5">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium tracking-wide text-gold-deep uppercase">
            {PROJECT_TYPE_LABELS[type]}
          </p>

          <h3 className="font-display text-xl leading-snug text-ink">
            <Link
              href={`/layiheler/${project.slug}`}
              className="after:absolute after:inset-0 after:content-[''] inline-flex min-h-11 items-center hover:text-gold-deep"
            >
              {project.name}
            </Link>
          </h3>
        </div>

        {project.summary && (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">
            {project.summary}
          </p>
        )}

        <dl className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-sm text-ink-muted">
          {project.city?.name && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <dt className="sr-only">Yerləşmə</dt>
              <dd>{project.city.name}</dd>
            </div>
          )}
          {project.year && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
              <dt className="sr-only">İl</dt>
              <dd className="tabular">{project.year}</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}
