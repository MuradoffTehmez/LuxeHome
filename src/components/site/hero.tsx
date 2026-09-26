import Image from "next/image";
import { ArrowRight, ChevronDown, Phone, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { buttonClassName } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { LISTING_TYPES, type Locale } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { localizePath } from "@/i18n/path-locale";
import { TrackedPropertySearchForm } from "./tracked-property-search-form";

export type HeroTypeOption = { value: string; label: string };
export type HeroCityOption = { value: string; label: string };

export type HeroLabels = {
  imageAlt: string;
  eyebrow: string;
  title: string;
  description: string;
  viewProperties: string;
  contactUs: string;
  call: string;
  search: {
    listingType: string;
    sale: string;
    rent: string;
    query: string;
    queryPlaceholder: string;
    propertyType: string;
    city: string;
    all: string;
    submit: string;
  };
};

type HeroProps = {
  types: HeroTypeOption[];
  cities: HeroCityOption[];
  locale: Locale;
  labels: HeroLabels;
};

const CONTROL_CLASS =
  "min-h-12 min-w-0 w-full rounded-sm border border-line-strong bg-paper px-3 text-base text-ink transition-[border-color,box-shadow] duration-200 hover:border-ink-muted focus:border-gold focus:shadow-[0_0_0_4px_rgb(170_135_84/0.16)] sm:text-sm";

/**
 * Hero axtarışı yalnız native GET formudur. Client state və bütün geniş filtr
 * komponentini ana səhifəyə daşımaq əvəzinə brauzerin öz form davranışından
 * istifadə olunur; JavaScript sönülü olanda da eyni marşrut işləyir.
 */
function HeroSearchForm({
  types,
  cities,
  locale,
  labels,
}: Pick<HeroProps, "types" | "cities" | "locale"> & { labels: HeroLabels["search"] }) {
  return (
    <div className="rounded-xl border border-white/25 bg-paper/95 p-3 shadow-editorial backdrop-blur-md sm:p-5">
      <TrackedPropertySearchForm
        action={localizePath("/emlaklar", locale)}
        method="get"
        placement="hero"
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-4"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <fieldset className="flex flex-col gap-1.5 lg:col-span-3">
            <legend className="text-xs font-medium tracking-wide text-ink-soft">
              {labels.listingType}
            </legend>
            <div className="grid min-h-12 grid-cols-2 rounded-sm border border-line-strong bg-beige/60 p-1">
              {[
                { value: LISTING_TYPES.SALE, label: labels.sale },
                { value: LISTING_TYPES.RENT, label: labels.rent },
              ].map((option, index) => (
                <label key={option.value} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="elan"
                    value={option.value}
                    defaultChecked={index === 0}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-11 items-center justify-center rounded-[7px] px-3 text-sm font-semibold text-ink-soft transition-colors peer-checked:bg-charcoal peer-checked:text-ink-invert peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex min-w-0 flex-col gap-1.5 lg:col-span-4">
            <label htmlFor="hero-property-query" className="text-xs font-medium tracking-wide text-ink-soft">
              {labels.query}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input
                id="hero-property-query"
                name="axtaris"
                type="search"
                enterKeyHint="search"
                placeholder={labels.queryPlaceholder}
                className={cn(CONTROL_CLASS, "pl-9 placeholder:text-ink-muted")}
              />
            </div>
          </div>

          {[
            { id: "hero-property-type", name: "tip", label: labels.propertyType, options: types },
            { id: "hero-property-city", name: "seher", label: labels.city, options: cities },
          ].map((field) => (
            <div key={field.name} className="hidden min-w-0 flex-col gap-1.5 md:flex lg:col-span-2 last:lg:col-span-3">
              <label htmlFor={field.id} className="text-xs font-medium tracking-wide text-ink-soft">
                {field.label}
              </label>
              <div className="relative">
                <select
                  id={field.id}
                  name={field.name}
                  defaultValue=""
                  className={cn(CONTROL_CLASS, "cursor-pointer appearance-none pr-9")}
                >
                  <option value="">{labels.all}</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>

        <button type="submit" className={buttonClassName("primary", "md", false, "w-full sm:w-auto lg:min-w-36")}>
          <Search className="size-4" aria-hidden="true" />
          {labels.submit}
        </button>
      </TrackedPropertySearchForm>
    </div>
  );
}

/** Başlığın şkalası bütün dillərdə eynidir; yalnız oxunaqlı sətir eni locale-a uyğunlaşır. */
export function heroTitleClassName(locale: Locale): string {
  return cn(
    "animate-slide-up mt-6 font-display text-[clamp(2.35rem,11vw,3.4rem)] leading-[1.05] tracking-[-0.035em] text-balance text-white sm:text-[clamp(3rem,7vw,4.5rem)] sm:leading-[1.04] lg:text-[clamp(3.8rem,5.4vw,5.5rem)] lg:tracking-[-0.04em] [overflow-wrap:normal] [word-break:normal]",
    locale === "ru" ? "max-w-[20ch]" : "max-w-[18ch]",
  );
}

/** Ana səhifənin hero bölməsi — LCP elementi burada yerləşir. */
export function Hero({ types, cities, locale, labels }: HeroProps) {
  return (
    <section className="on-dark relative isolate -mt-[var(--header-h)]" data-locale={locale}>
      {/* Fon şəkli — hero başlığın altında fixed header-in arxasına uzanır */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2048&q=75"
          alt={labels.imageAlt}
          fill
          priority
          fetchPriority="high"
          quality={65}
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* İkiqat overlay — mətnin kontrastını hər şəkil üzərində təmin edir */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,17,15,0.86)_0%,rgba(18,17,15,0.58)_46%,rgba(18,17,15,0.12)_78%),linear-gradient(0deg,rgba(18,17,15,0.88)_0%,rgba(18,17,15,0.08)_48%)]"
        />
      </div>

      <Container
        size="wide"
        className="grid min-h-[34rem] min-w-0 gap-7 pt-[calc(var(--header-h)+3rem)] pb-6 sm:min-h-[40rem] sm:gap-8 sm:pt-[calc(var(--header-h)+4rem)] lg:min-h-[min(54rem,100dvh)] lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-x-10 lg:gap-y-8 lg:pt-[calc(var(--header-h)+4rem)] lg:pb-10"
      >
        <div className="min-w-0 self-end lg:col-span-9">
          <p className="editorial-kicker animate-fade-in flex items-center gap-3 text-gold-soft">
            <span aria-hidden="true" className="h-px w-10 bg-gold-soft/60" />
            {labels.eyebrow}
          </p>

          <h1
            className={heroTitleClassName(locale)}
            style={{ animationDelay: "100ms" }}
          >
            {labels.title}
          </h1>

          <p
            className="animate-slide-up mt-7 max-w-[58ch] text-base leading-relaxed text-white/78 sm:text-lg"
            style={{ animationDelay: "200ms" }}
          >
            {labels.description}
          </p>

          <div className="animate-slide-up mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "300ms" }}>
            <Link href="/emlaklar" className={buttonClassName("primary", "lg")}>
              {labels.viewProperties}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>

            <Link
              href="/elaqe"
              className={buttonClassName("onDark", "lg", false, "hidden border-white/30 text-white hover:text-gold-soft sm:inline-flex")}
            >
              {labels.contactUs}
            </Link>

            <a
              href={siteConfig.phoneHref}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-white/75 transition-colors hover:text-gold-soft sm:hidden"
            >
              <Phone className="size-4" aria-hidden="true" />
              {labels.call}
            </a>
          </div>
        </div>

        {/* Axtarış paneli */}
        <div
          className="animate-slide-up min-w-0 lg:col-span-12 lg:row-start-2"
          style={{ animationDelay: "400ms" }}
        >
          <HeroSearchForm types={types} cities={cities} locale={locale} labels={labels.search} />
        </div>
      </Container>
    </section>
  );
}
