import { ImageResponse } from "next/og";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { publicPropertyWhere } from "@/lib/queries";
import { LISTING_TYPES, TRANSLATION_ENTITY_TYPES, type Locale } from "@/lib/constants";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";
import { applyContentTranslation, getPublishedContentTranslation } from "@/lib/content-translation";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { formatOgPrice } from "@/lib/og-price";

/**
 * Elan üçün paylaşım kartı (Open Graph, 1200×630) — #103.
 *
 * WhatsApp/Telegram/Facebook-da paylaşılan linkdə yalnız foto deyil, qiymət, yer və
 * brend də görünür. Kart foto + tünd məlumat panelindən ibarətdir.
 *
 * **Şəkil JPEG-ə çevrilir.** Yüklənmiş media WebP-dir, ImageResponse (satori/resvg)
 * isə WebP-ni etibarlı oxumur; ona görə foto əvvəlcə `IMAGES` binding-i ilə kiçildilib
 * JPEG edilir və data URI kimi yerləşdirilir. Binding yoxdursa (lokal dev) kart
 * fotosuz, yalnız mətnlə qurulur — paylaşım linki yenə də işləyir.
 *
 * Marşrut `/api` altındadır ki, locale middleware-i ondan keçməsin; dil `?l=` ilə gəlir.
 */

export const dynamic = "force-dynamic";

const WIDTH = 1200;
const HEIGHT = 630;
const PHOTO_WIDTH = 660;

async function readSourceImage(url: string): Promise<ReadableStream | null> {
  if (url.startsWith("/media/")) {
    const object = await getCloudflareContext().env.MEDIA?.get(url.slice("/media/".length));
    return object?.body ?? null;
  }
  if (!url.startsWith("https://")) return null;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  return response.ok ? response.body : null;
}

async function photoDataUri(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const images = getCloudflareContext().env.IMAGES;
    if (!images) return null;
    const source = await readSourceImage(url);
    if (!source) return null;
    const result = await images
      .input(source)
      .transform({ width: PHOTO_WIDTH * 2, height: HEIGHT * 2, fit: "cover" })
      .output({ format: "image/jpeg", quality: 78 });
    const bytes = new Uint8Array(await result.response().arrayBuffer());
    let binary = "";
    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    }
    return `data:image/jpeg;base64,${btoa(binary)}`;
  } catch (error) {
    console.error("[og] şəkil hazırlanmadı:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const requested = new URL(request.url).searchParams.get("l");
  const locale: Locale = requested && hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const source = await prisma.property.findFirst({
    where: { ...(await publicPropertyWhere()), slug },
    select: {
      id: true,
      title: true,
      slug: true,
      listingType: true,
      price: true,
      currency: true,
      pricePeriod: true,
      rooms: true,
      area: true,
      type: { select: { name: true, slug: true } },
      city: { select: { name: true, slug: true } },
      district: { select: { name: true, slug: true } },
      images: { orderBy: [{ isCover: "desc" }, { order: "asc" }], take: 1, select: { url: true, thumbUrl: true } },
    },
  });
  if (!source) return new Response("Tapılmadı", { status: 404 });

  const [t, translation] = await Promise.all([
    getTranslations({ locale, namespace: "property" }),
    getPublishedContentTranslation(TRANSLATION_ENTITY_TYPES.PROPERTY, source.id, locale),
  ]);
  const property = applyContentTranslation(
    TRANSLATION_ENTITY_TYPES.PROPERTY,
    localizeKnownContent("property", source, locale),
    translation,
  );
  const typeName = localizeKnownContent("propertyType", source.type, locale).name;
  const location = [
    source.district ? localizeLocation(source.district, locale).name : null,
    localizeLocation(source.city, locale).name,
  ].filter(Boolean).join(", ");
  const listing = source.listingType === LISTING_TYPES.SALE ? t("listingType.sale") : t("listingType.rent");
  const period = source.pricePeriod === "MONTH" ? t("pricePeriod.month") : source.pricePeriod === "DAY" ? t("pricePeriod.day") : null;
  const facts = [
    source.rooms ? t("ogRooms", { count: source.rooms }) : null,
    source.area ? `${Math.round(source.area)} m²` : null,
  ].filter(Boolean).join("  ·  ");
  const photo = await photoDataUri(source.images[0]?.thumbUrl || source.images[0]?.url);

  const response = new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#17202b", color: "#f7f3ec" }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- ImageResponse yalnız <img> qəbul edir.
          <img src={photo} alt="" width={PHOTO_WIDTH} height={HEIGHT} style={{ objectFit: "cover" }} />
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "56px 56px 48px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 12, fontSize: 24, color: "#c4a575", letterSpacing: 2, textTransform: "uppercase" }}>
              <span>{listing}</span>
              <span>·</span>
              <span>{typeName}</span>
            </div>
            <div style={{ display: "block", marginTop: 20, fontSize: photo ? 40 : 52, lineHeight: 1.2, lineClamp: 3 }}>
              {property.title}
            </div>
            <div style={{ display: "flex", marginTop: 18, fontSize: 26, color: "rgba(247,243,236,0.72)" }}>{location}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 60, color: "#ffffff" }}>{formatOgPrice(source.price, source.currency)}</span>
              {period ? <span style={{ fontSize: 28, color: "rgba(247,243,236,0.72)" }}>{period}</span> : null}
            </div>
            {facts ? <div style={{ display: "flex", marginTop: 8, fontSize: 26, color: "rgba(247,243,236,0.8)" }}>{facts}</div> : null}
            <div style={{ display: "flex", marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(196,165,117,0.45)", fontSize: 22, letterSpacing: 4, color: "#c4a575" }}>
              LUXE HOME ESTATE
            </div>
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );

  // Kart qiymət/foto dəyişəndə yenilənməlidir, ona görə qısa brauzer keşi + kənar keşi.
  const cacheControl = "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400";

  // PNG ~800 KB olur; WhatsApp ~300 KB-dan böyük önizləməni göstərmir. JPEG-ə çevrilir,
  // alınmasa PNG olduğu kimi qaytarılır (bayt dəsti əvvəlcədən oxunur ki, fallback mümkün olsun).
  const png = await response.arrayBuffer();
  const images = getCloudflareContext().env.IMAGES;
  if (images) {
    try {
      const jpeg = await images.input(new Response(png).body!).output({ format: "image/jpeg", quality: 82 });
      return new Response(jpeg.response().body, {
        headers: { "Content-Type": "image/jpeg", "Cache-Control": cacheControl },
      });
    } catch (error) {
      console.error("[og] JPEG çevrilməsi alınmadı:", error instanceof Error ? error.message : error);
    }
  }
  return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": cacheControl } });
}
