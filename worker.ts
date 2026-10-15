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
import { mediaKeyFromPath, mediaResponse, mediaVariantFromSearch, resizedMediaResponse } from "./src/lib/media-response";

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
  IMAGES?: ImagesBinding;
};

/** `public` qovluğundakı şəkil deploy ilə dəyişə bilər — `/_next/image` nüsxəsi bir gün saxlanılır. */
const OPTIMIZED_IMAGE_TTL = 86_400;

/**
 * Cavabı Cache API-dən verir, yoxdursa `produce()` ilə qurub `waitUntil` ilə keşə yazır.
 * Açar sintetik URL-dir; sorğunun başlıqları ötürülür ki, `If-None-Match` ilə təkrar baxış
 * 304 alsın. Yalnız 200 saxlanılır.
 */
async function cacheThrough(
  request: Request,
  keyUrl: string,
  ctx: ExecutionContext,
  produce: () => Promise<Response>,
): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(keyUrl, { headers: request.headers });
  const cached = await cache.match(key);
  if (cached) return cached;

  const response = await produce();
  if (response.status !== 200 || !response.body) return response;
  const [forClient, forCache] = response.body.tee();
  ctx.waitUntil(cache.put(key, new Response(forCache, response)).catch(() => undefined));
  return new Response(forClient, response);
}

/**
 * `/media/<açar>` şəkli OpenNext-dən əvvəl verilir (#165): Worker cavabı CDN-də öz-özünə
 * keşlənmir, ona görə nəticə Cache API-də saxlanılır. Məzmun dəyişməzdir (UUID açar).
 * `?w=&q=` (qlobal loader, #167) kiçildilmiş nüsxə istəyir; açara yalnız yol və bu iki dəyər
 * düşür — başqa query string eyni faylın yeni nüsxəsini yaratmasın.
 */
async function serveMedia(request: Request, url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const variant = mediaVariantFromSearch(url.searchParams);
  if (variant === "invalid") return new Response("Yanlış ölçü", { status: 400, headers: { "Cache-Control": "no-store" } });
  const key = mediaKeyFromPath(url.pathname);
  const keyUrl = `${url.origin}${url.pathname}${variant ? `?w=${variant.width}&q=${variant.quality}` : ""}`;
  return cacheThrough(request, keyUrl, ctx, () =>
    variant ? resizedMediaResponse(env.MEDIA, env.IMAGES, key, variant) : mediaResponse(env.MEDIA, key),
  );
}

/** OpenNext-in seçdiyi çıxış formatı `Accept`-dən asılıdır — açar onu da daşıyır (`next.config` sırası). */
function negotiatedImageFormat(request: Request): string {
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("image/avif")) return "avif";
  if (accept.includes("image/webp")) return "webp";
  return "orig";
}

/**
 * `/_next/image` (statik fayl, Unsplash) OpenNext-də IMAGES binding-i ilə çevrilir, amma cavab
 * heç yerdə saxlanılmırdı — `Cache-Control` yox idi və loqo hər səhifədə 1–2 s-də gəlirdi (#167).
 */
async function serveOptimizedImage(request: Request, url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const keyUrl = new URL(url);
  keyUrl.searchParams.set("__fmt", negotiatedImageFormat(request));
  return cacheThrough(request, keyUrl.href, ctx, async () => {
    const response: Response = await openNext.fetch(request, env, ctx);
    if (response.status !== 200) return response;
    const copy = new Response(response.body, response);
    if (!copy.headers.get("cache-control")?.includes("immutable")) {
      copy.headers.set("cache-control", `public, max-age=${OPTIMIZED_IMAGE_TTL}`);
    }
    return copy;
  });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname.startsWith("/media/")) {
      return serveMedia(request, url, env, ctx);
    }
    if (request.method === "GET" && url.pathname === "/_next/image") {
      return serveOptimizedImage(request, url, env, ctx);
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
