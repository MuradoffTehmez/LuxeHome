import { routing } from "../i18n/routing";
import { PRODUCTION_HOST } from "./seo-host";

/**
 * Kök ünvanın (`/`) default dilə yönləndirilməsi — OpenNext-dən əvvəl, `worker.ts`-də (#169).
 *
 * `routing.ts`-də `localeDetection: false` və `localeCookie: false` olduğu üçün `/` dil
 * başlığından və cookie-dən asılı olmadan həmişə `/<defaultLocale>`-ə gedir. Əvvəllər hər
 * sorğu tam OpenNext + middleware zəncirindən keçir və keşsiz 307 alırdı.
 *
 * Status 307 qalır (next-intl kimi), amma cavab 1 saat keşlənə bilər: gələcəkdə dil
 * təyini açılsa, daimi 308 brauzerlərdə ilişib qalmazdı, qısa ömürlü 307 isə tez yenilənir.
 * Dil təyini açılanda bu qısa yol söndürülür — qərar yenidən middleware-ə keçir.
 *
 * Yalnız kanonik `https://luxehomeestate.az/` üçün işləyir. `www.`, `http:`, workers.dev və
 * staging middleware-ə gedir: orada əvvəl kanonik host yönləndirməsi (`seo-host.ts`) bir
 * hop-da düzgün ünvana aparır — burada `/az`-a yönləndirmək əlavə hop yaradardı.
 */
const ROOT_REDIRECT_MAX_AGE = 3_600;

export function rootRedirect(request: Request): Response | null {
  if (routing.localeDetection !== false) return null;
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  if (url.pathname !== "/") return null;
  if (url.hostname !== PRODUCTION_HOST || url.protocol !== "https:") return null;

  return new Response(null, {
    status: 307,
    headers: {
      // Nisbi ünvan — next-intl-in verdiyi `Location: /az` ilə eyni; host dəyişmir.
      location: `/${routing.defaultLocale}${url.search}`,
      "cache-control": `public, max-age=${ROOT_REDIRECT_MAX_AGE}`,
    },
  });
}
