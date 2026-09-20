const MAX_VALUE = 300;

function clean(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_VALUE) : null;
}

export function readLeadAttribution(formData: FormData) {
  return {
    acquisitionSource: clean(formData.get("acquisitionSource")),
    acquisitionMedium: clean(formData.get("acquisitionMedium")),
    landingPage: clean(formData.get("landingPage")),
    referrer: clean(formData.get("referrer")),
    utmSource: clean(formData.get("utmSource")),
    utmMedium: clean(formData.get("utmMedium")),
    utmCampaign: clean(formData.get("utmCampaign")),
    utmTerm: clean(formData.get("utmTerm")),
    utmContent: clean(formData.get("utmContent")),
  };
}

/**
 * Axtarış sistemi hostları.
 *
 * Əvvəl `hostname.includes("bing.com")` yazılırdı; alt sətir istənilən yerdə uyğun
 * gəlirdi, yəni `bing.com.reklam.example` və ya `notbing.com` da «bing» kimi
 * təsnif olunurdu. `(^|\.)` label sərhədini, sondakı hissə isə TLD-ni ən çoxu iki
 * səviyyə ilə bağlayır — `google.com.tr` tutulur, `google.com.evil.example` yox.
 *
 * Google və Yandex üçün TLD açıq saxlanılır (`google.az`, `yandex.com.tr`),
 * Bing isə yalnız `bing.com` işlədir.
 */
const SEARCH_ENGINE_HOSTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/(^|\.)google\.[a-z]{2,}(\.[a-z]{2,})?$/, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)yandex\.[a-z]{2,}(\.[a-z]{2,})?$/, "yandex"],
];

export function classifyAcquisition(input: { referrer?: string; utmSource?: string; utmMedium?: string }) {
  if (input.utmSource) return { source: input.utmSource, medium: input.utmMedium || "campaign" };
  if (!input.referrer) return { source: "direct", medium: "none" };
  try {
    const hostname = new URL(input.referrer).hostname.toLowerCase().replace(/\.$/, "");
    for (const [pattern, source] of SEARCH_ENGINE_HOSTS) {
      if (pattern.test(hostname)) return { source, medium: "organic" };
    }
    return { source: hostname, medium: "referral" };
  } catch {
    return { source: "direct", medium: "none" };
  }
}

