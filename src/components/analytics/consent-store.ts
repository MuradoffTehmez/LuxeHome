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

/** Razılıq geri çəkiləndə `_ga*`/`_gid` və s. cookie-ləri bütün domen variantlarında silir. */
export function purgeAnalyticsCookies(): number {
  const names = analyticsCookieNames(document.cookie);
  for (const cookie of expiredCookieStrings(names, location.hostname)) document.cookie = cookie;
  return names.length;
}
