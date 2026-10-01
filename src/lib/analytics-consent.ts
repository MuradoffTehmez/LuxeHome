import { ANALYTICS_CONSENT_COOKIE } from "@/lib/client-analytics";

/**
 * Analitika razılığının saf məntiqi (DOM-suz, testə yararlı).
 *
 * Seçim `analytics_consent` cookie-sində saxlanılır: `granted`, `denied` və ya cookie yoxdur
 * (`unset`). Cookie-ni brauzer oxuyur, server oxumur — server oxusa anonim HTML-in kənar keşi
 * (`edge-html-cache`) pozulardı. Ona görə banner server HTML-ində heç vaxt render olunmur.
 */
export type ConsentChoice = "granted" | "denied" | "unset";

/** Seçim bir il saxlanılır (cookie siyasəti ilə eyni). */
export const CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export function parseConsentCookie(cookieString: string): ConsentChoice {
  for (const part of cookieString.split(";")) {
    const trimmed = part.trim();
    if (trimmed === `${ANALYTICS_CONSENT_COOKIE}=granted`) return "granted";
    if (trimmed === `${ANALYTICS_CONSENT_COOKIE}=denied`) return "denied";
  }
  return "unset";
}

export function serializeConsentCookie(choice: Exclude<ConsentChoice, "unset">, secure: boolean): string {
  return `${ANALYTICS_CONSENT_COOKIE}=${choice}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/**
 * Google Analytics / Tag Manager cookie-ləri: `_ga`, `_ga_<ID>`, `_gid`, `_gat*`, `_gcl_*`,
 * `_dc_gtm_*`. Razılıq geri çəkiləndə bunlar silinir.
 */
const ANALYTICS_COOKIE_NAME = /^(_ga|_ga_[A-Za-z0-9]+|_gid|_gat(_.+)?|_gcl_.+|_dc_gtm_.+)$/;

export function analyticsCookieNames(cookieString: string): string[] {
  const names = new Set<string>();
  for (const part of cookieString.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name && ANALYTICS_COOKIE_NAME.test(name)) names.add(name);
  }
  return [...names];
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * GA cookie-si çox vaxt əsas domendə (`.luxehomeestate.az`) qoyulur. Brauzer silinən cookie-nin
 * `Domain`-ini əvvəlcədən bilmir, ona görə host və bütün üst domenlər (nöqtəli və nöqtəsiz) sınanır.
 */
export function cookieDomainCandidates(hostname: string): string[] {
  if (!hostname || hostname === "localhost" || IPV4.test(hostname) || hostname.includes(":")) return [""];
  const parts = hostname.split(".");
  const candidates = new Set<string>([""]);
  for (let index = 0; index < parts.length - 1; index += 1) {
    const domain = parts.slice(index).join(".");
    candidates.add(domain);
    candidates.add(`.${domain}`);
  }
  return [...candidates];
}

/** Hər ad və domen üçün `document.cookie`-yə yazılacaq «vaxtı keçmiş» cookie sətirləri. */
export function expiredCookieStrings(names: readonly string[], hostname: string): string[] {
  const domains = cookieDomainCandidates(hostname);
  return names.flatMap((name) =>
    domains.map(
      (domain) => `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domain ? `; Domain=${domain}` : ""}`,
    ),
  );
}
