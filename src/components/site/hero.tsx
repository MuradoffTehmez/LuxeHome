import Image from "next/image";
import { ArrowRight, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { SearchPanel } from "./search-panel";

type HeroProps = {
  types: { value: string; label: string }[];
  cities: { value: string; label: string }[];
};

/** Ana səhifənin hero bölməsi — LCP elementi burada yerləşir. */
export function Hero({ types, cities }: HeroProps) {
  return (
    <section className="on-dark relative isolate -mt-[var(--header-h)]">
      {/* Fon şəkli — hero başlığın altında fixed header-in arxasına uzanır */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2400&q=80"
          alt="Müasir memarlıqla tikilmiş premium villa"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* İkiqat overlay — mətnin kontrastını hər şəkil üzərində təmin edir */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-charcoal/62"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-charcoal/75 via-charcoal/25 to-charcoal/85"
        />
      </div>

      <Container className="flex min-h-dvh flex-col justify-center pt-[calc(var(--header-h)+2rem)] pb-20 lg:pb-28 lg:pt-[calc(var(--header-h)+3rem)]">
        <div className="max-w-3xl">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.28em] text-gold-soft uppercase">
            <span aria-hidden="true" className="h-px w-10 bg-gold-soft/60" />
            {siteConfig.legalName}
          </p>

          <h1 className="mt-6 font-display text-[2.5rem] leading-[1.08] text-white sm:text-6xl lg:text-7xl">
            {siteConfig.slogan}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            LuxeHome ilə sizin üçün uyğun daşınmaz əmlakı kəşf edin. Mənzil,
            villa, həyət evi, torpaq və kommersiya obyektləri üzrə geniş seçim.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/emlaklar" variant="primary" size="lg">
              Əmlaklara bax
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>

            <ButtonLink href="/elaqe" variant="onDark" size="lg">
              Bizimlə əlaqə
            </ButtonLink>

            <ButtonAnchor
              href={siteConfig.phoneHref}
              variant="onDark"
              size="lg"
              className="sm:hidden"
            >
              <Phone className="size-4" aria-hidden="true" />
              Zəng et
            </ButtonAnchor>
          </div>
        </div>

        {/* Axtarış paneli */}
        <div className="mt-12 lg:mt-16">
          <SearchPanel types={types} cities={cities} />
        </div>
      </Container>
    </section>
  );
}
