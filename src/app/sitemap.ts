import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/queries";
import { siteUrl } from "@/config/site";

// Sitemap D1-dən oxuyur — build zamanı deyil, sorğu anında qurulur.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { properties, projects, services, posts } = await getSitemapEntries();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: siteUrl("/emlaklar"), changeFrequency: "daily", priority: 0.9 },
    { url: siteUrl("/layiheler"), changeFrequency: "weekly", priority: 0.8 },
    { url: siteUrl("/xidmetler"), changeFrequency: "monthly", priority: 0.7 },
    { url: siteUrl("/haqqimizda"), changeFrequency: "monthly", priority: 0.6 },
    { url: siteUrl("/blog"), changeFrequency: "weekly", priority: 0.6 },
    { url: siteUrl("/elaqe"), changeFrequency: "yearly", priority: 0.5 },
    { url: siteUrl("/mexfilik-siyaseti"), changeFrequency: "yearly", priority: 0.2 },
    { url: siteUrl("/istifade-sertleri"), changeFrequency: "yearly", priority: 0.2 },
    { url: siteUrl("/cookie-siyaseti"), changeFrequency: "yearly", priority: 0.2 },
  ];

  return [
    ...staticEntries,
    ...properties.map((item) => ({
      url: siteUrl(`/emlaklar/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...projects.map((item) => ({
      url: siteUrl(`/layiheler/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...services.map((item) => ({
      url: siteUrl(`/xidmetler/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...posts.map((item) => ({
      url: siteUrl(`/blog/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
