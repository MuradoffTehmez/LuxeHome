"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Building2, MapPin, ShieldCheck, Star, Users, Zap } from "lucide-react";
import { cn, isUnoptimizedImage } from "@/lib/utils";

export type AgencyCardData = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  address: string | null;
  agentCount: number;
  /** Sahib + təsdiqlənmiş agentlərin ictimai təklifləri (`countAgencyOffers`). */
  offers: { total: number; sale: number; rent: number };
  /** Agentlərin + agentliyin təsdiqlənmiş rəyləri (#161). */
  rating?: { average: number; count: number } | null;
  /** «Tez cavab verir» nişanı (#161). */
  fastResponse?: boolean;
  /** Ərazi səhifəsində (#161, C6): həmin ərazidəki aktiv təklif sayı. */
  areaOffers?: number;
};

/**
 * Agentlik kataloqu kartı (#155): təklif sayı və satış/kirayə bölgüsü, agent sayı,
 * təsvirdən iki sətir. Telefon kartda göstərilmir — profil səhifəsində «Nömrəni göstər»
 * ilə açılır (bina.az kimi), həm də bot-lar kataloqdan nömrə toplamasın.
 */
export function AgencyCard({
  agency,
  className,
  areaName,
}: {
  agency: AgencyCardData;
  className?: string;
  /** Verilsə ərazidəki təklif sayı göstərilir. */
  areaName?: string;
}) {
  const t = useTranslations("listings.agencyDirectory");
  const profile = useTranslations("listings.agencyProfile");
  return (
    <article className={cn("card-surface group relative flex h-full flex-col gap-4 p-5 sm:p-6", className)}>
      <div className="flex items-start gap-4">
        <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-gold-line bg-paper shadow-xs">
          {agency.logoUrl ? (
            <Image
              src={agency.logoUrl}
              alt={agency.name}
              fill
              unoptimized={isUnoptimizedImage(agency.logoUrl)}
              sizes="64px"
              className="object-contain"
            />
          ) : (
            <Building2 className="size-7 text-gold-deep" strokeWidth={1.5} aria-hidden="true" />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-lg leading-snug text-ink">
            <Link
              href={`/agentlikler/${agency.slug}`}
              className="after:absolute after:inset-0 after:rounded-lg after:content-[''] inline-flex min-h-11 items-center transition-colors duration-300 ease-out-soft hover:text-gold-deep"
            >
              {agency.name}
            </Link>
          </h3>
          <p className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {profile("verified")}
          </p>
          {(agency.rating || agency.fastResponse) && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
              {agency.rating && (
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-gold text-gold-deep" aria-hidden="true" />
                  <span className="sr-only">{profile("ratingLabel")}:</span>
                  {profile("ratingSummary", { rating: agency.rating.average.toFixed(1), count: agency.rating.count })}
                </span>
              )}
              {agency.fastResponse && (
                <span className="inline-flex items-center gap-1 font-medium text-gold-deep">
                  <Zap className="size-3.5" aria-hidden="true" />
                  {profile("fastResponse")}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {areaName && agency.areaOffers ? (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
          <MapPin className="size-4 text-gold-deep" aria-hidden="true" />
          {t("areaOffers", { place: areaName, count: agency.areaOffers })}
        </p>
      ) : null}

      {agency.description && (
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{agency.description}</p>
      )}

      <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-4">
        <div>
          <dt className="sr-only">{profile("statOffers")}</dt>
          <dd className="tabular text-base font-semibold text-ink">{t("offers", { count: agency.offers.total })}</dd>
          <dd className="text-xs text-ink-muted">{t("split", { sale: agency.offers.sale, rent: agency.offers.rent })}</dd>
        </div>
        <div className="text-right">
          <dt className="sr-only">{profile("statAgents")}</dt>
          <dd className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
            <Users className="size-4 text-gold-deep" aria-hidden="true" />
            {t("agents", { count: agency.agentCount })}
          </dd>
          {agency.address && (
            <dd className="mt-1 flex items-center justify-end gap-1 text-xs text-ink-muted">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="line-clamp-1">{agency.address}</span>
            </dd>
          )}
        </div>
      </dl>
      <span className="inline-flex items-center gap-1 text-sm font-medium text-gold-deep" aria-hidden="true">
        {t("viewProfile")}
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </article>
  );
}
