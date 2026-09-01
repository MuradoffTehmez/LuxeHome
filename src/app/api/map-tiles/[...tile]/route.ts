import { getCloudflareContext } from "@opennextjs/cloudflare";

import { runtimeEnv } from "@/lib/runtime-env";

/**
 * Xəritə tile proxy-si.
 *
 * **Niyə lazım oldu.** Əvvəl tile-lar birbaşa `basemaps.cartocdn.com`-dan
 * çəkilirdi. CARTO açarsız basemap istifadəsini dayandırıb: sorğu yenə cavab
 * verir, amma hər tile-ın üstünə «API KEY REQUIRED · carto.com/basemaps/apikey»
 * yazısı basılır. Layihədə artıq Geoapify açarı var (ünvan axtarışı üçün), ona
 * görə xəritə də həmin provayderə keçirilir — bir hesab, bir açar, bir kvota.
 *
 * **Niyə proxy, birbaşa brauzerdən deyil.** Tile URL-i `<img>` ilə yüklənir,
 * yəni açar brauzerə çıxmalı olardı. Proxy açarı serverdə saxlayır və üstəlik
 * panelin sərt CSP-sini toxunulmaz qoyur: tile-lar öz mənşəyimizdən gəldiyi üçün
 * `img-src 'self'` kifayətdir, kənar host əlavə etmək lazım deyil.
 *
 * Sorğular Cloudflare Cache API-də saxlanılır və brauzerə uzunmüddətli
 * `Cache-Control` verilir — eyni tile provayderə bir dəfə gedir.
 */

export const dynamic = "force-dynamic";

/** Dizayn sisteminin açıq/tünd rejimlərinə uyğun gələn Geoapify stilləri. */
const STYLES = {
  light: "osm-bright-smooth",
  dark: "dark-matter-brown",
} as const;

type StyleKey = keyof typeof STYLES;

/** Provayder dəyişsə də ictimai atribusiya tələbi qalır (`tiles.ts`). */
const TILE_ENDPOINT = "https://maps.geoapify.com/v1/tile";

/** Bir aylıq brauzer keşi: tile məzmunu z/x/y üçün praktiki olaraq dəyişmir. */
const BROWSER_CACHE = "public, max-age=2592000, immutable";

const TILE_PATTERN = /^(\d{1,3})(@2x)?\.png$/;

type ParsedTile = { style: StyleKey; z: number; x: number; y: number; retina: boolean };

function parseTilePath(segments: string[]): ParsedTile | null {
  if (segments.length !== 4) return null;
  const [style, rawZ, rawX, rawY] = segments;

  if (!(style in STYLES)) return null;

  const z = Number(rawZ);
  const x = Number(rawX);
  const match = TILE_PATTERN.exec(rawY);
  if (!match) return null;
  const y = Number(match[1]);

  // Diapazon yoxlaması proxy-nin kənar məzmun üçün açıq qapıya çevrilməsini önləyir.
  if (!Number.isInteger(z) || z < 0 || z > 20) return null;
  const limit = 2 ** z;
  if (!Number.isInteger(x) || x < 0 || x >= limit) return null;
  if (!Number.isInteger(y) || y < 0 || y >= limit) return null;

  return { style: style as StyleKey, z, x, y, retina: match[2] === "@2x" };
}

/**
 * Kənar saytın bizim açarımızla xəritə qurmasının qarşısını alır.
 *
 * `Referer`-in olmaması qəbul edilir: panel səhifələri `Referrer-Policy:
 * no-referrer` daşıyır, ona görə oradakı tile sorğuları başlıqsız gəlir.
 */
function isForeignReferer(request: Request): boolean {
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    return new URL(referer).origin !== new URL(request.url).origin;
  } catch {
    return true;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tile: string[] }> },
) {
  if (isForeignReferer(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const parsed = parseTilePath((await params).tile ?? []);
  if (!parsed) return new Response("Not found", { status: 404 });

  const apiKey = runtimeEnv("GEOAPIFY_API_KEY");
  if (!apiKey) {
    // Açar qurulmayıbsa xəritəni boş qoymuruq: OSM-in standart tile-ları
    // açarsız işləyir və dev/staging üçün kifayətdir.
    return proxy(
      request,
      `https://tile.openstreetmap.org/${parsed.z}/${parsed.x}/${parsed.y}.png`,
    );
  }

  const retina = parsed.retina ? "@2x" : "";
  const upstream =
    `${TILE_ENDPOINT}/${STYLES[parsed.style]}/${parsed.z}/${parsed.x}/${parsed.y}${retina}.png`
    + `?apiKey=${encodeURIComponent(apiKey)}`;

  return proxy(request, upstream);
}

async function proxy(request: Request, upstream: string): Promise<Response> {
  // Keş açarı **sorğunun öz URL-idir** — upstream ünvanı açar daşıyır və keşdə
  // saxlanmamalıdır.
  const cacheKey = new Request(new URL(request.url).toString(), { method: "GET" });
  const cache = await openCache();

  const cached = await cache?.match(cacheKey);
  if (cached) return cached;

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstream, {
      headers: {
        Accept: "image/png,image/*",
        // Bəzi tile provayderləri tətbiqi tanıyan başlıq gözləyir.
        "User-Agent": "LuxeHomeEstate/1.0 (+https://luxehomeestate.az)",
      },
    });
  } catch (error) {
    console.error("[map-tiles]", error);
    return new Response("Bad gateway", { status: 502 });
  }

  if (!upstreamResponse.ok) {
    // Xəta cavabları keşlənmir — açar bərpa olunan kimi xəritə özü düzəlsin.
    return new Response("Tile unavailable", { status: upstreamResponse.status === 404 ? 404 : 502 });
  }

  const response = new Response(upstreamResponse.body, {
    status: 200,
    headers: {
      "Content-Type": upstreamResponse.headers.get("content-type") ?? "image/png",
      "Cache-Control": BROWSER_CACHE,
      "X-Content-Type-Options": "nosniff",
    },
  });

  const context = cloudflareContext();
  if (cache) {
    const stored = response.clone();
    if (context?.ctx) context.ctx.waitUntil(cache.put(cacheKey, stored));
    else await cache.put(cacheKey, stored);
  }

  return response;
}

/** Lokal `next dev`-də Cache API olmaya bilər — keş isteğe bağlıdır. */
async function openCache(): Promise<Cache | undefined> {
  try {
    return (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  } catch {
    return undefined;
  }
}

function cloudflareContext(): { ctx?: { waitUntil: (promise: Promise<unknown>) => void } } | null {
  try {
    return getCloudflareContext() as unknown as {
      ctx?: { waitUntil: (promise: Promise<unknown>) => void };
    };
  } catch {
    return null;
  }
}
