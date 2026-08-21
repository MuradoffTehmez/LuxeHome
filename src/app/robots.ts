import type { MetadataRoute } from "next";
import { isStaging, siteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  // Staging prod-un birə-bir dublikatıdır — indekslənsə əsas domenin sıralamasına zərər verir
  if (isStaging()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

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
