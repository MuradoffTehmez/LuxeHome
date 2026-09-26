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
  toCachedCopy,
} from "./src/lib/edge-html-cache";

// Durable Object sinifləri OpenNext worker-indən olduğu kimi ixrac olunur.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

type Env = { EDGE_HTML_CACHE_TTL?: string; IS_STAGING?: string };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const ttl = edgeCacheTtl(env);
    if (ttl === 0 || !isEdgeCacheableRequest(request)) {
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
};

export default worker;
