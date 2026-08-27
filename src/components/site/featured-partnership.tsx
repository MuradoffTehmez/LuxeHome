import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { buttonClassName } from "@/components/ui/button";
import { PartnerGrid } from "./partner-grid";
import { PartnerLogo } from "./partner-logo";
import { siteConfig } from "@/config/site";
import { isOfficialPartnerVisible, localizePartnerContent } from "@/lib/partners";
import type { PartnerCardData } from "@/lib/queries";
import type { Locale } from "@/lib/constants";

/**
 * Ana səhifədəki tərəfdaşlıq bölməsi.
 *
 * Görünüş tərəfdaş sayına uyğunlaşır — carousel heç bir halda default deyil:
 *
 * - **1 tərəfdaş** → «LUXE HOME ESTATE × PARTNER» premium showcase.
 * - **2–4 tərəfdaş** → balanslı kart şəbəkəsi.
 * - **5+ tərəfdaş** → loqo şəbəkəsi (kart deyil, sıxlıq üçün).
 *
 * Tərəfdaş yoxdursa bölmə ümumiyyətlə render olunmur: boş başlıq ana səhifədə
 * yalnız yer tutardı.
 */
export async function FeaturedPartnership({
  partners,
  locale,
}: {
  partners: PartnerCardData[];
  locale: Locale;
}) {
  if (partners.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "partners" });

  return (
    <Section tone="paper">
      <Container size="wide">
        {partners.length === 1 ? (
          <SinglePartnerShowcase partner={partners[0]} locale={locale} />
        ) : (
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-3 text-center">
              <p className="editorial-kicker text-gold-deep">{t("home.overline")}</p>
              <h2 className="font-display text-3xl tracking-[-0.03em] text-ink sm:text-4xl">
                {t("home.title")}
              </h2>
            </div>

            {partners.length <= 4 ? (
              <PartnerGrid partners={partners} locale={locale} />
            ) : (
              <PartnerLogoWall partners={partners} />
            )}

            <div className="flex justify-center">
              <Link href="/terefdaslar" className={buttonClassName("outline")}>
                {t("home.allPartners")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}

/**
 * Tək tərəfdaş üçün strateji əməkdaşlıq kompozisiyası.
 *
 * Desktopda üç sütun: bizim logotip — «×» — tərəfdaşın loqosu. Mobil versiya
 * sıxılmış desktop deyil, ayrıca şaquli kompozisiyadır: eyni üç element alt-alta
 * düzülür və ayırıcı «×» üfüqi xəttlərdən şaquli xəttə çevrilir. Grid `order`
 * ilə deyil, iki ayrı düzülüşlə həll olunub ki, hər ölçüdə mərkəzləşmə dəqiq olsun.
 */
async function SinglePartnerShowcase({
  partner,
  locale,
}: {
  partner: PartnerCardData;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "partners" });
  const { shortDescription } = localizePartnerContent(partner, locale);
  const official = isOfficialPartnerVisible(partner);

  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-md border border-line bg-ivory px-5 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        {/* İncə qızılı kənar detalı — brendin editorial dilinə uyğun, glow yoxdur */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-line to-transparent"
        />

        <div className="flex flex-col items-center gap-10 text-center">
          <p className="editorial-kicker text-gold-deep">{t("strategicPartnership")}</p>

          {/* --- Loqo cütü --- */}
          <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10 lg:gap-16">
            <div className="flex items-center justify-center sm:flex-1 sm:justify-end">
              <HouseLogo />
            </div>

            <Divider />

            <div className="flex items-center justify-center sm:flex-1 sm:justify-start">
              <PartnerLogo partner={partner} size="xl" priority />
            </div>
          </div>

          {official ? (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-gold-deep">
              <BadgeCheck className="size-4" aria-hidden="true" />
              {t("official")}
            </p>
          ) : null}

          <p className="max-w-xl text-pretty text-base leading-relaxed text-ink-soft">
            {shortDescription || t("home.description")}
          </p>

          <Link href={`/terefdaslar/${partner.slug}`} className={buttonClassName("outline")}>
            {t("home.action")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}

/**
 * Luxe Home Estate tərəfi.
 *
 * `Logo` komponenti istifadə olunmur: o, ana səhifəyə keçid daşıyır və burada
 * ikinci «ana səhifə» linki mənasızdır. Gerb + wordmark eyni fayl və eyni
 * typography ilə təkrarlanır, ona görə vizual kimlik dəyişmir.
 */
function HouseLogo() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo-mark.png"
        alt=""
        width={512}
        height={512}
        priority
        className="size-12 shrink-0 sm:size-16"
      />
      <span className="flex flex-col whitespace-nowrap leading-none text-left">
        <span className="font-display text-base font-semibold tracking-[0.14em] text-ink sm:text-lg sm:tracking-[0.18em]">
          LUXE HOME ESTATE
        </span>
      </span>
      <span className="sr-only">{siteConfig.name}</span>
    </div>
  );
}

/** «×» ayırıcısı — mobildə şaquli, desktopda üfüqi xəttlərlə. */
function Divider() {
  return (
    <div
      aria-hidden="true"
      className="flex shrink-0 flex-col items-center gap-3 sm:flex-row"
    >
      <span className="h-8 w-px bg-gold-line sm:h-px sm:w-10" />
      <span className="font-display text-xl text-gold-deep">×</span>
      <span className="h-8 w-px bg-gold-line sm:h-px sm:w-10" />
    </div>
  );
}

/** 5+ tərəfdaş: kart əvəzinə sıx loqo şəbəkəsi. */
function PartnerLogoWall({ partners }: { partners: PartnerCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3 lg:grid-cols-4">
      {partners.map((partner) => (
        <li key={partner.id} className="bg-paper">
          <Link
            href={`/terefdaslar/${partner.slug}`}
            className="flex min-h-28 items-center justify-center p-6 transition-colors hover:bg-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset"
          >
            <PartnerLogo partner={partner} size="md" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
