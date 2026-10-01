import { useSyncExternalStore } from "react";
import {
  analyticsCookieNames,
  expiredCookieStrings,
  parseConsentCookie,
  serializeConsentCookie,
  type ConsentChoice,
} from "@/lib/analytics-consent";

/** `pending` — hələ brauzerdə oxunmayıb (server HTML-i və hidratasiyanın ilk render-i). */
export type ConsentState = ConsentChoice | "pending";

let preferencesOpen = false;
let opener: HTMLElement | null = null;
/** Cookie yazıla bilmirsə (brauzer bloklayıb) seçim yalnız bu sessiya üçün yaddaşda qalır. */
let memoryChoice: ConsentChoice = "unset";
const listeners = new Set<() => void>();

function notify() {
  for (const listener of [...listeners]) listener();
}

/**
 * Cookie dəyişəndə brauzer hadisə vermir. Seçim başqa tabda edilibsə, bu tab fokus aldıqda və ya
 * görünən olduqda yenidən oxunur; öz tabımızdakı dəyişikliklər `notify()` ilə bildirilir.
 */
export function subscribeToConsent(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("focus", listener);
  document.addEventListener("visibilitychange", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("focus", listener);
    document.removeEventListener("visibilitychange", listener);
  };
}

export function readConsent(): ConsentChoice {
  const stored = parseConsentCookie(document.cookie);
  return stored === "unset" ? memoryChoice : stored;
}

/** Server və hidratasiyanın ilk render-i `pending` alır: banner server HTML-inə düşmür. */
export function useAnalyticsConsent(): ConsentState {
  return useSyncExternalStore<ConsentState>(subscribeToConsent, readConsent, () => "pending");
}

export function usePreferencesOpen(): boolean {
  return useSyncExternalStore(subscribeToConsent, () => preferencesOpen, () => false);
}

export function setConsent(choice: Exclude<ConsentChoice, "unset">) {
  document.cookie = serializeConsentCookie(choice, location.protocol === "https:");
  memoryChoice = parseConsentCookie(document.cookie) === choice ? "unset" : choice;
  closeConsentPreferences();
  notify();
}

/** Footer və cookie siyasəti düyməsi: artıq verilmiş seçimi yenidən göstərir. */
export function openConsentPreferences() {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  preferencesOpen = true;
  notify();
}

export function closeConsentPreferences() {
  if (!preferencesOpen) return;
  preferencesOpen = false;
  const target = opener;
  opener = null;
  notify();
  // Fokus banner DOM-dan çıxandan sonra açan düyməyə qaytarılır.
  if (target) requestAnimationFrame(() => target.isConnected && target.focus());
}

/** GA-nın rəsmi söndürmə bayrağı: `window['ga-disable-G-XXXX'] = true` bütün sonrakı hit-ləri bağlayır. */
export function setGaDisabled(gaId: string, disabled: boolean) {
  (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = disabled;
}

/**
 * Razılıq geri çəkildi (bu və ya başqa tabda) və ya heç verilməyib: yüklənmiş analitikanı dayandırır.
 *
 * - GA birbaşa qoşulubsa `ga-disable-<ID>` bayrağı sonrakı hit-ləri bağlayır.
 * - Gözləyən hadisələr atılır, analitika cookie-ləri silinir.
 * - **GTM konteyneri yüklənibsə** onu dayandırmağın yolu yoxdur — səhifə yenilənir. Qərar cookie-lərin
 *   sayından ASILI DEYİL: seçim başqa tabda geri çəkiləndə o tab cookie-ləri artıq silə bilər
 *   (`purged === 0`), amma bu tabda konteyner və onun tag-ları hələ işləyir. Yenilənmədən sonra
 *   konteyner yüklənmir (razılıq yoxdur), ona görə dövr yaranmır.
 */
export function withdrawAnalytics(options: { gaId?: string }): { purged: number; reloaded: boolean } {
  if (options.gaId) setGaDisabled(options.gaId, true);
  window.pendingAnalyticsEvents = [];
  const purged = purgeAnalyticsCookies();
  const gtmRunning = !options.gaId && Boolean(document.getElementById("luxe-gtm"));
  if (gtmRunning) location.reload();
  return { purged, reloaded: gtmRunning };
}

/** Razılıq geri çəkiləndə `_ga*`/`_gid` və s. cookie-ləri bütün domen variantlarında silir. */
export function purgeAnalyticsCookies(): number {
  const names = analyticsCookieNames(document.cookie);
  for (const cookie of expiredCookieStrings(names, location.hostname)) document.cookie = cookie;
  return names.length;
}
