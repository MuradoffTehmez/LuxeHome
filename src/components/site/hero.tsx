import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { buttonClassName } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { SearchPanel, type CityOption, type TypeOption } from "./search-panel";

type HeroProps = {
  types: TypeOption[];
  cities: CityOption[];
};

/** Ana səhifənin hero bölməsi — LCP elementi burada yerləşir. */
export async function Hero({ types, cities }: HeroProps) {
  const t = await getTranslations("home.hero");
  return (
    <section className="on-dark relative isolate -mt-[var(--header-h)]">
      {/* Fon şəkli — hero başlığın altında fixed header-in arxasına uzanır */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2400&q=80"
          alt={t("imageAlt")}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="animate-slow-zoom object-cover object-center"
        />
        {/* İkiqat overlay — mətnin kontrastını hər şəkil üzərində təmin edir */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,17,15,0.86)_0%,rgba(18,17,15,0.58)_46%,rgba(18,17,15,0.12)_78%),linear-gradient(0deg,rgba(18,17,15,0.88)_0%,rgba(18,17,15,0.08)_48%)]"
        />
      </div>

      <Container
        size="wide"
        className="grid min-h-[34rem] min-w-0 items-end gap-8 pt-[calc(var(--header-h)+4rem)] pb-6 sm:min-h-[40rem] lg:min-h-[min(54rem,100dvh)] lg:grid-cols-12 lg:gap-10 lg:pt-[calc(var(--header-h)+5rem)] lg:pb-10"
      >
        <div className="min-w-0 lg:col-span-7 lg:pb-10">
          <p className="editorial-kicker animate-fade-in flex items-center gap-3 text-gold-soft">
            <span aria-hidden="true" className="h-px w-10 bg-gold-soft/60" />
            {t("eyebrow")}
          </p>

          <h1
            className="animate-slide-up mt-6 max-w-[13ch] font-display text-[clamp(2.5rem,12vw,6.6rem)] leading-[0.94] tracking-[-0.05em] text-white [overflow-wrap:anywhere] sm:text-[clamp(2.8rem,6.5vw,6.6rem)]"
            style={{ animationDelay: "100ms" }}
          >
            {t("title")}
          </h1>

          <p
            className="animate-slide-up mt-7 max-w-[58ch] text-base leading-relaxed text-white/78 sm:text-lg"
            style={{ animationDelay: "200ms" }}
          >
            {t("description")}
          </p>

          <div className="animate-slide-up mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "300ms" }}>
            <Link href="/emlaklar" className={buttonClassName("primary", "lg")}>
              {t("viewProperties")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>

            <Link
              href="/elaqe"
              className={buttonClassName("onDark", "lg", false, "border-white/30 text-white hover:text-gold-soft")}
            >
              {t("contactUs")}
            </Link>

            <a
              href={siteConfig.phoneHref}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-white/75 transition-colors hover:text-gold-soft sm:hidden"
            >
              <Phone className="size-4" aria-hidden="true" />
              {t("call")}
            </a>
          </div>
        </div>

        <div className="hidden lg:col-span-5 lg:block" aria-hidden="true" />

        {/* Axtarış paneli */}
        <div
          className="animate-slide-up min-w-0 lg:col-span-12"
          style={{ animationDelay: "400ms" }}
        >
          <SearchPanel types={types} cities={cities} />
        </div>
      </Container>
    </section>
  );
}
