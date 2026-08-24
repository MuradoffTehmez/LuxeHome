import { ACCOUNT_TYPES, AUTH_KINDS, type AccountType, type AuthKind } from "@/lib/constants";
import { DEFAULT_LOCALE, type Locale } from "@/lib/constants";
import { localeFromPathname, localizePath, pathnameWithoutLocale } from "@/i18n/path-locale";
import { isCabinetPath } from "./public-account-policy";

export type SignedSession = { accountType: AccountType; authKind: AuthKind };

export function isUsableSignedSession(session: SignedSession): boolean {
  return (
    (session.accountType === ACCOUNT_TYPES.STAFF && session.authKind === AUTH_KINDS.STAFF_2FA) ||
    (session.accountType !== ACCOUNT_TYPES.STAFF && session.authKind === AUTH_KINDS.PUBLIC)
  );
}

function reauthPath(
  path: "/giris" | "/daxil-ol",
  pathname: string,
  search: string,
  locale: Locale,
): string {
  return `${localizePath(path, locale)}?davam=${encodeURIComponent(`${pathname}${search}`)}&yeniden=1`;
}

/** Middleware-in yalnız cookie claim-i ilə verdiyi ucuz istiqamət qərarı. */
export function signedSessionRedirect(
  pathname: string,
  search: string,
  session: SignedSession | null,
  preferredLocale: Locale = DEFAULT_LOCALE,
): string | null {
  const routeLocale = pathnameWithoutLocale(pathname) === pathname
    ? preferredLocale
    : localeFromPathname(pathname);
  const routePath = pathnameWithoutLocale(pathname);
  const isAdminRoute = routePath === "/admin" || routePath.startsWith("/admin/");
  const isStaffLoginRoute = routePath === "/giris" || routePath.startsWith("/giris/");

  if (isAdminRoute) {
    if (!session) {
      return reauthPath("/giris", pathname, search, routeLocale);
    }
    if (session.accountType !== ACCOUNT_TYPES.STAFF) return localizePath("/kabinet", routeLocale);
    if (session.authKind !== AUTH_KINDS.STAFF_2FA) {
      return reauthPath("/giris", pathname, search, routeLocale);
    }
  }

  if (isCabinetPath(routePath)) {
    if (!session || session.authKind !== AUTH_KINDS.PUBLIC) {
      return session?.accountType === ACCOUNT_TYPES.STAFF
        ? "/admin"
        : reauthPath("/daxil-ol", pathname, search, routeLocale);
    }
  }

  // D1 projection-u ilə uyğunlaşmayan köhnə cookie burada saxlanılır ki,
  // server guard-un `?yeniden=1` yönləndirməsi sonsuz dövr yaratmasın.
  if (isStaffLoginRoute && new URLSearchParams(search).get("yeniden") === "1") return null;

  if (isStaffLoginRoute && session) {
    return session.accountType === ACCOUNT_TYPES.STAFF
      ? "/admin"
      : localizePath("/kabinet", routeLocale);
  }

  return null;
}
