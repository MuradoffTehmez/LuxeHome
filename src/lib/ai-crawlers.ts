import type { MetadataRoute } from "next";

/**
 * AI crawler siyasəti (GEO, #289).
 *
 * Canlı AI axtarışını qidalandıran botlara açıq icazə verilir: `robots.txt`-də
 * adla yazılmış qrup `*` qrupunu tam əvəz edir, ona görə həmin botlar üçün
 * allow/disallow siyahısı eyni saxlanılır — əks halda `/admin` onlara açılardı.
 *
 * Qeyd: bu fayl yalnız `robots.txt` səviyyəsidir. Cloudflare-in «AI Crawl
 * Control» bloku kənarda ayrıca 403 verir və paneldən açılmalıdır.
 */
export const AI_SEARCH_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "meta-externalagent",
] as const;

/** Aqressiv tarama, bazarımız üçün axtarış faydası yoxdur. */
export const AI_BLOCKED_CRAWLERS = ["Bytespider"] as const;

type RobotsRule = Extract<MetadataRoute.Robots["rules"], unknown[]>[number];

export function robotsRulesWithAiCrawlers(allow: string | string[], disallow: string | string[]): RobotsRule[] {
  return [
    { userAgent: "*", allow, disallow },
    { userAgent: [...AI_SEARCH_CRAWLERS], allow, disallow },
    { userAgent: [...AI_BLOCKED_CRAWLERS], disallow: "/" },
  ];
}
