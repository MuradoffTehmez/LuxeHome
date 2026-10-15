// OpenNext worker-inin sarğısı: anonim ictimai HTML üçün kənar mikro-keş (#105).
// Qaydalar `src/lib/edge-html-cache.ts`-dədir; burada yalnız Cache API axını var.
// `.open-next/worker.js` build zamanı yaranır: CI-da typecheck vaxtı yoxdur, lokalda isə var —
// `@ts-expect-error` bir mühitdə «istifadəsiz» sayılardı, ona görə `@ts-ignore`.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import openNext from "./.open-next/worker.js";
import {
  EDGE_CACHE_HEADER,
  edgeCacheKey,
  edgeCacheTtl,
  isEdgeCacheableRequest,
  isStorableResponse,
  systemModeAllowsCache,
  toCachedCopy,
} from "./src/lib/edge-html-cache";
import { cronJobFor, internalCronToken } from "./src/lib/cron-auth";
import { rootRedirect } from "./src/lib/root-redirect";
import {
  MEDIA_CLIENT_CACHE_CONTROL,
  MEDIA_EDGE_TTL,
  mediaCacheKey,
  mediaKeyFromPath,
  mediaResponse,
} from "./src/lib/media-response";

// Durable Object sinifləri OpenNext worker-indən olduğu kimi ixrac olunur.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

type Env = {
  EDGE_HTML_CACHE_TTL?: string;
  IS_STAGING?: string;
  FORCE_MAINTENANCE?: string;
  DB?: D1Database;
  SITE_URL?: string;
  AUTH_SECRET?: string;
  MEDIA?: R2Bucket;
};

/**
 * `/media/<açar>` şəkli OpenNext-dən əvvəl verilir (#165): Worker cavabı CDN-də öz-özünə
 * keşlənmir, ona görə nəticə Cache API-də saxlanılır. Məzmun dəyişməzdir (UUID açar), açara
 * yalnız yol düşür — query string eyni faylın yeni nüsxəsini yaratmasın. Sorğunun başlıqları
 * ötürülür ki, `If-None-Match` ilə təkrar baxış 304 alsın.
 *
 * Kənar nüsxə `MEDIA_EDGE_TTL` (1 gün) yaşayır, brauzer isə bir il — silinən şəkil kənarda
 * il boyu qalmasın (`deleteImage()` → `purgeMediaCache()`).
 */
async function serveMedia(request: Request, url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(mediaCacheKey(url.pathname), { headers: request.headers });
  const cached = await cache.match(key);
  if (cached) {
    const hit = new Response(cached.body, cached);
    hit.headers.set("cache-control", MEDIA_CLIENT_CACHE_CONTROL);
    return hit;
  }

  const response = await mediaResponse(env.MEDIA, mediaKeyFromPath(url.pathname));
  if (response.status !== 200 || !response.body) return response;
  const [forClient, forCache] = response.body.tee();
  const edgeCopy = new Response(forCache, response);
  edgeCopy.headers.set("cache-control", `public, max-age=${MEDIA_EDGE_TTL}`);
  ctx.waitUntil(cache.put(key, edgeCopy).catch(() => undefined));
  return new Response(forClient, response);
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // `/` həmişə `/az`-a gedir — OpenNext və middleware-i işə salmadan, keşlənə bilən cavabla (#169).
    const redirect = rootRedirect(request);
    if (redirect) return redirect;

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname.startsWith("/media/")) {
      return serveMedia(request, url, env, ctx);
    }

    const ttl = edgeCacheTtl(env);
    // Texniki xidmət rejimində keş həm oxunmur, həm yazılmır — middleware qapısı işləsin.
    if (ttl === 0 || !isEdgeCacheableRequest(request) || !(await systemModeAllowsCache(env))) {
      return openNext.fetch(request, env, ctx);
    }

    const cache = (caches as unknown as { default: Cache }).default;
    const key = await edgeCacheKey(request);
    const cached = await cache.match(key);
    if (cached) {
      const hit = new Response(cached.body, cached);
      hit.headers.set(EDGE_CACHE_HEADER, "HIT");
      // Brauzer öz keşində saxlamasın — yeniləmə kənarda idarə olunur.
      hit.headers.set("cache-control", "private, no-cache");
      return hit;
    }

    const response: Response = await openNext.fetch(request, env, ctx);
    if (!isStorableResponse(response)) return response;

    const [forClient, forCache] = response.body ? response.body.tee() : [null, null];
    ctx.waitUntil(cache.put(key, toCachedCopy(new Response(forCache, response), ttl)).catch(() => undefined));
    const miss = new Response(forClient, response);
    miss.headers.set(EDGE_CACHE_HEADER, "MISS");
    return miss;
  },

  /**
   * Cloudflare cron trigger-i (#161). OpenNext worker-i yalnız `fetch` ixrac edir, ona görə iş
   * adi marşrut kimi yazılıb və burada şəbəkəyə çıxmadan `openNext.fetch` ilə çağırılır.
   * Açar `AUTH_SECRET`-dən törədilir (`internalCronToken`) — ayrıca secret lazım deyil.
   */
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const job = cronJobFor(controller.cron);
    if (!job || !env.AUTH_SECRET) return;
    const base = env.SITE_URL || "https://luxehomeestate.az";
    const request = new Request(`${base}/api/cron/leads?is=${job}`, {
      method: "POST",
      headers: { authorization: `Bearer ${await internalCronToken(env.AUTH_SECRET)}` },
    });
    const response: Response = await openNext.fetch(request, env, ctx);
    if (!response.ok) console.error(`[cron] «${job}» ${response.status}`);
  },
};

export default worker;
