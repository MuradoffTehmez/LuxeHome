import { PRODUCTION_SITE_URL } from "@/config/site";
import { LOCALES, type Locale } from "@/lib/constants";

export const SITEMAP_KINDS = ["pages", "properties", "agents", "agencies", "articles", "landings"] as const;
export type SitemapKind = (typeof SITEMAP_KINDS)[number];
export type SitemapEntry = { url: string; lastModified?: Date | string | null; changeFrequency?: string; priority?: number };

const escapeXml = (value: string) => value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!);

export function sitemapFeedNames() {
  return Object.values(LOCALES).flatMap((locale) => SITEMAP_KINDS.map((kind) => `${kind}-${locale}${kind === "properties" ? "-1" : ""}.xml`));
}

export function sitemapIndexXml(): string {
  const items = sitemapFeedNames().map((name) => `<sitemap><loc>${escapeXml(`${PRODUCTION_SITE_URL}/sitemaps/${name}`)}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`;
}

export function urlsetXml(entries: SitemapEntry[]): string {
  const items = entries.map((entry) => `<url><loc>${escapeXml(entry.url)}</loc>${entry.lastModified ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>` : ""}${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ""}${entry.priority != null ? `<priority>${entry.priority.toFixed(1)}</priority>` : ""}</url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`;
}

export function parseSitemapFeed(value: string): { kind: SitemapKind; locale: Locale; page: number } | null {
  const match = /^(pages|properties|agents|agencies|articles|landings)-(az|en|ru)(?:-(\d+))?\.xml$/.exec(value);
  if (!match) return null;
  const kind = match[1] as SitemapKind;
  const page = Number(match[3] ?? 1);
  if (kind !== "properties" && match[3]) return null;
  return { kind, locale: match[2] as Locale, page };
}

