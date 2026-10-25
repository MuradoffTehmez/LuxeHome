import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isStaging, siteUrl } from "@/config/site";

/**
 * IndexNow (#289) — dəyişən ictimai URL-ləri dərhal Bing-ə (və iştirakçı axtarış
 * sistemlərinə) bildirir. ChatGPT axtarışı Bing indeksinə söykənir, ona görə elanın
 * crawl gözləmədən indeksə düşməsi AI görünürlüyünün ilk şərtidir.
 *
 * Açar `AUTH_SECRET`-dən törədilir (`cron-auth.ts` kimi): ayrıca secret lazım deyil və
 * `/indexnow.txt` onu təsdiq üçün açıq verir. Göndəriş fon işidir və **heç vaxt atmır** —
 * bildiriş xətası dərc əməliyyatını uğursuz göstərməməlidir.
 */
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_KEY_PATH = "/indexnow.txt";
/** Protokolun bir sorğuda qəbul etdiyi URL həddi. */
const INDEXNOW_MAX_URLS = 10_000;

export async function indexNowKey(authSecret: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${authSecret}:indexnow:v1`));
  return [...new Uint8Array(digest)].slice(0, 16).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Yalnız production-da göndərilir: staging və lokal E2E indekslənməməlidir. */
export function indexNowEnabled(): boolean {
  return !isStaging() && process.env.NODE_ENV === "production" && Boolean(process.env.AUTH_SECRET);
}

/** Sayt yollarından IndexNow sorğu gövdəsi; sitemap və təkrarlar atılır. */
export function buildIndexNowPayload(paths: string[], key: string) {
  const host = new URL(siteUrl()).host;
  const urlList = [...new Set(paths.filter((path) => path.startsWith("/") && !path.endsWith(".xml")))]
    .slice(0, INDEXNOW_MAX_URLS)
    .map((path) => siteUrl(path));
  return { host, key, keyLocation: siteUrl(INDEXNOW_KEY_PATH), urlList };
}

async function submitIndexNow(paths: string[]): Promise<void> {
  const key = await indexNowKey(process.env.AUTH_SECRET ?? "");
  const payload = buildIndexNowPayload(paths, key);
  if (payload.urlList.length === 0) return;
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  // 200/202 qəbuldur; 4xx açar/host problemi deməkdir və loqda görünməlidir.
  if (!response.ok) console.error("[indexnow] göndəriş rədd edildi:", response.status);
}

/** Yazma yollarından çağırılır: cavabı gözlətmir (`waitUntil`), xətanı yalnız loqa yazır. */
export function queueIndexNow(paths: string[]): void {
  if (paths.length === 0 || !indexNowEnabled()) return;
  const task = submitIndexNow(paths).catch((error) => {
    console.error("[indexnow] göndəriş alınmadı:", error instanceof Error ? error.message : error);
  });
  try {
    getCloudflareContext().ctx.waitUntil(task);
  } catch {
    void task;
  }
}
