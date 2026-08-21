import type { Metadata } from "next";
import { isStaging, siteConfig, siteUrl } from "@/config/site";
import { LISTING_TYPES } from "@/lib/constants";

// ---------------------------------------------------------------------------
// METADATA KÖMƏKÇİLƏRİ
// ---------------------------------------------------------------------------

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string;
  noIndex?: boolean;
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
}: PageMetaInput): Metadata {
  const url = siteUrl(path);
  const images = image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    // Staging heç bir səhifəsi ilə indeksə düşməməlidir
    robots: noIndex || isStaging() ? { index: false, follow: false } : undefined,
    openGraph: {
      type,
      locale: "az_AZ",
      url,
      siteName: siteConfig.name,
      title,
      description,
      images,
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// STRUKTUR DATA (JSON-LD)
// ---------------------------------------------------------------------------

/** Şirkət — RealEstateAgent (LocalBusiness alt tipi). */
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
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address,
      addressLocality: "Bakı",
      addressCountry: "AZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.geo.latitude,
      longitude: siteConfig.geo.longitude,
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

/**
 * Əmlak üçün struktur data.
 * Satış/kirayə elanı olduğu üçün `Residence` + `Offer` kombinasiyası istifadə olunur.
 */
export function propertySchema(property: PropertySchemaInput) {
  const availability =
    property.status === "SOLD" || property.status === "RENTED"
      ? "https://schema.org/SoldOut"
      : property.status === "RESERVED"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: property.title,
    description: property.description.slice(0, 400),
    image: property.images,
    url: siteUrl(`/emlaklar/${property.slug}`),
    category:
      property.listingType === LISTING_TYPES.SALE
        ? "Daşınmaz əmlak — satış"
        : "Daşınmaz əmlak — icarə",
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency,
      availability,
      url: siteUrl(`/emlaklar/${property.slug}`),
      seller: { "@id": `${siteUrl()}/#organization` },
    },
    additionalProperty: [
      property.area && {
        "@type": "PropertyValue",
        name: "Sahə",
        value: property.area,
        unitCode: "MTK",
      },
      property.rooms && {
        "@type": "PropertyValue",
        name: "Otaq sayı",
        value: property.rooms,
      },
      property.bedrooms && {
        "@type": "PropertyValue",
        name: "Yataq otağı",
        value: property.bedrooms,
      },
      property.bathrooms && {
        "@type": "PropertyValue",
        name: "Sanitar qovşaq",
        value: property.bathrooms,
      },
    ].filter(Boolean),
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
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: post.image ? [post.image] : undefined,
    url: siteUrl(`/blog/${post.slug}`),
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
    publisher: { "@id": `${siteUrl()}/#organization` },
  };
}

export function serviceSchema(service: {
  title: string;
  description: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description.slice(0, 400),
    url: siteUrl(`/xidmetler/${service.slug}`),
    provider: { "@id": `${siteUrl()}/#organization` },
    areaServed: { "@type": "Country", name: "Azərbaycan" },
  };
}

/** JSON-LD blokunu səhifəyə əlavə etmək üçün hazır props qaytarır. */
export function jsonLd(schema: object) {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: { __html: JSON.stringify(schema) },
  };
}
