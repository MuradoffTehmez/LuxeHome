import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { getOptionalUser } from "@/lib/auth/guard";
import { AdminGuardError, assertSameOrigin } from "@/lib/admin/guard";

/**
 * Ünvan → koordinat (və əksi) çevirməsi.
 *
 * **Niyə proxy, birbaşa brauzerdən deyil.** İki səbəb:
 * 1. Nominatim istifadə qaydaları sorğunun tətbiqi tanıdan `User-Agent` daşımasını
 *    tələb edir — brauzer bu başlığı təyin etməyə imkan vermir.
 * 2. Panel və kabinet marşrutları sərt CSP altındadır (`src/middleware.ts`);
 *    `connect-src 'self'` kənar API-yə birbaşa müraciəti onsuz da bağlayır.
 *
 * Marşrut `/api` altında olduğu üçün middleware-dən keçmir: mənbə yoxlaması,
 * sessiya və sürət limiti burada açıq şəkildə tətbiq olunur.
 */

export const dynamic = "force-dynamic";

const NOMINATIM = "https://nominatim.openstreetmap.org";

/** Nominatim tətbiqin tanınmasını tələb edir — anonim sorğular bloklanır. */
const USER_AGENT = "LuxeHomeEstate/1.0 (+https://luxehomeestate.az)";

/** Nəticələr Azərbaycanla məhdudlaşır — elanlar yalnız yerli bazardadır. */
const COUNTRY_CODES = "az";

type GeocodeResult = { label: string; latitude: number; longitude: number };

type NominatimPlace = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

function toResult(place: NominatimPlace): GeocodeResult | null {
  const latitude = Number(place.lat);
  const longitude = Number(place.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { label: place.display_name?.trim() || `${latitude}, ${longitude}`, latitude, longitude };
}

async function assertLimit(userId: string): Promise<void> {
  // Lokal `next dev` mühitində binding olmaya bilər — limit orada tətbiq edilmir
  const limiter = getCloudflareContext().env.ADMIN_LIMIT;
  if (!limiter) return;
  const { success } = await limiter.limit({ key: `geocode:${userId}` });
  if (!success) throw new AdminGuardError("Çox sayda sorğu oldu. Bir dəqiqə gözləyin.");
}

async function callNominatim(path: string): Promise<unknown> {
  const response = await fetch(`${NOMINATIM}${path}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    // Eyni ünvan üçün təkrar sorğular Nominatim-ə çatmasın deyə bir gün keşlənir.
    next: { revalidate: 86_400 },
  });
  if (!response.ok) throw new Error(`Nominatim ${response.status}`);
  return response.json();
}

export async function GET(request: Request) {
  try {
    await assertSameOrigin();
    // Ünvan axtarışı həm paneldə, həm də kabinetdəki «elan yerləşdir» formasında
    // işlədilir, ona görə konkret səlahiyyət deyil, etibarlı sessiya tələb olunur.
    const user = await getOptionalUser();
    if (!user) return NextResponse.json({ error: "Sessiya tapılmadı." }, { status: 401 });
    await assertLimit(user.id);
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();
  const latitude = url.searchParams.get("lat");
  const longitude = url.searchParams.get("lon");

  try {
    if (latitude && longitude) {
      const place = (await callNominatim(
        `/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&accept-language=az`,
      )) as NominatimPlace;
      const result = toResult(place);
      return NextResponse.json({ results: result ? [result] : [] });
    }

    if (!query || query.length < 3) {
      return NextResponse.json({ results: [] });
    }

    const places = (await callNominatim(
      `/search?format=jsonv2&limit=6&countrycodes=${COUNTRY_CODES}&accept-language=az&q=${encodeURIComponent(query)}`,
    )) as NominatimPlace[];

    const results = (Array.isArray(places) ? places : [])
      .map(toResult)
      .filter((item): item is GeocodeResult => item !== null);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[geocode]", error);
    return NextResponse.json({ error: "Ünvan xidməti cavab vermədi." }, { status: 502 });
  }
}
