import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default defineCloudflareConfig({
  // ISR/`revalidate` nəticələri R2-də saxlanılır (binding: NEXT_INC_CACHE_R2_BUCKET).
  //
  // Qarşısında data mərkəzinin Cache API-si durur (#171): hit R2-yə getmir, giriş fonda
  // R2-dən yenilənir. `bypassTagCacheOnCacheHit` qəsdən defoltdadır (`false`) — hit-də də
  // D1 teq yoxlaması işləyir, ona görə `revalidateTag(…, { expire: 0 })` dərhal təsir edir.
  // Teq keşini yan keçmək cache purge (Cloudflare API token) tələb edir.
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  // `revalidateTag`/`revalidatePath` siqnalları D1-də saxlanılır. Bu olmadan
  // admin paneldəki dəyişiklik public səhifədə yalnız keş müddəti bitəndə görünür.
  tagCache: d1NextTagCache,
});
