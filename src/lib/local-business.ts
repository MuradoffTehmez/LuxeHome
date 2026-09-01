import { unstable_cache } from "next/cache";

import { SETTING_KEYS, getAllSettings } from "@/lib/settings";
import { SEO_SETTING_KEYS } from "@/lib/constants";
import { parseJsonObject, type LocalSeoSettings } from "@/lib/serp";

/**
 * Şirkətin yerli biznes profili — struktur data və «Əlaqə» səhifəsi üçün tək oxu nöqtəsi.
 *
 * **Niyə lazım oldu.** `/admin/serp/parametrler` səhifəsi koordinat, iş saatları,
 * xidmət bölgələri və rəsmi sosial profilləri D1-ə yazırdı, amma bu dəyərləri
 * **heç bir ictimai səth oxumurdu**: `organizationSchema()` yalnız `siteConfig`-dən
 * qidalanırdı. Nəticədə redaktor Local SEO formasını doldurur, `geo` və
 * `openingHoursSpecification` isə JSON-LD-yə heç vaxt düşmürdü.
 *
 * **Koordinatın tək mənbəyi.** Ofis nöqtəsi `Parametrlər → Ofisin xəritədəki yeri`
 * bölməsində xəritədən seçilir və `site.contact_*` açarlarında saxlanılır. `seo.local`
 * JSON-undakı köhnə `latitude`/`longitude` sahələri yalnız geriyə uyğunluq üçün
 * fallback kimi oxunur — yeni yazma orada aparılmır.
 */

export type LocalBusinessProfile = {
  latitude: number | null;
  longitude: number | null;
  /** «Mo-Fr 09:00-18:00» formatında sətirlər; boş massiv = təsdiqlənməyib. */
  openingHours: string[];
  serviceAreas: string[];
  googleMapsUrl: string | null;
  socialProfiles: string[];
};

const EMPTY_PROFILE: LocalBusinessProfile = {
  latitude: null,
  longitude: null,
  openingHours: [],
  serviceAreas: [],
  googleMapsUrl: null,
  socialProfiles: [],
};

/** Boş, pozulmuş və ya diapazondan kənar dəyər `null` qaytarır. */
function toCoordinate(value: unknown, limit: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > limit) return null;
  return parsed;
}

function toList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

async function readLocalBusinessProfile(): Promise<LocalBusinessProfile> {
  const settings = await getAllSettings();
  const local = parseJsonObject<Partial<LocalSeoSettings>>(settings[SEO_SETTING_KEYS.LOCAL], {});

  const latitude =
    toCoordinate(settings[SETTING_KEYS.CONTACT_LATITUDE], 90) ?? toCoordinate(local.latitude, 90);
  const longitude =
    toCoordinate(settings[SETTING_KEYS.CONTACT_LONGITUDE], 180) ?? toCoordinate(local.longitude, 180);

  return {
    // Yarımçıq koordinat mənasızdır — biri yoxdursa hər ikisi buraxılır.
    latitude: latitude != null && longitude != null ? latitude : null,
    longitude: latitude != null && longitude != null ? longitude : null,
    openingHours: toList(local.openingHours),
    serviceAreas: toList(local.serviceAreas),
    googleMapsUrl: typeof local.googleMapsUrl === "string" && local.googleMapsUrl.trim()
      ? local.googleMapsUrl.trim()
      : null,
    socialProfiles: toList(local.socialProfiles),
  };
}

/**
 * Profil hər ictimai sorğuda root layout-dan oxunur, ona görə keşlənir. Parametrlər
 * dəyişəndə `revalidatePath("/", "layout")` (bax `parametrler/actions.ts`) keşi
 * onsuz da təzələyir.
 */
export const getLocalBusinessProfile = unstable_cache(
  async (): Promise<LocalBusinessProfile> => {
    try {
      return await readLocalBusinessProfile();
    } catch (error) {
      // Build və ya müvəqqəti D1 nasazlığı struktur datanı çökdürməməlidir.
      console.error("[local-business] profil oxunmadı:", error);
      return EMPTY_PROFILE;
    }
  },
  ["local-business-profile-v1"],
  { revalidate: 300 },
);
