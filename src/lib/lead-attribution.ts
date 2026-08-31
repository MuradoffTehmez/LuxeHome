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

export function classifyAcquisition(input: { referrer?: string; utmSource?: string; utmMedium?: string }) {
  if (input.utmSource) return { source: input.utmSource, medium: input.utmMedium || "campaign" };
  if (!input.referrer) return { source: "direct", medium: "none" };
  try {
    const hostname = new URL(input.referrer).hostname.toLowerCase();
    if (hostname.includes("google.")) return { source: "google", medium: "organic" };
    if (hostname.includes("bing.com")) return { source: "bing", medium: "organic" };
    if (hostname.includes("yandex.")) return { source: "yandex", medium: "organic" };
    return { source: hostname, medium: "referral" };
  } catch {
    return { source: "direct", medium: "none" };
  }
}

