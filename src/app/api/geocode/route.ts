import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { getOptionalUser } from "@/lib/auth/guard";
import { AdminGuardError, assertSameOrigin } from "@/lib/admin/guard";
import { runtimeEnv } from "@/lib/runtime-env";

/**
 * Ünvan → koordinat (və əksi) çevirməsi.
 *
 * **Niyə proxy, birbaşa brauzerdən deyil.** Geoapify açarı istifadəçiyə və
 * brauzer paketinə çıxmamalıdır. Üstəlik panel və kabinet marşrutları sərt CSP
 * altındadır (`src/middleware.ts`); `connect-src 'self'` kənar API-yə birbaşa
 * müraciəti bağlayır.
 *
 * Geoapify seçilib, çünki nəticəni elanın koordinatı kimi bazada saxlamağa icazə
 * verir və pulsuz paket kommersiya istifadəsini dəstəkləyir. Açar yalnız
 * `GEOAPIFY_API_KEY` Worker secret-indən oxunur.
 *
 * Marşrut `/api` altında olduğu üçün middleware-dən keçmir: mənbə yoxlaması,
 * sessiya və sürət limiti burada açıq şəkildə tətbiq olunur.
 */

export const dynamic = "force-dynamic";

const GEOAPIFY = "https://api.geoapify.com/v1/geocode";

type GeocodeResult = { label: string; latitude: number; longitude: number };

type GeoapifyFeature = {
  properties?: {
    formatted?: string;
    lat?: number;
    lon?: number;
  };
};

type GeoapifyResponse = { features?: GeoapifyFeature[] };

class GeocodeConfigurationError extends Error {}

function toResult(feature: GeoapifyFeature): GeocodeResult | null {
  const latitude = Number(feature.properties?.lat);
  const longitude = Number(feature.properties?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    label: feature.properties?.formatted?.trim() || `${latitude}, ${longitude}`,
    latitude,
    longitude,
  };
}

async function assertLimit(userId: string): Promise<void> {
  // Lokal `next dev` mühitində binding olmaya bilər — limit orada tətbiq edilmir
  const limiter = getCloudflareContext().env.ADMIN_LIMIT;
  if (!limiter) return;
  const { success } = await limiter.limit({ key: `geocode:${userId}` });
  if (!success) throw new AdminGuardError("Çox sayda sorğu oldu. Bir dəqiqə gözləyin.");
}

async function callGeoapify(path: "search" | "reverse", params: URLSearchParams): Promise<GeoapifyResponse> {
  const apiKey = runtimeEnv("GEOAPIFY_API_KEY");
  if (!apiKey) throw new GeocodeConfigurationError("GEOAPIFY_API_KEY təyin edilməyib");

  params.set("apiKey", apiKey);
  params.set("format", "geojson");

  const response = await fetch(`${GEOAPIFY}/${path}?${params.toString()}`, {
    headers: { Accept: "application/geo+json, application/json" },
    // Eyni ünvan üçün təkrar sorğular provayder limitini xərcləməsin.
    next: { revalidate: 86_400 },
  });
  if (!response.ok) throw new Error(`Geoapify ${response.status}`);
  return (await response.json()) as GeoapifyResponse;
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
  const requestedLanguage = url.searchParams.get("lang");
  const language = requestedLanguage === "en" || requestedLanguage === "ru" ? requestedLanguage : "az";

  try {
    if (latitude && longitude) {
      const lat = Number(latitude);
      const lon = Number(longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return NextResponse.json({ error: "Koordinat düzgün deyil." }, { status: 400 });
      }

      const payload = await callGeoapify("reverse", new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        lang: language,
        limit: "1",
      }));
      const result = (payload.features ?? []).map(toResult).find(Boolean) ?? null;
      return NextResponse.json(
        { results: result ? [result] : [] },
        { headers: { "X-Geocoding-Provider": "Geoapify" } },
      );
    }

    if (!query || query.length < 3) {
      return NextResponse.json({ results: [] });
    }
    if (query.length > 180) {
      return NextResponse.json({ error: "Ünvan sorğusu çox uzundur." }, { status: 400 });
    }

    const payload = await callGeoapify("search", new URLSearchParams({
      text: query,
      filter: "countrycode:az",
      bias: "proximity:49.892,40.3777",
      lang: language,
      limit: "6",
    }));

    const results = (payload.features ?? [])
      .map(toResult)
      .filter((item): item is GeocodeResult => item !== null);

    return NextResponse.json(
      { results },
      { headers: { "X-Geocoding-Provider": "Geoapify" } },
    );
  } catch (error) {
    console.error("[geocode]", error);
    if (error instanceof GeocodeConfigurationError) {
      return NextResponse.json({ error: "Ünvan xidməti konfiqurasiya edilməyib." }, { status: 503 });
    }
    return NextResponse.json({ error: "Ünvan xidməti cavab vermədi." }, { status: 502 });
  }
}
