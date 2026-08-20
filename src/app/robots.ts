import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // İdarə paneli və favorit siyahısı indeksləşdirilmir
      disallow: ["/admin", "/admin/", "/giris", "/favoritler"],
    },
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl("/"),
  };
}
