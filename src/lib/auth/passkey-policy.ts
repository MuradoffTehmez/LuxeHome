/**
 * Passkey (WebAuthn) üçün saf qərarlar (#109) — `next/headers` və D1 olmadan test olunur.
 *
 * RP ID brauzerdə açılan domendir və passkey ona bağlanır. Dəyər `Host` başlığından
 * götürülür, amma **yalnız bizim domenlər** qəbul edilir: başqa host gəlsə mərasim
 * başlamır. Beləliklə yanlış konfiqurasiya və ya saxta başlıq başqa domen üçün
 * etibarlı challenge verə bilmir.
 */

const WORKERS_SUFFIX = ".amiyevbahadur.workers.dev";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

export type RelyingParty = { rpID: string; origin: string };

export function relyingPartyFor(host: string | null | undefined, canonicalHost: string): RelyingParty | null {
  if (!host) return null;
  const value = host.trim().toLowerCase();
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/.test(value)) return null;
  const hostname = value.replace(/:\d+$/, "");
  const canonical = canonicalHost.toLowerCase();

  if (LOCAL_HOSTS.has(hostname)) return { rpID: hostname, origin: `http://${value}` };
  // İstehsal domenində port olmur — portlu dəyər saxta başlıq əlamətidir.
  if (value !== hostname) return null;
  if (hostname === canonical || hostname === `www.${canonical}` || hostname.endsWith(WORKERS_SUFFIX)) {
    return { rpID: hostname, origin: `https://${hostname}` };
  }
  return null;
}

export const PASSKEY_NAME_MAX = 60;
/** Bir əməkdaşın ən çox passkey sayı — siyahı idarəolunan qalsın. */
export const MAX_PASSKEYS_PER_USER = 10;

/** İstifadəçinin verdiyi adı təmizləyir; boşdursa cihaza uyğun defolt ad. */
export function passkeyName(input: unknown, fallback: string): string {
  const name = typeof input === "string" ? input.replace(/\s+/g, " ").trim().slice(0, PASSKEY_NAME_MAX) : "";
  return name || fallback;
}

