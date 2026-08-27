import { getTranslations } from "next-intl/server";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isOfficialPartnerVisible, normalizePartnershipType } from "@/lib/partners";
import type { Locale } from "@/lib/constants";

type PartnerBadgeSource = {
  status: string;
  verified: boolean;
  officialPartner: boolean;
  showPublicly: boolean;
  partnershipEndDate: Date | string | null;
  partnershipType: string;
};

/**
 * Tərəfdaş nişanları.
 *
 * «Rəsmi tərəfdaş» qərarı komponentdə deyil, `isOfficialPartnerVisible()`-dədir —
 * eyni şərt həm burada, həm elan səhifəsində, həm cron-da işləyir. Komponent
 * bayraqlara birbaşa baxsaydı, qaydanın bir yerdə dəyişməsi digərini geridə qoyardı.
 *
 * `verified` ayrıca nişan kimi yalnız rəsmi tərəfdaş olmayan hallarda göstərilir:
 * «Rəsmi tərəfdaş» onsuz da təsdiqlənmiş olmağı bildirir, iki nişan təkrar olardı.
 * PRD-nin «çox rəngli badge-lər» qadağasına görə palitra iki tonla məhdudlaşır.
 */
export async function PartnerBadges({
  partner,
  locale,
  showType = true,
}: {
  partner: PartnerBadgeSource;
  locale: Locale;
  showType?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "partners" });
  const official = isOfficialPartnerVisible(partner);
  const type = normalizePartnershipType(partner.partnershipType);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {official ? (
        <Badge tone="gold">
          <BadgeCheck className="size-3.5" aria-hidden="true" />
          {t("official")}
        </Badge>
      ) : partner.verified ? (
        <Badge tone="neutral">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {t("verified")}
        </Badge>
      ) : null}

      {showType ? <Badge tone="neutral">{t(`types.${type}`)}</Badge> : null}
    </div>
  );
}
