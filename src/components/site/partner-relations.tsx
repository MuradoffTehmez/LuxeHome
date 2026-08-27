import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { PartnerLogo } from "./partner-logo";
import { PartnerBadges } from "./partner-badge";
import { PartnerExternalLink } from "./partner-external-link";
import { normalizePartnershipType, normalizeRelationRole } from "@/lib/partners";
import type { PartnerCardData } from "@/lib/queries";
import type { Locale } from "@/lib/constants";

type RelationLink = {
  role: string;
  isPrimary: boolean;
  sourceUrl?: string | null;
  partner: PartnerCardData;
};

/**
 * Elan və layihə səhifələrindəki tərəfdaş bloku.
 *
 * Sorğu qatı (`getPropertyPartners` / `getProjectPartners`) yalnız ictimai
 * görünən tərəfdaşları qaytarır, ona görə burada əlavə filtr yoxdur — blok
 * boş massiv alanda ümumiyyətlə render olunmur.
 *
 * Rol nişanı vacibdir: eyni elanda developer və satış tərəfdaşı ola bilər,
 * ziyarətçi hansının nə olduğunu ayırd etməlidir.
 */
export async function PartnerRelations({
  links,
  locale,
  placement,
}: {
  links: RelationLink[];
  locale: Locale;
  placement: "property_detail" | "partner_detail";
}) {
  if (links.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "partners" });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl text-ink">{t("property.heading")}</h2>

      <ul className="flex flex-col gap-3">
        {links.map((link) => {
          const type = normalizePartnershipType(link.partner.partnershipType);

          return (
            <li
              key={link.partner.id}
              className="flex flex-col gap-4 rounded-md border border-line bg-paper p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <PartnerLogo partner={link.partner} size="md" />
                <Badge tone="neutral">{t(`roles.${normalizeRelationRole(link.role)}`)}</Badge>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-display text-lg text-ink">{link.partner.name}</h3>
                <PartnerBadges partner={link.partner} locale={locale} showType={false} />
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-4">
                <Link
                  href={`/terefdaslar/${link.partner.slug}`}
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink transition-colors hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {t("property.aboutPartner")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>

                {/* Mənbə linki tərəfdaşın öz saytındakı elana aparır — şəffaflıq üçün */}
                {link.sourceUrl ? (
                  <PartnerExternalLink
                    href={link.sourceUrl}
                    partnerId={link.partner.id}
                    partnerType={type}
                    placement={placement}
                    className="text-sm text-ink-muted hover:text-gold-deep"
                  >
                    {t("property.sourceLink")}
                  </PartnerExternalLink>
                ) : link.partner.websiteUrl ? (
                  <PartnerExternalLink
                    href={link.partner.websiteUrl}
                    partnerId={link.partner.id}
                    partnerType={type}
                    placement={placement}
                    ariaLabel={t("externalSiteAria", { name: link.partner.name })}
                    className="text-sm text-ink-muted hover:text-gold-deep"
                  >
                    {t("externalSite")}
                  </PartnerExternalLink>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
