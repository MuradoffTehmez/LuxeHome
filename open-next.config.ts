import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default defineCloudflareConfig({
  // ISR/`revalidate` nəticələri R2-də saxlanılır (binding: NEXT_INC_CACHE_R2_BUCKET)
  incrementalCache: r2IncrementalCache,
  // `revalidateTag`/`revalidatePath` siqnalları D1-də saxlanılır. Bu olmadan
  // admin paneldəki dəyişiklik public səhifədə yalnız keş müddəti bitəndə görünür.
  tagCache: d1NextTagCache,
});
