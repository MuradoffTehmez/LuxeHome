import { isCacheablePublicRoute } from "./public-cache-policy";

/**
 * Anonim ictimai HTML üçün kənar (edge) mikro-keş (#105).
 *
 * `force-dynamic` səhifələr hər sorğuda D1-ə gedir (TTFB 0.3–0.6 s). Sessiyası olmayan
 * ziyarətçinin gördüyü HTML hamı üçün eynidir, ona görə Cloudflare Cache API-də qısa
 * müddət (defolt 60 s) saxlanıla bilər. Qaydalar `public-cache-policy.ts`-dəki siyasətə
 * söykənir — sessiya oxuyan marşrut, panel, auth və API heç vaxt keşlənmir.
 *
 * Təhlükəsizlik şərtləri:
 * - Sessiya/2FA/preview cookie-si olan sorğu keçir (istifadəçiyə məxsus HTML).
 * - Açar RSC və router başlıqlarını daxil edir: eyni URL həm sənəd, həm də naviqasiya
 *   payload-u qaytarır — ikisi eyni girişi bölüşsəydi keş zəhərlənərdi.
 * - `Set-Cookie` saxlanmır (locale cookie-si başqasına yazılmasın).
 * - Staging və lokal E2E-də söndürülüdür: admin dəyişikliyini dərhal yoxlayan testlər var.
 */

const BYPASS_COOKIES = ["lhe_session", "lhe_2fa", "__prerender_bypass", "__next_preview_data"];
const VARY_HEADERS = ["rsc", "next-router-state-tree", "next-router-prefetch", "next-router-segment-prefetch", "next-url"];
const LOCALE_PATH = /^\/(az|en|ru)(\/|$)/;

export const EDGE_CACHE_HEADER = "x-edge-cache";

/** `EDGE_HTML_CACHE_TTL` (saniyə); staging-də və ya dəyər yoxdursa `0` (söndürülü). */
export function edgeCacheTtl(env: { EDGE_HTML_CACHE_TTL?: string; IS_STAGING?: string }): number {
  if (env.IS_STAGING === "true") return 0;
  const ttl = Number(env.EDGE_HTML_CACHE_TTL ?? 0);
  return Number.isFinite(ttl) && ttl > 0 ? Math.min(Math.floor(ttl), 600) : 0;
}

function hasCookie(header: string | null, names: string[]): boolean {
  if (!header) return false;
  return header.split(";").some((part) => names.includes(part.trim().split("=")[0]));
}

export function isEdgeCacheableRequest(request: Request): boolean {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  // Locale prefiksi olmayan yol (`/`, `/sitemap.xml`) yönləndirmə və ya xüsusi cavabdır.
  if (!LOCALE_PATH.test(url.pathname)) return false;
  if (hasCookie(request.headers.get("cookie"), BYPASS_COOKIES)) return false;
  if (request.headers.has("authorization")) return false;
  return isCacheablePublicRoute(url.pathname);
}

/** Keş açarı — URL + naviqasiya başlıqlarının heşi (sintetik URL kimi). */
export async function edgeCacheKey(request: Request): Promise<string> {
  const vary = VARY_HEADERS.map((name) => `${name}=${request.headers.get(name) ?? ""}`).join("\n");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${request.url}\n${vary}`));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `https://edge-html-cache.internal/${hash}`;
}

export function isStorableResponse(response: Response): boolean {
  if (response.status !== 200) return false;
  const type = response.headers.get("content-type") ?? "";
  return type.startsWith("text/html") || type.startsWith("text/x-component");
}

/** Saxlanacaq nüsxə: `Set-Cookie` atılır, keş müddəti yazılır. */
export function toCachedCopy(response: Response, ttl: number): Response {
  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  headers.set("cache-control", `public, max-age=${ttl}`);
  return new Response(response.body, { status: response.status, headers });
}
