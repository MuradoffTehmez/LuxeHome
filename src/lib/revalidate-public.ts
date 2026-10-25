import { revalidatePath, revalidateTag } from "next/cache";
import { contentInvalidation, type PublicContentKind } from "@/lib/cache-tags";
import { queueIndexNow } from "@/lib/indexnow";

/**
 * Public cache və route-ları eyni matrislə etibarsız edir; private route qəbul etmir.
 *
 * `{ expire: 0 }` Next 15-dəki davranışı saxlayır: teq dərhal bitir və növbəti
 * sorğu təzə data oxuyur. Next 16-da `"max"` profili stale-while-revalidate
 * verir — redaktor dərc etdiyi dəyişikliyi bir sorğu gecikmə ilə görərdi.
 *
 * Eyni yollar IndexNow ilə Bing-ə bildirilir (#289) — ictimai məzmunu dəyişən hər
 * action buradan keçdiyi üçün ayrıca çağırış lazım deyil.
 */
export function revalidatePublicContent(kind: PublicContentKind, slug?: string) {
  const invalidation = contentInvalidation(kind, slug);
  for (const tag of invalidation.tags) revalidateTag(tag, { expire: 0 });
  for (const path of invalidation.paths) revalidatePath(path);
  queueIndexNow(invalidation.paths);
}
