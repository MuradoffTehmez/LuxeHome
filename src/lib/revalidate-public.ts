import { revalidatePath, revalidateTag } from "next/cache";
import { contentInvalidation, type PublicContentKind } from "@/lib/cache-tags";

/** Public cache və route-ları eyni matrislə etibarsız edir; private route qəbul etmir. */
export function revalidatePublicContent(kind: PublicContentKind, slug?: string) {
  const invalidation = contentInvalidation(kind, slug);
  for (const tag of invalidation.tags) revalidateTag(tag);
  for (const path of invalidation.paths) revalidatePath(path);
}
