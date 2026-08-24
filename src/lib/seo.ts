import type { Metadata } from "next";
import { isStaging, siteConfig, siteUrl } from "@/config/site";
import {
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/constants";

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
  const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const localizedPath = path === "/" ? `${localePrefix}/` : `${localePrefix}${path}`;
  const url = siteUrl(localizedPath);
  // RU/EN DB məzmunu hələ lokallaşdırılmadığı üçün canonical həmişə AZ route-udur.
  // `null` qeyri-ekvivalent faceted səhifədə canonical-ın qəsdən buraxılmasıdır.
  const canonicalUrl =
    canonicalPath === null ? null : siteUrl(canonicalPath === undefined ? path : canonicalPath);
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
      : noIndex || locale !== DEFAULT_LOCALE || indexPolicy === "noindex-follow"
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
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
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
        urlTemplate: `${siteUrl("/emlaklar")}?axtaris={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

type BreadcrumbItem = { name: string; path: string };

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: siteUrl(item.path),
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
export function propertySchema(property: PropertySchemaInput) {
  const availability =
    property.status === "SOLD" || property.status === "RENTED"
      ? "https://schema.org/SoldOut"
      : property.status === "RESERVED"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock";

  const url = siteUrl(`/emlaklar/${property.slug}`);
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

export function articleSchema(post: ArticleSchemaInput) {
  const url = siteUrl(`/blog/${post.slug}`);
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
    inLanguage: "az-AZ",
  };
}

export function serviceSchema(service: {
  title: string;
  description: string;
  slug: string;
}) {
  const url = siteUrl(`/xidmetler/${service.slug}`);
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
export function itemListSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: siteUrl(item.path),
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
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl(path)}#faq`,
    url: siteUrl(path),
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
}) {
  const url = siteUrl(`/agentlikler/${agency.slug}`);
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
