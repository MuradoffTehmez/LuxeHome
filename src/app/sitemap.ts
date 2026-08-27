import type { MetadataRoute } from "next";
import { PRODUCTION_SITE_URL } from "@/config/site";
import { LOCALES, PROPERTY_STATUSES, type Locale } from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";
import { getCachedSitemapEntries } from "@/lib/public-cache";

// Sitemap D1-dən oxuyur — build zamanı deyil, sorğu anında qurulur.
export const dynamic = "force-dynamic";

type CanonicalEntity = {
  slug: string;
  updatedAt: Date;
  noIndex: boolean;
  canonicalUrl: string | null;
};

export type SitemapSource = {
  properties: Array<CanonicalEntity & { status: string }>;
  projects: CanonicalEntity[];
  services: CanonicalEntity[];
  posts: CanonicalEntity[];
  agencies: Array<{ slug: string; updatedAt: Date }>;
  partners: Array<{ slug: string; updatedAt: Date }>;
  landings: Array<{ path: string; updatedAt?: Date }>;
};

function absoluteUrl(path: string): string {
  return new URL(path, `${PRODUCTION_SITE_URL}/`).toString();
}

function isSelfCanonical(item: { noIndex: boolean; canonicalUrl: string | null }) {
  return !item.noIndex && !item.canonicalUrl;
}

function localizedEntries(
  path: string,
  entry: Omit<MetadataRoute.Sitemap[number], "url">,
): MetadataRoute.Sitemap {
  return Object.values(LOCALES).map((locale) => ({
    ...entry,
    url: absoluteUrl(localizePath(path, locale as Locale)),
  }));
}

export function buildSitemap(source: SitemapSource): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    ...localizedEntries("/", { changeFrequency: "daily", priority: 1 }),
    ...localizedEntries("/emlaklar", { changeFrequency: "daily", priority: 0.9 }),
    ...localizedEntries("/layiheler", { changeFrequency: "weekly", priority: 0.8 }),
    ...localizedEntries("/agentlikler", { changeFrequency: "weekly", priority: 0.7 }),
    ...localizedEntries("/terefdaslar", { changeFrequency: "weekly", priority: 0.6 }),
    ...localizedEntries("/xidmetler", { changeFrequency: "monthly", priority: 0.7 }),
    ...localizedEntries("/haqqimizda", { changeFrequency: "monthly", priority: 0.6 }),
    ...localizedEntries("/suallar", { changeFrequency: "monthly", priority: 0.6 }),
    ...localizedEntries("/blog", { changeFrequency: "weekly", priority: 0.6 }),
    ...localizedEntries("/elaqe", { changeFrequency: "yearly", priority: 0.5 }),
    ...localizedEntries("/mexfilik-siyaseti", { changeFrequency: "yearly", priority: 0.2 }),
    ...localizedEntries("/istifade-sertleri", { changeFrequency: "yearly", priority: 0.2 }),
    ...localizedEntries("/cookie-siyaseti", { changeFrequency: "yearly", priority: 0.2 }),
  ];

  return [
    ...staticEntries,
    ...source.properties
      .filter(
        (item) =>
          isSelfCanonical(item) &&
          (item.status === PROPERTY_STATUSES.PUBLISHED ||
            item.status === PROPERTY_STATUSES.RESERVED),
      )
      .flatMap((item) => localizedEntries(`/emlaklar/${item.slug}`, {
        lastModified: item.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ...source.projects.filter(isSelfCanonical).flatMap((item) => localizedEntries(`/layiheler/${item.slug}`, {
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...source.services.filter(isSelfCanonical).flatMap((item) => localizedEntries(`/xidmetler/${item.slug}`, {
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...source.posts.filter(isSelfCanonical).flatMap((item) => localizedEntries(`/blog/${item.slug}`, {
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...source.agencies.flatMap((item) => localizedEntries(`/agentlikler/${item.slug}`, {
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    // Yalnız `getSitemapPartners()`-dən gələnlər — sorğu artıq `ACTIVE` +
    // `showPublicly` + müddəti bitməmiş şərtini tətbiq edir.
    ...source.partners.flatMap((item) => localizedEntries(`/terefdaslar/${item.slug}`, {
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...source.landings.flatMap((item) => localizedEntries(item.path, {
      ...(item.updatedAt ? { lastModified: item.updatedAt } : {}),
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap(await getCachedSitemapEntries());
}
