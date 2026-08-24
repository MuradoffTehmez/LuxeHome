const PRODUCTION_HOST = "luxehomeestate.az";

type CanonicalHostInput = {
  hostname: string;
  protocol: string;
  pathname: string;
  search: string;
  isProduction: boolean;
  isStaging: boolean;
};

/** Production üçün bütün alternativ host/protokolları bir hop-da canonical URL-ə çevirir. */
export function getCanonicalHostRedirect(input: CanonicalHostInput): string | null {
  if (!input.isProduction || input.isStaging) return null;
  if (input.hostname === PRODUCTION_HOST && input.protocol === "https:") return null;
  return `https://${PRODUCTION_HOST}${input.pathname}${input.search}`;
}
