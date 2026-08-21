import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  // ISR/`revalidate` nəticələri R2-də saxlanılır (binding: NEXT_INC_CACHE_R2_BUCKET)
  incrementalCache: r2IncrementalCache,
});
