import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AUTH_KINDS, PERMISSIONS } from "@/lib/constants";
import { getOptionalUser } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/permissions";
import { PRIVATE_MEDIA_PREFIX } from "@/lib/media/storage";
import { openDocumentForStaff } from "@/lib/property-verification";

export const dynamic = "force-dynamic";

function notFound(): Response {
  return new Response("Tapılmadı", { status: 404, headers: { "Cache-Control": "no-store" } });
}

/**
 * Əmlak sənədinin şəkli (#256, PRD 19.4) — yalnız `property:manage` icazəli, 2FA-dan keçmiş əməkdaşa.
 * Hər baxış `DocumentAccessLog`-a yazılır; icazəsiz sorğuya faylın mövcudluğunu açmamaq üçün 404.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOptionalUser(AUTH_KINDS.STAFF_2FA);
  if (!user || !hasPermission(user.role, PERMISSIONS.PROPERTY_MANAGE)) return notFound();
  const { id } = await params;
  const document = await openDocumentForStaff({ documentId: id.slice(0, 40), staffId: user.id });
  if (!document || !document.key.startsWith(PRIVATE_MEDIA_PREFIX)) return notFound();
  const object = await getCloudflareContext().env.MEDIA?.get(document.key);
  if (!object) return notFound();
  return new Response(object.body, {
    headers: {
      "Content-Type": document.contentType.startsWith("image/") ? document.contentType : "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    },
  });
}
