import { ACCOUNT_TYPES, AUTH_KINDS, type AccountType, type AuthKind } from "@/lib/constants";
import { isCabinetPath } from "./public-account-policy";

export type SignedSession = { accountType: AccountType; authKind: AuthKind };

export function isUsableSignedSession(session: SignedSession): boolean {
  return (
    (session.accountType === ACCOUNT_TYPES.STAFF && session.authKind === AUTH_KINDS.STAFF_2FA) ||
    (session.accountType !== ACCOUNT_TYPES.STAFF && session.authKind === AUTH_KINDS.PUBLIC)
  );
}

function reauthPath(path: "/giris" | "/daxil-ol", pathname: string, search: string): string {
  return `${path}?davam=${encodeURIComponent(`${pathname}${search}`)}&yeniden=1`;
}

/** Middleware-in yalnız cookie claim-i ilə verdiyi ucuz istiqamət qərarı. */
export function signedSessionRedirect(
  pathname: string,
  search: string,
  session: SignedSession | null,
): string | null {
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isStaffLoginRoute = pathname === "/giris" || pathname.startsWith("/giris/");

  if (isAdminRoute) {
    if (!session) {
      return reauthPath("/giris", pathname, search);
    }
    if (session.accountType !== ACCOUNT_TYPES.STAFF) return "/kabinet";
    if (session.authKind !== AUTH_KINDS.STAFF_2FA) return reauthPath("/giris", pathname, search);
  }

  if (isCabinetPath(pathname)) {
    if (!session || session.authKind !== AUTH_KINDS.PUBLIC) {
      return session?.accountType === ACCOUNT_TYPES.STAFF
        ? "/admin"
        : reauthPath("/daxil-ol", pathname, search);
    }
  }

  // D1 projection-u ilə uyğunlaşmayan köhnə cookie burada saxlanılır ki,
  // server guard-un `?yeniden=1` yönləndirməsi sonsuz dövr yaratmasın.
  if (isStaffLoginRoute && new URLSearchParams(search).get("yeniden") === "1") return null;

  if (isStaffLoginRoute && session) {
    return session.accountType === ACCOUNT_TYPES.STAFF ? "/admin" : "/kabinet";
  }

  return null;
}
