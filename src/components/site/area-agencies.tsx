import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { AgencyCard } from "@/components/site/agency-card";
import { Link } from "@/i18n/navigation";
import { getPublicAgencyCatalog } from "@/lib/agency-profile";

/** Rayon səhifəsində göstərilən agentlik sayı — qalanları ayrıca landing-dədir. */
const AREA_AGENCIES_PREVIEW = 6;

/**
 * «Bu ərazidə fəal agentliklər» (#161, C6): rayon/qəsəbə landing-inin altında, həmin ərazidə
 * aktiv təklifi olan təsdiqlənmiş agentliklər. Agentlik yoxdursa blok göstərilmir.
 */
export async function AreaAgencies({ slug, placeName }: { slug: string; placeName: string }) {
  const agencies = await getPublicAgencyCatalog({ area: slug });
  if (agencies.length === 0) return null;
  const t = await getTranslations("listings.areaAgencies");

  return (
    <Section tone="paper" spacing="cozy" aria-labelledby="area-agencies-title">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="area-agencies-title" className="font-display text-3xl tracking-[-0.02em] text-ink">{t("blockTitle")}</h2>
            <p className="mt-1 text-sm text-ink-soft">{t("blockDescription", { place: placeName, count: agencies.length })}</p>
          </div>
          <Link
            href={`/rayon/${slug}/agentlikler`}
            className="relative inline-flex items-center gap-1 text-sm font-medium text-gold-deep underline-offset-4 after:absolute after:-inset-y-3 after:inset-x-0 hover:underline"
          >
            {t("viewAll")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.slice(0, AREA_AGENCIES_PREVIEW).map((agency) => (
            <AgencyCard key={agency.id} agency={agency} areaName={placeName} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
