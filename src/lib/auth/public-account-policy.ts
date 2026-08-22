import { ACCOUNT_TYPES } from "@/lib/constants";

/** İctimai giriş yalnız ziyarətçi, mülk sahibi və agentlik hesabları üçündür. */
export function canUsePublicSignIn(accountType: string): boolean {
  return (
    accountType === ACCOUNT_TYPES.USER ||
    accountType === ACCOUNT_TYPES.OWNER ||
    accountType === ACCOUNT_TYPES.AGENCY
  );
}

/** İdarə panelinə yalnız şirkət əməkdaşları buraxılır. */
export function canAccessAdmin(accountType: string): boolean {
  return accountType === ACCOUNT_TYPES.STAFF;
}

/** İctimai girişdən sonra qayıdılacaq yalnız təhlükəsiz saytdaxili ünvan. */
export function safePublicTarget(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return /^\/(?!\/)[A-Za-z0-9\-._~/?#[\]@!$&'()*+,;=%]*$/.test(value) && !value.startsWith("/admin")
    ? value
    : undefined;
}

/** Giriş və qeydiyyat ekranları arasında yalnız təhlükəsiz davam ünvanını daşıyır. */
export function accountAuthHref(path: "/daxil-ol" | "/qeydiyyat", next?: string): string {
  const target = safePublicTarget(next);
  return target ? `${path}?davam=${encodeURIComponent(target)}` : path;
}

/** Middleware üçün kabinetin özü və bütün alt marşrutları. */
export function isCabinetPath(pathname: string): boolean {
  return pathname === "/kabinet" || pathname.startsWith("/kabinet/");
}

type PublicSignInUser = {
  accountType: string;
  isActive: boolean;
  lockedUntil: Date | null;
};

/** Parol yoxlanandan sonra ictimai girişin nəticəsini sızdırmadan müəyyən edir. */
export function publicSignInOutcome(
  user: PublicSignInUser | null,
  passwordMatches: boolean,
  now: Date,
): "INVALID" | "STAFF" | "LOCKED" | "AUTHENTICATED" {
  if (!user || !user.isActive || !passwordMatches) return "INVALID";
  if (!canUsePublicSignIn(user.accountType)) return "STAFF";
  if (user.lockedUntil && user.lockedUntil > now) return "LOCKED";
  return "AUTHENTICATED";
}
