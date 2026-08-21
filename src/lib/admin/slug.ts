import { slugify } from "@/lib/utils";

/** Slug sahibini tapan sorğu — hər model üçün action tərəfindən verilir. */
type SlugOwnerLookup = (slug: string) => Promise<{ id: string } | null>;

/**
 * Slug-ı unikal hala gətirir.
 *
 * Sxemdə `slug` sahəsi `@unique`-dir; toqquşma baş verəndə Prisma P2002 atır və
 * istifadəçi anlaşılmaz xəta görür. Bu funksiya yazıdan əvvəl boş nömrə tapır:
 * `villa`, `villa-2`, `villa-3`…
 *
 * `currentId` verilmişsə, qeydin öz slug-ı toqquşma sayılmır — redaktə zamanı
 * başlığa toxunulmadıqda slug dəyişməməlidir.
 */
export async function uniqueSlug(
  base: string,
  findOwner: SlugOwnerLookup,
  currentId?: string,
): Promise<string> {
  const root = slugify(base) || "qeyd";

  for (let suffix = 1; suffix < 100; suffix += 1) {
    const candidate = suffix === 1 ? root : `${root}-${suffix}`;
    const owner = await findOwner(candidate);
    if (!owner || owner.id === currentId) return candidate;
  }

  // 99 variant tutulubsa, təsadüfi son əlavə edilir — dövrə sonsuz getməməlidir
  return `${root}-${Date.now().toString(36)}`;
}
