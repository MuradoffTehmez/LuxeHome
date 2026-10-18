/** Təhlükəsizlik hadisəsi növləri (#264) — saf modul: auth qatı jurnala dövri asılılıqsız yaza bilsin. */
export const SECURITY_EVENT_KINDS = {
  /** Uğurlu giriş tanınmayan cihaz və IP-dən. */
  NEW_DEVICE_LOGIN: "NEW_DEVICE_LOGIN",
  /** Uğursuz cəhdlər hesabı kilidlədi. */
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  /** Əməkdaş icazəsi olmayan panel əməliyyatına/səhifəsinə müraciət etdi. */
  FORBIDDEN: "FORBIDDEN",
  /** Başqa mənbədən (CSRF) yazma cəhdi rədd edildi. */
  CSRF_BLOCKED: "CSRF_BLOCKED",
  /** Panel/kabinet yazma limiti aşıldı. */
  RATE_LIMITED: "RATE_LIMITED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
} as const;
export type SecurityEventKind = (typeof SECURITY_EVENT_KINDS)[keyof typeof SECURITY_EVENT_KINDS];
