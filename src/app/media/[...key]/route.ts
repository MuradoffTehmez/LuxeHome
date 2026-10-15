import { getCloudflareContext } from "@opennextjs/cloudflare";
import { mediaKeyFromPath, mediaResponse } from "@/lib/media-response";

/**
 * R2-dəki şəkillərin ictimai ünvanı. Production-da sorğu adətən buraya çatmır —
 * `worker.ts` onu OpenNext-dən əvvəl kənar keşdən verir (#165). Qaydalar
 * `src/lib/media-response.ts`-dədir.
 */

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  return mediaResponse(getCloudflareContext().env.MEDIA, mediaKeyFromPath(`/media/${key.join("/")}`));
}
