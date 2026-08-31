import type { AuthUser } from "@/lib/auth/types";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/admin/audit";

/** Slug rename zamanı 301 yaradır və mövcud əcdad redirect-ləri son URL-ə sıxlaşdırır. */
export async function ensureSlugRedirect(
  prefix: string,
  previousSlug: string,
  nextSlug: string,
  actor: Pick<AuthUser, "id" | "email">,
): Promise<void> {
  if (previousSlug === nextSlug) return;
  const fromPath = `${prefix}/${previousSlug}`;
  const toPath = `${prefix}/${nextSlug}`;
  await prisma.redirect.updateMany({ where: { toPath: fromPath }, data: { toPath } });
  const redirect = await prisma.redirect.upsert({
    where: { fromPath },
    create: { fromPath, toPath, statusCode: 301, isActive: true, createdBy: actor.email },
    update: { toPath, statusCode: 301, isActive: true, createdBy: actor.email },
    select: { id: true },
  });
  await recordAudit(actor, "CREATE", "Redirect", redirect.id, `${fromPath} → ${toPath}`);
}
