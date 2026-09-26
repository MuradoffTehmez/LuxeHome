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

/**
 * Render zamanı yan təsiri olan marşrutlar — baxış sayğacı (`recordView`) server
 * komponentindədir; keşdən verilən cavab onu işə salmazdı və sayğac donardı.
 * (`/emlaklar/[slug]` sessiyadan asılı olduğu üçün onsuz da keşlənmir.)
 */
const SIDE_EFFECT_ROUTES = [/^\/(az|en|ru)\/blog\/[^/]+\/?$/, /^\/(az|en|ru)\/bilik-merkezi\/[^/]+\/?$/];
/** `bilik-merkezi/kateqoriya/...` və `bilik-merkezi/suallar` detal deyil — sayğac yoxdur. */
const SIDE_EFFECT_EXCEPTIONS = [/^\/(az|en|ru)\/bilik-merkezi\/(kateqoriya|suallar)\/?/];

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
  const sideEffect = SIDE_EFFECT_ROUTES.some((pattern) => pattern.test(url.pathname))
    && !SIDE_EFFECT_EXCEPTIONS.some((pattern) => pattern.test(url.pathname));
  if (sideEffect) return false;
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

/** `system-mode.ts`-dəki açarla eyni — worker OpenNext kontekstindən kənardadır, ona görə təkrarlanır. */
export const SYSTEM_MODE_SETTING_KEY = "system.mode_config";
const MODE_SNAPSHOT_MS = 15_000;
let modeSnapshot: { allowed: boolean; expiresAt: number } | null = null;

/**
 * Keşdən cavab vermək yalnız sayt adi rejimdədirsə təhlükəsizdir. Texniki xidmət açılanda
 * keşlənmiş səhifə `maintenanceGate()`-dən yan keçməməlidir — ona görə rejim oxunur
 * (middleware kimi 15 s izolyat snapshot-u ilə). Planlaşdırılmış pəncərə varsa və ya rejim
 * oxunmursa keş işlədilmir: şübhəli halda sorğu OpenNext-ə gedir və qərarı middleware verir.
 */
export function isModeCacheable(raw: string | null | undefined, forceMaintenance: string | undefined): boolean {
  if (forceMaintenance === "true") return false;
  if (!raw?.trim()) return true;
  try {
    const config = JSON.parse(raw) as { mode?: unknown; startAt?: unknown; endAt?: unknown };
    return (config.mode ?? "NORMAL") === "NORMAL" && !config.startAt && !config.endAt;
  } catch {
    return false;
  }
}

export async function systemModeAllowsCache(env: { DB?: D1Database; FORCE_MAINTENANCE?: string }): Promise<boolean> {
  if (env.FORCE_MAINTENANCE === "true") return false;
  const now = Date.now();
  if (modeSnapshot && modeSnapshot.expiresAt > now) return modeSnapshot.allowed;
  let allowed = false;
  try {
    const row = env.DB
      ? await env.DB.prepare('SELECT "value" FROM "Setting" WHERE "key" = ?1').bind(SYSTEM_MODE_SETTING_KEY).first<{ value: string }>()
      : null;
    allowed = env.DB ? isModeCacheable(row?.value ?? null, env.FORCE_MAINTENANCE) : false;
  } catch {
    allowed = false;
  }
  modeSnapshot = { allowed, expiresAt: now + MODE_SNAPSHOT_MS };
  return allowed;
}
