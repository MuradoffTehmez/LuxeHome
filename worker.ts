// OpenNext worker-inin sarğısı: anonim ictimai HTML üçün kənar mikro-keş (#105).
// Qaydalar `src/lib/edge-html-cache.ts`-dədir; burada yalnız Cache API axını var.
// `.open-next/worker.js` build zamanı yaranır: CI-da typecheck vaxtı yoxdur, lokalda isə var —
// `@ts-expect-error` bir mühitdə «istifadəsiz» sayılardı, ona görə `@ts-ignore`.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import openNext from "./.open-next/worker.js";
import {
  EDGE_CACHE_HEADER,
  EDGE_CACHED_AT_HEADER,
  edgeCacheKey,
  edgeCacheTtl,
  edgeCacheVersion,
  edgeFreshness,
  edgeStaleTtl,
  isEdgeCacheableRequest,
  isStorableResponse,
  refreshRequest,
  shouldEvictOnRefresh,
  systemModeAllowsCache,
  toCachedCopy,
} from "./src/lib/edge-html-cache";
import { cronJobFor, internalCronToken } from "./src/lib/cron-auth";
import { rootRedirect } from "./src/lib/root-redirect";
import {
  MEDIA_CLIENT_CACHE_CONTROL,
  MEDIA_EDGE_TTL,
  MEDIA_NO_EDGE_CACHE_HEADER,
  mediaCacheKey,
  mediaKeyFromPath,
  mediaResponse,
  mediaVariantFromSearch,
  resizedMediaResponse,
} from "./src/lib/media-response";

// Durable Object sinifləri OpenNext worker-indən olduğu kimi ixrac olunur.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

type Env = {
  EDGE_HTML_CACHE_TTL?: string;
  EDGE_HTML_STALE_TTL?: string;
  CF_VERSION_METADATA?: { id?: string };
  IS_STAGING?: string;
  FORCE_MAINTENANCE?: string;
  DB?: D1Database;
  SITE_URL?: string;
  AUTH_SECRET?: string;
  MEDIA?: R2Bucket;
  IMAGES?: ImagesBinding;
};

/** `public` qovluğundakı şəkil deploy ilə dəyişə bilər — `/_next/image` kənar nüsxəsi bir gün saxlanılır. */
const OPTIMIZED_IMAGE_TTL = 86_400;
/**
 * Brauzer isə 7 gün saxlayır (#189): kateqoriya şəkilləri və loqo təkrar ziyarətdə şəbəkəyə
 * getməsin. Fayl adı eyni qalıb məzmun dəyişsə, köhnə nüsxə ən çox bir həftə görünə bilər.
 */
const OPTIMIZED_IMAGE_CLIENT_CACHE_CONTROL = "public, max-age=604800, stale-while-revalidate=86400";

type CacheThroughOptions = {
  /** Kənar nüsxənin ömrü (saniyə); verilməsə cavabın öz `Cache-Control`-u saxlanılır. */
  edgeTtl?: number;
  /** Klientə gedən `Cache-Control` (keşdən verilən cavabda da). */
  clientCacheControl?: string;
};

/**
 * Cavabı Cache API-dən verir, yoxdursa `produce()` ilə qurub `waitUntil` ilə keşə yazır.
 * Açar sintetik URL-dir; sorğunun başlıqları ötürülür ki, `If-None-Match` ilə təkrar baxış
 * 304 alsın. Yalnız 200 saxlanılır; `MEDIA_NO_EDGE_CACHE_HEADER` daşıyan cavab (kiçiltmə
 * alınmayıb orijinal verilib) keşə yazılmır ki, növbəti sorğu çevirməni yenidən sınasın.
 */
async function cacheThrough(
  request: Request,
  keyUrl: string,
  ctx: ExecutionContext,
  produce: () => Promise<Response>,
  options: CacheThroughOptions = {},
): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(keyUrl, { headers: request.headers });
  const cached = await cache.match(key);
  if (cached) {
    if (!options.clientCacheControl) return cached;
    const hit = new Response(cached.body, cached);
    hit.headers.set("cache-control", options.clientCacheControl);
    return hit;
  }

  const response = await produce();
  if (response.headers.has(MEDIA_NO_EDGE_CACHE_HEADER)) {
    const uncached = new Response(response.body, response);
    uncached.headers.delete(MEDIA_NO_EDGE_CACHE_HEADER);
    return uncached;
  }
  if (response.status !== 200 || !response.body) return response;
  const [forClient, forCache] = response.body.tee();
  const edgeCopy = new Response(forCache, response);
  if (options.edgeTtl) edgeCopy.headers.set("cache-control", `public, max-age=${options.edgeTtl}`);
  ctx.waitUntil(cache.put(key, edgeCopy).catch(() => undefined));
  return new Response(forClient, response);
}

/**
 * `/media/<açar>` şəkli OpenNext-dən əvvəl verilir (#165): Worker cavabı CDN-də öz-özünə
 * keşlənmir, ona görə nəticə Cache API-də saxlanılır. Məzmun dəyişməzdir (UUID açar).
 * `?w=&q=` (qlobal loader, #167) kiçildilmiş nüsxə istəyir; açara yalnız yol və bu iki dəyər
 * düşür — başqa query string eyni faylın yeni nüsxəsini yaratmasın.
 *
 * Kənar nüsxə `MEDIA_EDGE_TTL` (1 gün) yaşayır, brauzer isə bir il — silinən şəkil kənarda
 * il boyu qalmasın (`deleteImage()` → `purgeMediaCache()`).
 */
async function serveMedia(request: Request, url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const variant = mediaVariantFromSearch(url.searchParams);
  if (variant === "invalid") return new Response("Yanlış ölçü", { status: 400, headers: { "Cache-Control": "no-store" } });
  const key = mediaKeyFromPath(url.pathname);
  return cacheThrough(
    request,
    mediaCacheKey(url.pathname, variant),
    ctx,
    () => (variant ? resizedMediaResponse(env.MEDIA, env.IMAGES, key, variant) : mediaResponse(env.MEDIA, key)),
    { edgeTtl: MEDIA_EDGE_TTL, clientCacheControl: MEDIA_CLIENT_CACHE_CONTROL },
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
  return cacheThrough(
    request,
    keyUrl.href,
    ctx,
    async () => {
      const response: Response = await openNext.fetch(request, env, ctx);
      if (response.status !== 200) return response;
      const copy = new Response(response.body, response);
      copy.headers.set("cache-control", OPTIMIZED_IMAGE_CLIENT_CACHE_CONTROL);
      return copy;
    },
    { edgeTtl: OPTIMIZED_IMAGE_TTL, clientCacheControl: OPTIMIZED_IMAGE_CLIENT_CACHE_CONTROL },
  );
}

/**
 * `Server-Timing` (#173): `app` — OpenNext cavabının başlıqlarına qədər keçən vaxt, `edge` — kənar
 * HTML keşinin qərarı. Workers-də saat yalnız I/O zamanı irəliləyir, ona görə `app` təmiz CPU deyil,
 * D1/R2 gözləməsi daxil olmaqla server tərəfindəki divar vaxtıdır. Brauzerin DevTools-unda və
 * `curl -D -` ilə görünür; qeyri-HTML cavablarda (`webSocket`, 101) toxunulmur.
 */
function withServerTiming(response: Response, entries: string[]): Response {
  if (response.status === 101 || (response as Response & { webSocket?: unknown }).webSocket) return response;
  const timed = new Response(response.body, response);
  timed.headers.append("server-timing", entries.join(", "));
  return timed;
}

async function timedOpenNext(request: Request, env: Env, ctx: ExecutionContext): Promise<{ response: Response; ms: number }> {
  const started = Date.now();
  const response: Response = await openNext.fetch(request, env, ctx);
  return { response, ms: Date.now() - started };
}

function storeEdgeCopy(cache: Cache, key: string, response: Response, storeTtl: number): Promise<void> {
  return cache.put(key, toCachedCopy(response, storeTtl, Date.now())).catch(() => undefined);
}

/** Eyni açarın paralel fon yenilənməsini bir dəfəyə endirir (izolyat daxilində). */
const refreshing = new Set<string>();

/**
 * Köhnə nüsxəni fonda yeniləyir (#175). Saxlanıla bilən (200, HTML/RSC) cavab yazılır; qəti cavab
 * (səhifə silinib, gizlədilib, köçüb — `shouldEvictOnRefresh`) nüsxəni silir; keçici xətada köhnə
 * nüsxə qalır və növbəti hit yenidən sınayır.
 */
async function refreshEdgeCopy(request: Request, key: string, env: Env, ctx: ExecutionContext, storeTtl: number): Promise<void> {
  if (refreshing.has(key)) return;
  refreshing.add(key);
  try {
    const cache = (caches as unknown as { default: Cache }).default;
    const response: Response = await openNext.fetch(refreshRequest(request), env, ctx);
    if (isStorableResponse(response)) {
      await storeEdgeCopy(cache, key, response, storeTtl);
    } else if (shouldEvictOnRefresh(response.status)) {
      // Səhifə silinib/gizlədilib və ya köçüb — köhnə nüsxə bir daha verilməsin.
      await cache.delete(key);
    }
  } catch {
    // Fon yenilənməsinin xətası ziyarətçiyə təsir etmir — növbəti köhnə hit yenidən sınayır.
  } finally {
    refreshing.delete(key);
  }
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
    if (request.method === "GET" && url.pathname === "/_next/image") {
      return serveOptimizedImage(request, url, env, ctx);
    }

    const ttl = edgeCacheTtl(env);
    // Texniki xidmət rejimində keş həm oxunmur, həm yazılmır — middleware qapısı işləsin.
    if (ttl === 0 || !isEdgeCacheableRequest(request) || !(await systemModeAllowsCache(env))) {
      const { response, ms } = await timedOpenNext(request, env, ctx);
      return withServerTiming(response, [`app;dur=${ms}`, 'edge;desc="BYPASS"']);
    }

    const cache = (caches as unknown as { default: Cache }).default;
    const key = await edgeCacheKey(request, edgeCacheVersion(env));
    const staleTtl = edgeStaleTtl(env);
    const cached = await cache.match(key);
    const freshness = cached ? edgeFreshness(cached.headers.get(EDGE_CACHED_AT_HEADER), Date.now(), ttl, staleTtl) : "expired";
    if (cached && freshness !== "expired") {
      // Köhnə nüsxə dərhal verilir, yenisi fonda qurulur (#175).
      if (freshness === "stale") ctx.waitUntil(refreshEdgeCopy(request, key, env, ctx, ttl + staleTtl));
      const status = freshness === "fresh" ? "HIT" : "STALE";
      const hit = new Response(cached.body, cached);
      hit.headers.delete(EDGE_CACHED_AT_HEADER);
      hit.headers.set(EDGE_CACHE_HEADER, status);
      // Brauzer öz keşində saxlamasın — yeniləmə kənarda idarə olunur.
      hit.headers.set("cache-control", "private, no-cache");
      hit.headers.set("server-timing", `edge;desc="${status}"`);
      return hit;
    }

    const { response, ms } = await timedOpenNext(request, env, ctx);
    if (!isStorableResponse(response)) return withServerTiming(response, [`app;dur=${ms}`, 'edge;desc="MISS"']);

    const [forClient, forCache] = response.body ? response.body.tee() : [null, null];
    ctx.waitUntil(storeEdgeCopy(cache, key, new Response(forCache, response), ttl + staleTtl));
    const miss = new Response(forClient, response);
    miss.headers.set(EDGE_CACHE_HEADER, "MISS");
    miss.headers.append("server-timing", `app;dur=${ms}, edge;desc="MISS"`);
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
