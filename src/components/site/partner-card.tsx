import { getTranslations } from "next-intl/server";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PartnerBadges } from "./partner-badge";
import { PartnerLogo } from "./partner-logo";
import { PartnerExternalLink } from "./partner-external-link";
import { localizePartnerContent, normalizePartnershipType } from "@/lib/partners";
import type { PartnerCardData } from "@/lib/queries";
import type { Locale } from "@/lib/constants";

/**
 * Tərəfdaş kartı.
 *
 * Kart bir yerdə iki keçid daşıyır — daxili profil və tərəfdaşın öz saytı.
 * Bütün kartı bir `<a>`-ya bükmək ikinci linki içəridə qeyri-mümkün edərdi
 * (iç-içə anchor etibarsız HTML-dir), ona görə kart `<article>`-dir və başlıq
 * linki `after:absolute` ilə bütün sahəni tutur; kənar link isə `relative z-10`
 * ilə həmin örtüyün üstündə qalır.
 */
export async function PartnerCard({
  partner,
  locale,
}: {
  partner: PartnerCardData;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "partners" });
  const { shortDescription } = localizePartnerContent(partner, locale);
  const type = normalizePartnershipType(partner.partnershipType);
  const location = [partner.city, partner.country].filter(Boolean).join(", ");

  return (
    <article className="group relative flex h-full flex-col gap-4 rounded-md border border-line bg-paper p-5 transition-[border-color,box-shadow] duration-300 hover:border-gold-line hover:shadow-editorial sm:p-6">
      <PartnerLogo partner={partner} size="md" />

      <div className="flex min-w-0 flex-col gap-2">
        <h3 className="font-display text-xl text-ink">
          <Link
            href={`/terefdaslar/${partner.slug}`}
            className="rounded-xs transition-colors after:absolute after:inset-0 after:content-[''] hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {partner.name}
          </Link>
        </h3>

        <PartnerBadges partner={partner} locale={locale} />
      </div>

      {shortDescription ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">{shortDescription}</p>
      ) : null}

      <div className="mt-auto flex flex-col gap-3 border-t border-line pt-4">
        {location ? (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {location}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-x-4">
          <span className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink transition-colors group-hover:text-gold-deep">
            {t("details")}
            <ArrowUpRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </span>

          {partner.websiteUrl ? (
            <PartnerExternalLink
              href={partner.websiteUrl}
              partnerId={partner.id}
              partnerType={type}
              placement="partner_list"
              ariaLabel={t("externalSiteAria", { name: partner.name })}
              className="relative z-10 text-sm text-ink-muted hover:text-gold-deep"
            >
              {t("externalSite")}
            </PartnerExternalLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}
