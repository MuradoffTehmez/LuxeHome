import type { MetadataRoute } from "next";
import { isStaging, siteUrl } from "@/config/site";
import { prisma } from "@/lib/prisma";
import { SEO_SETTING_KEYS } from "@/lib/constants";
import { parseJsonObject, type RobotsSeoSettings } from "@/lib/serp";

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

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (isStaging()) return buildRobots(true);
  try {
    const row = await prisma.setting.findUnique({ where: { key: SEO_SETTING_KEYS.ROBOTS }, select: { value: true } });
    const managed = parseJsonObject<RobotsSeoSettings>(row?.value, { allow: ["/"], disallow: ["/admin", "/admin/", "/giris"], sitemap: siteUrl("/sitemap.xml") });
    return { rules: { userAgent: "*", allow: managed.allow, disallow: managed.disallow }, sitemap: managed.sitemap, host: siteUrl("/") };
  } catch {
    return buildRobots(false);
  }
}
