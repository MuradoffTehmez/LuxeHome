export const ANALYTICS_EVENTS = [
  "phone_click",
  "whatsapp_click",
  "contact_submit",
  "form_submit",
  "property_view",
  "agent_contact",
  "saved_property",
  "saved_search",
  "register",
  "favorite_add",
  "favorite_remove",
  "compare_add",
  "compare_remove",
  "filter_submit",
  "agency_contact",
  "submission_start",
  "submission_complete",
  "partner_card_click",
  "partner_profile_view",
  "partner_external_website_click",
  "partner_listing_click",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];
export type AnalyticsPayload = Record<string, string | number | boolean>;

const PII_KEY = /(name|email|phone|tel|address|message|surname|firstname|lastname|whatsapp|query|search_term)/i;
/**
 * Hadisə yükündə icazə verilən açarlar (ağ siyahı).
 *
 * `partner_name` qəsdən yoxdur: `PII_KEY` `name` fraqmentini bloklayır və həmin
 * qorumanı tərəfdaş adı üçün zəiflətməyə dəyməz — ad `partner_id` üzərindən
 * hesabatda onsuz da bərpa olunur.
 */
const SAFE_KEY =
  /^(property_id|agency_id|partner_id|partner_type|content_id|content_type|placement|listing_type|filter_count|result_count|action|method|status)$/;

export function analyticsRuntimeEnabled(input: {
  production: boolean;
  measurementId?: string | null;
  consent: boolean;
}) {
  return input.production && Boolean(input.measurementId?.trim()) && input.consent;
}

export function sanitizeAnalyticsPayload(
  event: string,
  payload: Record<string, unknown>,
): AnalyticsPayload | null {
  if (!(ANALYTICS_EVENTS as readonly string[]).includes(event)) return null;
  const clean: AnalyticsPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (PII_KEY.test(key) || !SAFE_KEY.test(key)) return null;
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") return null;
    clean[key] = typeof value === "string" ? value.slice(0, 80) : value;
  }
  return clean;
}

export const ANALYTICS_CONSENT_COOKIE = "analytics_consent";

export function hasAnalyticsConsent(cookieValue?: string) {
  const source = cookieValue ?? (typeof document !== "undefined" ? document.cookie : "");
  return source.split(";").some((part) => part.trim() === `${ANALYTICS_CONSENT_COOKIE}=granted`);
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    pendingAnalyticsEvents?: Array<{ event: AnalyticsEvent; payload: AnalyticsPayload }>;
  }
}

/**
 * GA4 səhifə baxışına filtr, axtarış və təsdiq tokenləri daxil olmamalıdır.
 * Marşrut ölçülür, query/hash isə yalnız domen və path saxlanılaraq atılır.
 */
export function sanitizeAnalyticsPageLocation(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
}

export function trackEvent(event: AnalyticsEvent, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const measurementId = gaId || gtmId;
  if (!analyticsRuntimeEnabled({
    production: process.env.NODE_ENV === "production",
    measurementId,
    consent: hasAnalyticsConsent(),
  })) return;
  const clean = sanitizeAnalyticsPayload(event, payload);
  if (!clean) return;

  if (gaId) {
    if (window.gtag) {
      window.gtag("event", event, clean);
    } else {
      window.pendingAnalyticsEvents = window.pendingAnalyticsEvents ?? [];
      window.pendingAnalyticsEvents.push({ event, payload: clean });
    }
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...clean });
}
