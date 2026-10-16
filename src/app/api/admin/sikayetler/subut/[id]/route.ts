import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AUTH_KINDS, PERMISSIONS } from "@/lib/constants";
import { getOptionalUser } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/permissions";
import { getReportEvidence } from "@/lib/listing-reports";
import { PRIVATE_MEDIA_PREFIX } from "@/lib/media/storage";

export const dynamic = "force-dynamic";

function notFound(): Response {
  return new Response("Tapılmadı", { status: 404, headers: { "Cache-Control": "no-store" } });
}

/**
 * Şikayət sübutu (#195) — yalnız `property:manage` icazəli, 2FA-dan keçmiş əməkdaşa.
 * Fayl R2-nin `private/` prefiksindədir; ictimai `/media/...` marşrutu onu vermir.
 * İcazəsiz sorğuya faylın mövcudluğunu açmamaq üçün həmişə 404 qaytarılır.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOptionalUser(AUTH_KINDS.STAFF_2FA);
  if (!user || !hasPermission(user.role, PERMISSIONS.PROPERTY_MANAGE)) return notFound();

  const { id } = await params;
  const evidence = await getReportEvidence(id.slice(0, 40));
  if (!evidence || !evidence.key.startsWith(PRIVATE_MEDIA_PREFIX)) return notFound();

  const object = await getCloudflareContext().env.MEDIA?.get(evidence.key);
  if (!object) return notFound();

  return new Response(object.body, {
    headers: {
      "Content-Type": evidence.contentType.startsWith("image/") ? evidence.contentType : "application/octet-stream",
      "Content-Disposition": "inline",
      // Paylaşılan keşə (CDN, worker Cache API) heç vaxt düşməməlidir.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    },
  });
}
