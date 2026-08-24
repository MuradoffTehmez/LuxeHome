import type { MetadataRoute } from "next";
import { PRODUCTION_SITE_URL } from "@/config/site";
import { PROPERTY_STATUSES } from "@/lib/constants";
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
  landings: Array<{ path: string; updatedAt?: Date }>;
};

function absoluteUrl(path: string): string {
  return new URL(path, `${PRODUCTION_SITE_URL}/`).toString();
}

function isSelfCanonical(item: { noIndex: boolean; canonicalUrl: string | null }) {
  return !item.noIndex && !item.canonicalUrl;
}

export function buildSitemap(source: SitemapSource): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/emlaklar"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/layiheler"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/agentlikler"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/xidmetler"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/haqqimizda"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/suallar"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/elaqe"), changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl("/mexfilik-siyaseti"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/istifade-sertleri"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/cookie-siyaseti"), changeFrequency: "yearly", priority: 0.2 },
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
      .map((item) => ({
        url: absoluteUrl(`/emlaklar/${item.slug}`),
        lastModified: item.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ...source.projects.filter(isSelfCanonical).map((item) => ({
      url: absoluteUrl(`/layiheler/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...source.services.filter(isSelfCanonical).map((item) => ({
      url: absoluteUrl(`/xidmetler/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...source.posts.filter(isSelfCanonical).map((item) => ({
      url: absoluteUrl(`/blog/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...source.agencies.map((item) => ({
      url: absoluteUrl(`/agentlikler/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...source.landings.map((item) => ({
      url: absoluteUrl(item.path),
      ...(item.updatedAt ? { lastModified: item.updatedAt } : {}),
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap(await getCachedSitemapEntries());
}
