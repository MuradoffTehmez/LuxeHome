import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * R2-dəki şəkillərin ictimai ünvanı.
 *
 * Bucket-ın öz custom domeni yoxdur, ona görə fayllar Worker üzərindən verilir.
 * Açar təsadüfi UUID-dir və məzmun heç vaxt dəyişmir — buna görə cavab bir il
 * `immutable` keşlə göndərilir və təkrar sorğular Cloudflare kənarından qayıdır.
 *
 * Cavabda `Content-Disposition: inline` və `X-Content-Type-Options: nosniff` var:
 * yüklənmiş fayl brauzerdə HTML kimi şərh olunub sayt daxilində skript işlətməməlidir.
 */

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  const objectKey = key.join("/");

  // `..` seqmenti R2-də qovluq mənası daşımır, amma açarın gözlənilən formada
  // olduğunu yoxlamaq gələcək dəyişikliklərdə də qorunma verir
  if (!/^[a-z0-9/_-]+\.(jpg|png|webp|avif)$/i.test(objectKey)) {
    return new Response("Tapılmadı", { status: 404 });
  }

  const bucket = getCloudflareContext().env.MEDIA;
  const object = await bucket?.get(objectKey);
  if (!object) return new Response("Tapılmadı", { status: 404 });

  const contentType = object.httpMetadata?.contentType ?? "";

  return new Response(object.body, {
    headers: {
      "Content-Type": ALLOWED_TYPES.has(contentType) ? contentType : "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      etag: object.httpEtag,
    },
  });
}
