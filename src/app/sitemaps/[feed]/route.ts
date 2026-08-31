import { PRODUCTION_SITE_URL } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";
import { prisma } from "@/lib/prisma";
import { PROPERTY_STATUSES, TRANSLATION_ENTITY_TYPES, TRANSLATION_STATUSES, type Locale } from "@/lib/constants";
import { getCachedKnowledgeSitemapEntries, getCachedSitemapEntries } from "@/lib/public-cache";
import { parseSitemapFeed, urlsetXml, type SitemapEntry } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";
const absolute = (path: string, locale: Locale) => new URL(localizePath(path, locale), `${PRODUCTION_SITE_URL}/`).toString();
const staticPaths = ["/", "/emlaklar", "/layiheler", "/agentler", "/agentlikler", "/terefdaslar", "/xidmetler", "/haqqimizda", "/suallar", "/blog", "/bilik-merkezi", "/lugat", "/kalkulyator", "/bazar-analitikasi", "/elaqe", "/mexfilik-siyaseti", "/istifade-sertleri", "/cookie-siyaseti"];

async function translatedIds(entityType: string, ids: string[], locale: Locale) {
  if (locale === "az") return new Set(ids);
  const rows = await prisma.contentTranslation.findMany({ where: { entityType, entityId: { in: ids }, locale, status: TRANSLATION_STATUSES.PUBLISHED }, select: { entityId: true } });
  return new Set(rows.map((row) => row.entityId));
}

export async function GET(_request: Request, { params }: { params: Promise<{ feed: string }> }) {
  const descriptor = parseSitemapFeed((await params).feed);
  if (!descriptor) return new Response("Sitemap tapılmadı", { status: 404 });
  const [source, knowledge] = await Promise.all([getCachedSitemapEntries(), getCachedKnowledgeSitemapEntries()]);
  const { kind, locale, page } = descriptor;
  let entries: SitemapEntry[] = [];
  if (kind === "pages") {
    const [projectTranslations, serviceTranslations] = await Promise.all([
      translatedIds(TRANSLATION_ENTITY_TYPES.PROJECT, source.projects.flatMap((item) => item.id ? [item.id] : []), locale),
      translatedIds(TRANSLATION_ENTITY_TYPES.SERVICE, source.services.flatMap((item) => item.id ? [item.id] : []), locale),
    ]);
    entries = [
      ...staticPaths.map((path, index) => ({ url: absolute(path, locale), changeFrequency: index < 2 ? "daily" : "monthly", priority: index === 0 ? 1 : 0.6 })),
      ...source.projects.filter((item) => locale === "az" || (item.id && projectTranslations.has(item.id))).map((item) => ({ url: absolute(`/layiheler/${item.slug}`, locale), lastModified: item.updatedAt, changeFrequency: "monthly", priority: 0.7 })),
      ...source.services.filter((item) => locale === "az" || (item.id && serviceTranslations.has(item.id))).map((item) => ({ url: absolute(`/xidmetler/${item.slug}`, locale), lastModified: item.updatedAt, changeFrequency: "monthly", priority: 0.6 })),
      ...source.partners.map((item) => ({ url: absolute(`/terefdaslar/${item.slug}`, locale), lastModified: item.updatedAt, changeFrequency: "monthly", priority: 0.6 })),
    ];
  } else if (kind === "properties") {
    const eligible = source.properties.filter((item) => !item.noIndex && !item.canonicalUrl && ([PROPERTY_STATUSES.PUBLISHED, PROPERTY_STATUSES.RESERVED].includes(item.status as never) || ([PROPERTY_STATUSES.SOLD, PROPERTY_STATUSES.RENTED].includes(item.status as never) && item.retentionUntil != null && new Date(item.retentionUntil).getTime() >= Date.now())));
    const translated = await translatedIds(TRANSLATION_ENTITY_TYPES.PROPERTY, eligible.flatMap((item) => item.id ? [item.id] : []), locale);
    entries = eligible.filter((item) => locale === "az" || (item.id && translated.has(item.id))).slice((page - 1) * 10000, page * 10000).map((item) => ({ url: absolute(`/emlaklar/${item.slug}`, locale), lastModified: item.updatedAt, changeFrequency: "weekly", priority: 0.8 }));
  } else if (kind === "agents") entries = locale === "az" ? (source.agents ?? []).map((item) => ({ url: absolute(`/agentler/${item.slug}`, locale), lastModified: item.updatedAt, changeFrequency: "weekly", priority: 0.65 })) : [];
  else if (kind === "agencies") entries = locale === "az" ? source.agencies.map((item) => ({ url: absolute(`/agentlikler/${item.slug}`, locale), lastModified: item.updatedAt, changeFrequency: "weekly", priority: 0.65 })) : [];
  else if (kind === "articles") {
    const posts = source.posts.filter((item) => !item.noIndex && !item.canonicalUrl);
    const translated = await translatedIds(TRANSLATION_ENTITY_TYPES.BLOG_POST, posts.flatMap((item) => item.id ? [item.id] : []), locale);
    entries = [
      ...posts.filter((item) => locale === "az" || (item.id && translated.has(item.id))).map((item) => ({ url: absolute(`/blog/${item.slug}`, locale), lastModified: item.updatedAt, changeFrequency: "monthly", priority: 0.6 })),
      ...knowledge.map((item) => ({ url: absolute(item.path, locale), lastModified: item.updatedAt, changeFrequency: "monthly", priority: 0.6 })),
    ];
  } else if (kind === "landings") entries = [
    ...source.landings.map((item) => ({ url: absolute(item.path, locale), lastModified: item.updatedAt, changeFrequency: "daily", priority: 0.75 })),
    ...(source.dbLandings ?? []).filter((item) => item.locale === locale).map((item) => ({ url: absolute(item.path, locale), lastModified: item.updatedAt, changeFrequency: "daily", priority: 0.75 })),
  ];
  return new Response(urlsetXml(entries), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=300" } });
}
