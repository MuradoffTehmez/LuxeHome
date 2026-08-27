import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/prisma";

/**
 * Baxış sayğacı.
 *
 * `Property.viewCount` və `BlogPost.viewCount` sütunları sxemdə əvvəldən var idi
 * və panel dashboard-u, «ən çox baxılan» bloku, bloq yazısının «N baxış» sətri
 * onlardan oxuyurdu — amma heç yerdən artırılmırdı, ona görə hər dəyər sıfır
 * qalırdı və dashboard bloku həmişə boş görünürdü.
 *
 * İki qayda:
 *
 * 1. **Yazma cavabı gözlətmir.** Artım `ctx.waitUntil()` ilə cavabdan sonraya
 *    salınır; əks halda hər səhifə açılışına bir D1 yazma gecikməsi əlavə olunardı.
 * 2. **Bot sayılmır.** Axtarış robotları və monitorinq alətləri statistikanı
 *    şişirdir; sadə user-agent filtri onların böyük hissəsini kəsir.
 */

const BOT_PATTERN =
  /bot|crawl|spider|slurp|bing|yandex|baidu|duckduck|facebookexternalhit|whatsapp|telegram|preview|monitor|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|curl|wget|python-requests|axios|node-fetch|okhttp|java\//i;

/** User-agent brauzerə oxşamırsa baxış sayılmır. */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  // Başlıq ümumiyyətlə yoxdursa bu, real brauzer deyil
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent);
}

type ViewTarget = "property" | "post";

function incrementQuery(target: ViewTarget, id: string): Promise<unknown> {
  return target === "property"
    ? prisma.property.update({ where: { id }, data: { viewCount: { increment: 1 } } })
    : prisma.blogPost.update({ where: { id }, data: { viewCount: { increment: 1 } } });
}

/**
 * Baxışı qeydə alır. Heç vaxt istisna atmır və heç vaxt gözlətmir —
 * sayğac səhifənin işləməsindən vacib deyil.
 */
export function recordView(
  target: ViewTarget,
  id: string,
  userAgent: string | null | undefined,
): void {
  if (isLikelyBot(userAgent)) return;

  const task = (async () => {
    try {
      await incrementQuery(target, id);
    } catch (error) {
      // Silinmiş qeyd (P2025) və ya keçici D1 xətası — səhifə buna görə sınmamalıdır
      console.error(`[views] «${target}:${id}» sayğacı artırılmadı:`, error);
    }
  })();

  try {
    getCloudflareContext().ctx.waitUntil(task);
  } catch {
    // Lokal `next dev` mühitində Cloudflare konteksti olmaya bilər —
    // orada da səhv udulur, sadəcə cavab bir az gözləyir
    void task;
  }
}
