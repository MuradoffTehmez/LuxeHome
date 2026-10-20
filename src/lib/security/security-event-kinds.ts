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
  /** Telegram hesabı bağlandı və ya başqası ilə əvəzləndi. */
  TELEGRAM_LINKED: "TELEGRAM_LINKED",
  TELEGRAM_UNLINKED: "TELEGRAM_UNLINKED",
  /** Kabinetdən Google/Apple/Facebook giriş üsulu bağlandı və ya ayrıldı (`detail.provider`). */
  LOGIN_METHOD_LINKED: "LOGIN_METHOD_LINKED",
  LOGIN_METHOD_UNLINKED: "LOGIN_METHOD_UNLINKED",
} as const;
export type SecurityEventKind = (typeof SECURITY_EVENT_KINDS)[keyof typeof SECURITY_EVENT_KINDS];
