import type { Metadata } from "next";
import { isStaging, siteConfig, siteUrl } from "@/config/site";
import type { LocalBusinessProfile } from "@/lib/local-business";
import {
  DEFAULT_LOCALE,
  LOCALES,
  PROPERTY_STATUSES,
  TRANSLATION_STATUSES,
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
  robotsOverride?: { index: boolean; follow: boolean };
  managedEntity?: { type: string; id: string };
  /** Yalnız real və qarşılıqlı dil variantları. Verilməzsə bütün statik locale-lər istifadə olunur. */
  alternateLocales?: Locale[];
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
  robotsOverride,
  alternateLocales,
}: PageMetaInput): Metadata {
  const localizedPath = localizePath(path, locale);
  const url = siteUrl(localizedPath);
  // `null` qeyri-ekvivalent faceted səhifədə canonical-ın qəsdən buraxılmasıdır.
  const canonicalSource = canonicalPath === undefined ? path : canonicalPath;
  const canonicalIsAbsolute = typeof canonicalSource === "string" && /^https:\/\//i.test(canonicalSource);
  const canonicalUrl =
    canonicalSource === null ? null : canonicalIsAbsolute ? canonicalSource : siteUrl(localizePath(canonicalSource, locale));
  const languageAlternates = canonicalSource === null || canonicalIsAbsolute
    ? undefined
    : {
        ...Object.fromEntries(
          (alternateLocales ?? Object.values(LOCALES)).map((code) => [code, siteUrl(localizePath(canonicalSource, code))]),
        ),
        ...((alternateLocales ?? Object.values(LOCALES)).includes(DEFAULT_LOCALE)
          ? { "x-default": siteUrl(localizePath(canonicalSource, DEFAULT_LOCALE)) }
          : {}),
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
    robotsOverride
      ? {
          index: robotsOverride.index,
          follow: robotsOverride.follow,
          googleBot: { index: robotsOverride.index, follow: robotsOverride.follow, "max-image-preview": "large" },
        }
      : effectivePolicy === "index"
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

/**
 * Admin `SeoMetadata` override-i ilə avtomatik generatoru birləşdirir.
 * Entity-ə xas qeyd tapılmasa PAGE + route path fallback-i yoxlanılır.
 */
export async function buildManagedMetadata(input: PageMetaInput): Promise<Metadata> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const refs = [
      ...(input.managedEntity ? [input.managedEntity] : []),
      { type: "PAGE", id: input.path.split("?", 1)[0] },
    ];
    const overrides = await prisma.seoMetadata.findMany({
      where: {
        locale: input.locale ?? DEFAULT_LOCALE,
        OR: refs.map((ref) => ({ entityType: ref.type, entityId: ref.id })),
      },
      take: 2,
    });
    const override = refs.map((ref) => overrides.find((item) => item.entityType === ref.type && item.entityId === ref.id)).find(Boolean);
    let alternateLocales = input.alternateLocales;
    let missingTranslation = false;
    if (input.managedEntity && alternateLocales === undefined) {
      const translatableTypes = new Set(["PROPERTY", "PROJECT", "SERVICE", "BLOG_POST", "KNOWLEDGE_ARTICLE"]);
      if (translatableTypes.has(input.managedEntity.type)) {
        const translations = await prisma.contentTranslation.findMany({
          where: { entityType: input.managedEntity.type, entityId: input.managedEntity.id, status: TRANSLATION_STATUSES.PUBLISHED },
          select: { locale: true },
        });
        alternateLocales = [DEFAULT_LOCALE, ...translations.map((item) => item.locale as Locale)]
          .filter((value, index, values): value is Locale => Object.values(LOCALES).includes(value) && values.indexOf(value) === index);
        missingTranslation = (input.locale ?? DEFAULT_LOCALE) !== DEFAULT_LOCALE && !alternateLocales.includes(input.locale ?? DEFAULT_LOCALE);
      } else if (["AGENT", "AGENCY"].includes(input.managedEntity.type)) {
        alternateLocales = [DEFAULT_LOCALE];
        missingTranslation = (input.locale ?? DEFAULT_LOCALE) !== DEFAULT_LOCALE;
      }
    }
    const resolvedInput: PageMetaInput = {
      ...input,
      alternateLocales,
      ...(missingTranslation ? { indexPolicy: "noindex-follow" as const } : {}),
      ...(override ? {
        title: override.title || input.title,
        description: override.description || input.description,
        canonicalPath: override.canonical || input.canonicalPath,
        ogTitle: override.ogTitle || input.ogTitle,
        ogDescription: override.ogDescription || input.ogDescription,
        ogImage: override.ogImage || input.ogImage,
        robotsOverride: missingTranslation ? { index: false, follow: true } : { index: override.robotsIndex, follow: override.robotsFollow },
      } : {}),
    };
    return buildMetadata(resolvedInput);
  } catch {
    // Miqrasiya deploy-dan əvvəl metadata generatoru public səhifəni 500 etməməlidir.
    return buildMetadata(input);
  }
}

// ---------------------------------------------------------------------------
// STRUKTUR DATA (JSON-LD)
// ---------------------------------------------------------------------------

/**
 * Şirkət — yalnız təsdiqlənmiş NAP məlumatı.
 *
 * Baza `siteConfig`-dədir. `profile` paneldən (`Parametrlər` + `SERP → Local SEO`)
 * gələn və redaktor tərəfindən təsdiqlənmiş əlavələri daşıyır: koordinat, iş
 * saatları, xidmət bölgələri, rəsmi sosial profillər. **Profil verilməyəndə sxem
 * heç bir əlavə sahə qazanmır** — uydurma `geo` və ya `openingHours` göndərmək
 * Local SEO-da zərərlidir, ona görə boş dəyər sadəcə buraxılır.
 */
export function organizationSchema(profile?: LocalBusinessProfile | null) {
  const geo = profile?.latitude != null && profile.longitude != null
    ? { geo: { "@type": "GeoCoordinates", latitude: profile.latitude, longitude: profile.longitude } }
    : {};
  const openingHours = profile?.openingHours.length
    ? { openingHours: profile.openingHours }
    : {};
  const hasMap = profile?.googleMapsUrl ? { hasMap: profile.googleMapsUrl } : {};
  const areaServed = profile?.serviceAreas.length
    ? { areaServed: profile.serviceAreas.map((name) => ({ "@type": "AdministrativeArea", name })) }
    : { areaServed: { "@type": "Country", name: "Azərbaycan" } };
  const sameAs = [siteConfig.instagramUrl, ...(profile?.socialProfiles ?? [])]
    .filter((value, index, list) => value && list.indexOf(value) === index);

  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness", "RealEstateAgent"],
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
    sameAs,
    ...areaServed,
    ...geo,
    ...openingHours,
    ...hasMap,
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
  images: Array<string | { url: string; width?: number | null; height?: number | null; caption?: string | null }>;
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
  propertyType?: string | null;
  agent?: { name: string; slug: string; agency?: { name: string; slug: string } | null } | null;
};

/** Əmlak elanı: listing + təsvir edilən obyekt + kommersiya təklifi. */
export function propertySchema(property: PropertySchemaInput, locale: Locale = DEFAULT_LOCALE) {
  const availability =
    property.status === PROPERTY_STATUSES.SOLD || property.status === PROPERTY_STATUSES.RENTED
      ? "https://schema.org/SoldOut"
      : property.status === "RESERVED"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock";

  const url = siteUrl(localizePath(`/emlaklar/${property.slug}`, locale));
  const images = property.images.map((image) => typeof image === "string" ? image : {
    "@type": "ImageObject",
    contentUrl: image.url,
    width: image.width,
    height: image.height,
    caption: image.caption,
    representativeOfPage: true,
  });
  const residenceType = property.propertyType?.toLocaleLowerCase("az-AZ").includes("villa")
    ? "House"
    : property.propertyType?.toLocaleLowerCase("az-AZ").includes("mənzil")
      ? "Apartment"
      : "Residence";
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${url}#listing`,
    name: property.title,
    description: property.description.slice(0, 400),
    image: images,
    url,
    about: {
      "@type": residenceType,
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
      seller: property.agent
        ? { "@id": `${siteUrl(localizePath(`/agentler/${property.agent.slug}`, locale))}#person` }
        : { "@id": `${siteUrl()}/#organization` },
    },
    broker: property.agent ? {
      "@type": "Person",
      "@id": `${siteUrl(localizePath(`/agentler/${property.agent.slug}`, locale))}#person`,
      name: property.agent.name,
      worksFor: property.agent.agency
        ? { "@id": `${siteUrl(localizePath(`/agentlikler/${property.agent.agency.slug}`, locale))}#agency` }
        : { "@id": `${siteUrl()}/#organization` },
    } : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export function webPageSchema(input: { path: string; name: string; description: string }, locale: Locale = DEFAULT_LOCALE) {
  const url = siteUrl(localizePath(input.path, locale));
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: input.name,
    description: input.description,
    isPartOf: { "@id": `${siteUrl()}/#website` },
    about: { "@id": `${siteUrl()}/#organization` },
    inLanguage: { az: "az-AZ", en: "en-US", ru: "ru-RU" }[locale],
  };
}

export function agentSchema(agent: {
  name: string;
  slug: string;
  roleTitle?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  languages?: string[];
  serviceAreas?: string[];
  agency?: { name: string; slug: string } | null;
  rating?: number | null;
  reviewCount?: number;
}, locale: Locale = DEFAULT_LOCALE) {
  const url = siteUrl(localizePath(`/agentler/${agent.slug}`, locale));
  const personId = `${url}#person`;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#profile`,
    url,
    mainEntity: {
      "@type": "Person",
      "@id": personId,
      name: agent.name,
      jobTitle: agent.roleTitle,
      description: agent.bio,
      image: agent.avatarUrl,
      telephone: agent.phone,
      email: agent.email,
      knowsLanguage: agent.languages,
      areaServed: agent.serviceAreas,
      worksFor: agent.agency
        ? { "@id": `${siteUrl(localizePath(`/agentlikler/${agent.agency.slug}`, locale))}#agency`, name: agent.agency.name }
        : { "@id": `${siteUrl()}/#organization` },
      aggregateRating: agent.rating && agent.reviewCount
        ? { "@type": "AggregateRating", ratingValue: agent.rating, reviewCount: agent.reviewCount }
        : undefined,
    },
    isPartOf: { "@id": `${siteUrl()}/#website` },
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
