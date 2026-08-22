import { ACCOUNT_TYPES, type AccountType } from "@/lib/constants";

/** İctimai giriş yalnız ziyarətçi, mülk sahibi və agentlik hesabları üçündür. */
export function canUsePublicSignIn(accountType: AccountType): boolean {
  return accountType !== ACCOUNT_TYPES.STAFF;
}

/** İdarə panelinə yalnız şirkət əməkdaşları buraxılır. */
export function canAccessAdmin(accountType: AccountType): boolean {
  return accountType === ACCOUNT_TYPES.STAFF;
}

/** İctimai girişdən sonra qayıdılacaq yalnız təhlükəsiz saytdaxili ünvan. */
export function safePublicTarget(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return /^\/(?!\/)[A-Za-z0-9\-._~/?#[\]@!$&'()*+,;=%]*$/.test(value) && !value.startsWith("/admin")
    ? value
    : undefined;
}

/** Middleware üçün kabinetin özü və bütün alt marşrutları. */
export function isCabinetPath(pathname: string): boolean {
  return pathname === "/kabinet" || pathname.startsWith("/kabinet/");
}
