import { getTranslations } from "next-intl/server";
import { ChevronDown, Globe, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import {
  legalNavigation,
  listingLinks,
  navigation,
  propertyTypeLinks,
  siteConfig,
  socialProfiles,
  supportNavigation,
} from "@/config/site";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "./brand-icons";
import { Logo } from "./logo";
import { getHiddenPublicPaths } from "@/lib/site-sections";
import { withoutHiddenPaths } from "@/lib/site-section-paths";

/** `socialProfiles` açarını ikona bağlayır — sıra konfiqurasiyada saxlanılır. */
const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  linkedin: LinkedInIcon,
  whatsapp: WhatsAppIcon,
} as const;

/**
 * Keçid sətrinin ölçüsü iki rejimdə fərqlidir.
 *
 * Mobil akkordeonda sətir barmaq hədəfidir — 44px saxlanılır. Desktopda isə
 * eyni hündürlük 14 keçidlik sütunu 600px-ə çıxarır və sütunlar arasında
 * balansı pozur; orada sətir mətnə görə sıxılır (`lg:min-h-0`), boşluq isə
 * WCAG 2.5.8 minimumundan (24px) yuxarı qalır.
 */
const FOOTER_LINK =
  "inline-flex min-h-11 items-center rounded-xs text-sm text-ink-invert-soft transition-colors hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:min-h-0 lg:py-1.5";

const FOOTER_HEADING = "editorial-kicker text-gold-soft";

/**
 * Başlıq hər iki rejimdə eyni qızılı kicker-dir — `SectionHeader`-dəki redaksiya
 * dili footer-də də təkrarlanır. Mətn kiçikdir, amma mobil `<summary>`-nin barmaq
 * hədəfi etiketdən deyil, sətrin `min-h-14` hündürlüyündən gəlir.
 */
function FooterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <details className="group border-b border-line-dark lg:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-2 marker:content-none">
          <span className={FOOTER_HEADING}>{title}</span>
          <ChevronDown
            className="size-4 shrink-0 text-gold-soft transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="pb-5">{children}</div>
      </details>

      <section className="hidden lg:block">
        <h2 className={FOOTER_HEADING}>{title}</h2>
        <div className="pt-5">{children}</div>
      </section>
    </>
  );
}

function FooterLinkList({
  items,
}: {
  items: readonly { label: string; href: string }[];
}) {
  return (
    <ul className="grid gap-y-0.5 sm:grid-cols-2 lg:grid-cols-1">
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className={FOOTER_LINK}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PropertyLinks({
  propertyItems,
  listingItems,
  listingTypeLabel,
}: {
  propertyItems: readonly { label: string; href: string }[];
  listingItems: readonly { label: string; href: string }[];
  listingTypeLabel: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <ul className="grid gap-y-0.5 sm:grid-cols-2 lg:grid-cols-1">
        {propertyItems.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={FOOTER_LINK}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-line-dark pt-4">
        <p className="editorial-kicker mb-3 text-ink-invert-muted">{listingTypeLabel}</p>
        <ul className="flex flex-wrap gap-2">
          {listingItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex min-h-9 items-center rounded-full border border-line-dark px-3.5 text-xs font-medium text-ink-invert-soft transition-colors hover:border-gold-soft hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Footer-də quraşdırılmış xəritə **qəsdən yoxdur.**
 *
 * Footer bütün səhifələrdədir; Leaflet paketini hər yüklənişə qoşmaq (və ofis
 * koordinatını D1-dən oxumaq) səkkiz statik səhifəni də dinamikə çevirərdi.
 * Əvəzinə ünvan mətnindən qurulan naviqasiya keçidi verilir: konfiqurasiya
 * tələb etmir, statik səhifədə də işləyir və istifadəçini birbaşa xəritə
 * tətbiqinə aparır. Tam xəritə «Əlaqə» səhifəsindədir.
 */
function ContactDetails({ directionsLabel }: { directionsLabel: string }) {
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    siteConfig.addressFull,
  )}`;

  return (
    <address className="flex flex-col gap-3 text-sm not-italic text-ink-invert-soft">
      <a
        href={siteConfig.phoneHref}
        className="group flex min-h-11 items-center gap-3 rounded-xs transition-colors hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:min-h-0 lg:py-1"
      >
        <Phone className="size-4 shrink-0 text-gold-soft" aria-hidden="true" />
        {/* `whitespace-nowrap`: nömrə boşluqlarla yazılır və 167px-lik «Əlaqə»
            sütununda iki sətrə bölünürdü. */}
        <span className="tabular whitespace-nowrap text-sm font-semibold text-ink-invert transition-colors group-hover:text-gold-soft">
          {siteConfig.phone}
        </span>
      </a>

      <a
        href={`mailto:${siteConfig.email}`}
        className="flex min-h-11 items-center gap-3 rounded-xs transition-colors hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:min-h-0 lg:py-1"
      >
        <Mail className="size-4 shrink-0 text-gold-soft" aria-hidden="true" />
        {siteConfig.email}
      </a>

      <span className="flex items-start gap-3 pt-1">
        <MapPin className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden="true" />
        <span className="flex flex-col items-start gap-1 leading-6">
          {siteConfig.addressFull}
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xs text-gold-soft underline-offset-4 transition-colors hover:text-gold-deep hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <Navigation className="size-3.5" aria-hidden="true" />
            {directionsLabel}
          </a>
        </span>
      </span>

      <a
        href={`https://${siteConfig.website}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-11 items-center gap-3 rounded-xs transition-colors hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:min-h-0 lg:py-1"
      >
        <Globe className="size-4 shrink-0 text-gold-soft" aria-hidden="true" />
        {siteConfig.website}
      </a>
    </address>
  );
}

/** İkon düyməsi — mətn etiketi yalnız ekran oxuyucusu üçün verilir. */
function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex size-11 items-center justify-center rounded-full border border-line-dark text-ink-invert-soft transition-colors hover:border-gold-soft hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      {children}
    </a>
  );
}

const NAV_KEY_BY_HREF = {
  "/": "home", "/emlaklar": "properties", "/layiheler": "projects",
  "/agentlikler": "agencies", "/agentler": "agents", "/xidmetler": "services", "/blog": "blog",
  "/elaqe": "contact", "/haqqimizda": "about", "/suallar": "faq",
  "/terefdaslar": "partners",
  "/bilik-merkezi": "knowledgeHub", "/lugat": "glossary", "/kalkulyator": "calculator",
  "/bazar-analitikasi": "marketIntelligence",
} as const;

const PROPERTY_KEY_BY_HREF = {
  "/bakida-satilan-menziller": "saleApartments", "/bakida-kiraye-menziller": "rentApartments",
  "/villalar": "villas", "/heyet-evleri": "houses", "/torpaq-saheleri": "land",
  "/kommersiya-obyektleri": "commercial", "/ofisler": "offices",
} as const;

const LEGAL_KEY_BY_HREF = {
  "/mexfilik-siyaseti": "privacy", "/istifade-sertleri": "terms", "/cookie-siyaseti": "cookies",
} as const;

export async function Footer() {
  const t = await getTranslations("navigation");
  // Paneldən bağlanmış bölmələr (məs. «Yaşayış kompleksləri») footer-də də görünmür.
  const hiddenPaths = await getHiddenPublicPaths();
  const year = new Date().getFullYear();
  const localize = (items: readonly { href: keyof typeof NAV_KEY_BY_HREF }[]) =>
    withoutHiddenPaths(items, hiddenPaths).map((item) => ({ href: item.href, label: t(NAV_KEY_BY_HREF[item.href]) }));

  // `navigation` və `supportNavigation` qəsdən ayrı sütunlardır: vahid siyahı
  // 14 sətirlik sütun yaradır və qonşu sütunlarla hündürlük fərqi footer-i
  // əyri göstərir. Bölgü həm də məzmunu məntiqi qruplaşdırır.
  const navigationItems = localize(navigation);
  const resourceItems = localize(supportNavigation);
  const propertyItems = propertyTypeLinks.map((item) => ({
    href: item.href,
    label: t(`propertyLinks.${PROPERTY_KEY_BY_HREF[item.href]}`),
  }));
  const listingItems = listingLinks.map((item) => ({
    href: item.href,
    label: t(`propertyLinks.${item.href === "/satilan-emlaklar" ? "sale" : "rent"}`),
  }));

  return (
    <footer className="on-dark relative border-t border-line-dark bg-navy text-ink-invert">
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      />

      <Container className="py-12 lg:py-16">
        {/*
          Mobil: akkordeon sətirləri şaquli boşluqsuz yığılır, ayırıcı rolunu
          hər `<details>`-in `border-b`-si oynayır.

          Brend sütununun eni `fr` ilə deyil, sabit 340px ilə verilir: wordmark
          `whitespace-nowrap`-dır və gerblə birlikdə ~328px tutur. Nisbi enlə o,
          sütundan daşıb «Naviqasiya» başlığının üstünə düşürdü. 1280px-dən
          aşağıda beş sütun üçün yer qalmır, ona görə brend orada bütün sətri
          tutur və keçid sütunları altındakı sətirdə dördə bölünür.
        */}
        <div className="grid gap-x-8 lg:grid-cols-4 xl:grid-cols-[340px_repeat(4,minmax(0,1fr))] xl:gap-x-12">
          <div className="flex flex-col gap-5 pb-8 lg:col-span-4 lg:mb-14 lg:pb-0 xl:col-span-1 xl:mb-0">
            <Logo tone="dark" />
            <p className="max-w-xs text-sm leading-7 text-ink-invert-soft">
              {t("footer.description")}
            </p>

            <div className="mt-auto flex flex-col gap-3">
              <p className={FOOTER_HEADING}>{t("footer.social")}</p>
              <ul className="flex flex-wrap gap-2">
                {socialProfiles.map((profile) => {
                  const Icon = SOCIAL_ICONS[profile.key];
                  return (
                    <li key={profile.key}>
                      <SocialLink href={profile.href} label={profile.label}>
                        <Icon className="size-4" />
                      </SocialLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <FooterSection title={t("navigation")}>
            <FooterLinkList items={navigationItems} />
          </FooterSection>

          <FooterSection title={t("footer.resources")}>
            <FooterLinkList items={resourceItems} />
          </FooterSection>

          <FooterSection title={t("properties")}>
            <PropertyLinks
              propertyItems={propertyItems}
              listingItems={listingItems}
              listingTypeLabel={t("listingType")}
            />
          </FooterSection>

          <FooterSection title={t("contact")}>
            <ContactDetails directionsLabel={t("footer.directions")} />
          </FooterSection>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-line-dark pt-6 lg:mt-16 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="flex max-w-2xl flex-col gap-1 text-xs leading-5 text-ink-invert-muted">
            <p>© {year} {siteConfig.legalName}. {t("footer.rightsReserved")}</p>
            <p>{t("footer.ownership", { brand: siteConfig.name, owner: siteConfig.owner.name })}</p>
            <p className="tabular">{t("footer.vat", { value: siteConfig.legal.voen })}</p>
          </div>

          <ul className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 lg:shrink-0">
            {legalNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-xs text-xs text-ink-invert-muted transition-colors hover:text-ink-invert focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:min-h-0 lg:py-1"
                >
                  {t(LEGAL_KEY_BY_HREF[item.href])}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
