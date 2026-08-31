import { sitemapIndexXml } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";
export function GET() {
  return new Response(sitemapIndexXml(), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=300" } });
}

