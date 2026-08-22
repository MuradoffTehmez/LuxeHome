import type { AccountType, Role } from "@/lib/constants";

/**
 * Guard-ların qaytardığı istifadəçi.
 * Parol hash-ı və TOTP sirri qəsdən daxil deyil — bu tip UI-a qədər gedir.
 */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Hesabın kim olduğu — panel yalnız `STAFF` üçün açıqdır. */
  accountType: AccountType;
  mustChangePassword: boolean;
  totpEnabled: boolean;
};

/**
 * Girişin ara mərhələsi: parol keçib, ikinci addım gözlənilir.
 * `enroll` — 2FA hələ qurulmayıb, `totp` — kod gözlənilir.
 */
export type AuthStage = "totp" | "enroll";

/** Server action-ların forma vəziyyəti. */
export type FormState = { error?: string };
