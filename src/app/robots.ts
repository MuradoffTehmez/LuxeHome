import type { MetadataRoute } from "next";
import { isStaging, siteUrl } from "@/config/site";

export function buildRobots(staging: boolean): MetadataRoute.Robots {
  // Staging prod-un birə-bir dublikatıdır — indekslənsə əsas domenin sıralamasına zərər verir
  if (staging) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Həqiqətən private admin/staff route-ları crawl edilmir. Public utility route-larda
      // robots meta görünməlidir, ona görə onlar burada bloklanmır.
      disallow: ["/admin", "/admin/", "/giris"],
    },
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl("/"),
  };
}

export default function robots(): MetadataRoute.Robots {
  return buildRobots(isStaging());
}
