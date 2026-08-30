import type { Metadata } from "next";
import { isStaging, siteConfig, siteUrl } from "@/config/site";
import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
} from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";

// ---------------------------------------------------------------------------
// METADATA KÖMƏKÇİLƏRİ
// ---------------------------------------------------------------------------

export type IndexPolicy = "index" | "noindex-follow" | "private";

export function truncateAtWord(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const available = normalized.slice(0, Math.max(0, maxLength - 1));
  const boundary = available.lastIndexOf(" ");
  const text = boundary > 0 ? available.slice(0, boundary) : available;
  return `${text.trimEnd()}…`;
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string;
  /** @deprecated Yeni kodda `indexPolicy` istifadə olunmalıdır. */
  noIndex?: boolean;
  indexPolicy?: IndexPolicy;
  locale?: Locale;
  /** Səhifəyə xas açar sözlər — verilməzsə kök layout-dakı ümumi siyahı qüvvədə qalır. */
  keywords?: string[];
  /** Duplikat kontent halında fərqli canonical ünvana işarə etmək üçün — adətən boş qalır. */
  canonicalPath?: string | null;
  /** Sosial paylaşımda görünən başlıq/təsvir/şəkil — boş qalsa əsas dəyərlər istifadə olunur. */
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
};

/** Səhifə üçün tam metadata (canonical + Open Graph + Twitter) qurur. */
export function buildMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  publishedTime,
  noIndex = false,
  indexPolicy = "index",
  locale = DEFAULT_LOCALE,
  keywords,
  canonicalPath,
  ogTitle,
  ogDescription,
  ogImage,
}: PageMetaInput): Metadata {
  const localizedPath = localizePath(path, locale);
  const url = siteUrl(localizedPath);
  // `null` qeyri-ekvivalent faceted səhifədə canonical-ın qəsdən buraxılmasıdır.
  const canonicalSource = canonicalPath === undefined ? path : canonicalPath;
  const canonicalUrl =
    canonicalSource === null ? null : siteUrl(localizePath(canonicalSource, locale));
  const languageAlternates = canonicalSource === null
    ? undefined
    : {
        ...Object.fromEntries(
          Object.values(LOCALES).map((code) => [code, siteUrl(localizePath(canonicalSource, code))]),
        ),
        "x-default": siteUrl(localizePath(canonicalSource, DEFAULT_LOCALE)),
      };
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;
  const resolvedOgImage = ogImage || image;
  const images = resolvedOgImage
    ? [
        {
          url: resolvedOgImage.startsWith("http") ? resolvedOgImage : siteUrl(resolvedOgImage),
          width: 1200,
          height: 630,
          alt: resolvedOgTitle,
        },
      ]
    : [{ url: siteUrl("/og-default.png"), width: 1200, height: 630, alt: resolvedOgTitle }];

  const effectivePolicy: IndexPolicy =
    isStaging() || indexPolicy === "private"
      ? "private"
      : noIndex || indexPolicy === "noindex-follow"
        ? "noindex-follow"
        : "index";
  const robots: Metadata["robots"] =
    effectivePolicy === "index"
      ? undefined
      : effectivePolicy === "noindex-follow"
        ? {
            index: false,
            follow: true,
            googleBot: { index: false, follow: true, "max-image-preview": "large" },
          }
        : { index: false, follow: false, googleBot: { index: false, follow: false } };
  const ogLocales: Record<Locale, string> = {
    az: "az_AZ",
    ru: "ru_RU",
    en: "en_US",
  };

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    ...(canonicalUrl
      ? { alternates: { canonical: canonicalUrl, ...(languageAlternates ? { languages: languageAlternates } : {}) } }
      : {}),
    robots,
    openGraph: {
      type,
      locale: ogLocales[locale],
      url,
      siteName: siteConfig.name,
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      images,
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      images: [images[0].url],
    },
  };
}

// ---------------------------------------------------------------------------
// STRUKTUR DATA (JSON-LD)
// ---------------------------------------------------------------------------

/** Şirkət — yalnız təsdiqlənmiş, mərkəzi konfiqurasiyadan gələn NAP məlumatı. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${siteUrl()}/#organization`,
    name: siteConfig.fullName,
    alternateName: siteConfig.name,
    url: siteUrl(),
    telephone: siteConfig.phone,
    email: siteConfig.email,
    slogan: siteConfig.slogan,
    description: siteConfig.description,
    image: siteUrl("/logo-full.png"),
    logo: siteUrl("/logo-mark.png"),
    taxID: siteConfig.legal.voen,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address,
      addressLocality: "Bakı",
      addressCountry: "AZ",
    },
    sameAs: [siteConfig.instagramUrl],
    areaServed: { "@type": "Country", name: "Azərbaycan" },
    // Sayt, brend və marka hüquqlarının sahibi
    owner: { "@type": "Person", name: siteConfig.owner.name },
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
      slogan: siteConfig.slogan,
    },
  };
}

/**
 * WebSite + SearchAction.
 *
 * Google-a saytın daxili axtarışını "sitelinks search box" kimi göstərməyə
 * icazə verir — brendli axtarışlarda birbaşa axtarış qutusu görünə bilər.
 */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    url: siteUrl(),
    name: siteConfig.name,
    publisher: { "@id": `${siteUrl()}/#organization` },
    inLanguage: "az-AZ",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl(localizePath("/emlaklar", DEFAULT_LOCALE))}?axtaris={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

type BreadcrumbItem = { name: string; path: string };

export function breadcrumbSchema(items: BreadcrumbItem[], locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: siteUrl(localizePath(item.path, locale)),
    })),
  };
}

type PropertySchemaInput = {
  title: string;
  description: string;
  slug: string;
  price: number;
  currency: string;
  listingType: string;
  images: string[];
  city: string;
  district?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  area?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  status: string;
};

/** Əmlak elanı: listing + təsvir edilən obyekt + kommersiya təklifi. */
export function propertySchema(property: PropertySchemaInput, locale: Locale = DEFAULT_LOCALE) {
  const availability =
    property.status === "SOLD" || property.status === "RENTED"
      ? "https://schema.org/SoldOut"
      : property.status === "RESERVED"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock";

  const url = siteUrl(localizePath(`/emlaklar/${property.slug}`, locale));
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${url}#listing`,
    name: property.title,
    description: property.description.slice(0, 400),
    image: property.images,
    url,
    about: {
      "@type": "Residence",
      "@id": `${url}#property`,
      name: property.title,
      floorSize: property.area
        ? { "@type": "QuantitativeValue", value: property.area, unitCode: "MTK" }
        : undefined,
      numberOfRooms: property.rooms,
      numberOfBedrooms: property.bedrooms,
      numberOfBathroomsTotal: property.bathrooms,
      address: {
        "@type": "PostalAddress",
        streetAddress: property.address,
        addressLocality: property.city,
        addressRegion: property.district,
        addressCountry: "AZ",
      },
      geo:
        property.latitude != null && property.longitude != null
          ? {
              "@type": "GeoCoordinates",
              latitude: property.latitude,
              longitude: property.longitude,
            }
          : undefined,
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency,
      availability,
      url,
      seller: { "@id": `${siteUrl()}/#organization` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

type ArticleSchemaInput = {
  title: string;
  description: string;
  slug: string;
  image?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  authorName?: string | null;
};

export function articleSchema(post: ArticleSchemaInput, locale: Locale = DEFAULT_LOCALE) {
  const url = siteUrl(localizePath(`/blog/${post.slug}`, locale));
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.description,
    image: post.image ? [post.image] : undefined,
    url,
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
    dateModified: post.updatedAt
      ? new Date(post.updatedAt).toISOString()
      : undefined,
    author: {
      "@type": "Organization",
      name: post.authorName || siteConfig.legalName,
    },
    publisher: {
      "@id": `${siteUrl()}/#organization`,
      logo: { "@type": "ImageObject", url: siteUrl("/logo-full.png") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: { az: "az-AZ", en: "en-US", ru: "ru-RU" }[locale],
  };
}

/**
 * Bilik Mərkəzi bələdçisi.
 *
 * `BlogPosting` deyil, `Article`: bələdçi xəbər axını deyil, köhnəlməyən
 * təlimatdır. `articleSchema()` bloq marşrutuna sabitlənib, ona görə ayrıca
 * generator saxlanılır — ortaq funksiyaya sıxışdırmaq marşrut parametri əlavə
 * etməyi tələb edərdi və hər iki çağırış yerini oxunmaz edərdi.
 */
export function knowledgeArticleSchema(
  article: {
    title: string;
    description: string;
    slug: string;
    image?: string | null;
    publishedAt?: Date | string | null;
    updatedAt?: Date | string | null;
    authorName?: string | null;
    section?: string | null;
  },
  locale: Locale = DEFAULT_LOCALE,
) {
  const url = siteUrl(localizePath(`/bilik-merkezi/${article.slug}`, locale));
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.description,
    image: article.image ? [article.image] : undefined,
    url,
    articleSection: article.section || undefined,
    datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
    dateModified: article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
    author: { "@type": "Organization", name: article.authorName || siteConfig.legalName },
    publisher: {
      "@id": `${siteUrl()}/#organization`,
      logo: { "@type": "ImageObject", url: siteUrl("/logo-full.png") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: { az: "az-AZ", en: "en-US", ru: "ru-RU" }[locale],
  };
}

/** Lüğət termini — `DefinedTerm`, lüğətin özü isə `DefinedTermSet`. */
export function definedTermSchema(
  term: { term: string; slug: string; definition: string },
  locale: Locale = DEFAULT_LOCALE,
) {
  const url = siteUrl(localizePath(`/lugat/${term.slug}`, locale));
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": `${url}#term`,
    name: term.term,
    description: term.definition,
    url,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      "@id": `${siteUrl(localizePath("/lugat", locale))}#glossary`,
      name: "Daşınmaz əmlak lüğəti",
      url: siteUrl(localizePath("/lugat", locale)),
    },
  };
}

export function definedTermSetSchema(
  terms: Array<{ term: string; slug: string }>,
  locale: Locale = DEFAULT_LOCALE,
) {
  const url = siteUrl(localizePath("/lugat", locale));
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${url}#glossary`,
    url,
    name: "Daşınmaz əmlak lüğəti",
    hasDefinedTerm: terms.slice(0, 100).map((item) => ({
      "@type": "DefinedTerm",
      name: item.term,
      url: siteUrl(localizePath(`/lugat/${item.slug}`, locale)),
    })),
  };
}

export function serviceSchema(service: {
  title: string;
  description: string;
  slug: string;
}, locale: Locale = DEFAULT_LOCALE) {
  const url = siteUrl(localizePath(`/xidmetler/${service.slug}`, locale));
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: service.title,
    description: service.description.slice(0, 400),
    url,
    provider: { "@id": `${siteUrl()}/#organization` },
    areaServed: { "@type": "Country", name: "Azərbaycan" },
  };
}

/** Siyahı səhifələri üçün ItemList — axtarış nəticələrində zəngin siyahı görünüşünə kömək edir. */
export function itemListSchema(
  items: { name: string; path: string }[],
  locale: Locale = DEFAULT_LOCALE,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: siteUrl(localizePath(item.path, locale)),
    })),
  };
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function cleanJsonLd(value: unknown): JsonValue | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) {
    const items = value.map(cleanJsonLd).filter((item): item is JsonValue => item !== undefined);
    return items.length > 0 ? items : undefined;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, cleanJsonLd(item)] as const)
      .filter((entry): entry is readonly [string, JsonValue] => entry[1] !== undefined);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return undefined;
}

export function faqSchema(
  items: Array<{ question: string; answer: string }> | readonly { question: string; answer: string }[],
  path: string,
  locale: Locale = DEFAULT_LOCALE,
) {
  const url = siteUrl(localizePath(path, locale));
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function agencySchema(agency: {
  name: string;
  slug: string;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  logoUrl?: string | null;
}, locale: Locale = DEFAULT_LOCALE) {
  const url = siteUrl(localizePath(`/agentlikler/${agency.slug}`, locale));
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${url}#agency`,
    name: agency.name,
    description: agency.description,
    url,
    telephone: agency.phone,
    image: agency.logoUrl,
    address: agency.address
      ? { "@type": "PostalAddress", streetAddress: agency.address, addressCountry: "AZ" }
      : undefined,
    sameAs: agency.website ? [agency.website] : undefined,
    parentOrganization: { "@id": `${siteUrl()}/#organization` },
  };
}

/**
 * Tərəfdaş şirkəti.
 *
 * `Organization` seçilib, `RealEstateAgent` yox: tərəfdaş bank, texnologiya və ya
 * media şirkəti də ola bilər, ona görə daha dar tip yanlış iddia olardı.
 * `cleanJsonLd()` boş sahələri atır — məlumat yoxdursa schema-da uydurulmur.
 */
export function partnerSchema(partner: {
  name: string;
  slug: string;
  legalName?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}, locale: Locale = DEFAULT_LOCALE) {
  const url = siteUrl(localizePath(`/terefdaslar/${partner.slug}`, locale));
  const hasAddress = Boolean(partner.address || partner.city || partner.country);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}#partner`,
    name: partner.name,
    legalName: partner.legalName,
    description: partner.description ? truncateAtWord(partner.description, 400) : undefined,
    url,
    logo: partner.logoUrl,
    image: partner.logoUrl,
    email: partner.email,
    telephone: partner.phone,
    address: hasAddress
      ? {
          "@type": "PostalAddress",
          streetAddress: partner.address,
          addressLocality: partner.city,
          addressCountry: partner.country,
        }
      : undefined,
    // Rəsmi sayt `sameAs`-dədir: bu, tərəfdaşın kanonik kimliyini göstərir.
    sameAs: partner.websiteUrl ? [partner.websiteUrl] : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

/**
 * JSON-LD-ni HTML `<script>` kontekstinə təhlükəsiz serialize edir.
 * Təmizləmə schema-da boş massiv/string və `undefined` yaranmasının qarşısını alır.
 */
export function serializeJsonLd(schema: object): string {
  return JSON.stringify(cleanJsonLd(schema) ?? {}).replace(
    /[<>&\u2028\u2029]/g,
    (character) =>
      ({
        "<": "\\u003c",
        ">": "\\u003e",
        "&": "\\u0026",
        "\u2028": "\\u2028",
        "\u2029": "\\u2029",
      })[character] ?? character,
  );
}

/** JSON-LD blokunu səhifəyə əlavə etmək üçün hazır props qaytarır. */
export function jsonLd(schema: object) {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: { __html: serializeJsonLd(schema) },
  };
}
