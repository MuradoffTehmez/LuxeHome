import { isLockActive } from "./lockout";

/**
 * İkinci mərhələ qapısının saf qərarları.
 *
 * `staff-login-policy.ts` ilə eyni səbəbə görə ayrılıb: qərar D1 və `next/headers`
 * olmadan test edilə bilməlidir. Səhv olduqda nəticə səssizcə baş verir — ya panel
 * hamıya bağlanar, ya da məcburi 2FA yan keçilər.
 */

/**
 * Əməkdaş sessiyası yalnız TOTP **həqiqətən qurulduqdan** sonra açıla bilər.
 *
 * Qurulum ara-cookie-si prosesin başında verilir, sonunda yox. Yalnız cookie-nin
 * mərhələsinə baxmaq kifayət deyildi: parolu bilən tərəf qurulum ekranını atlayıb
 * sessiya açan action-ı birbaşa çağıra bilirdi. Yoxlama `startSession()`-dadır ki,
 * sessiya açan hər axın — indiki və gələcək — eyni qapıdan keçsin.
 */
export function canStartStaffSession(user: { totpEnabledAt: Date | null }): boolean {
  return user.totpEnabledAt !== null;
}

export type TwoFactorGate = "RATE_LIMITED" | "LOCKED" | "PROCEED";

/**
 * Kod yoxlanmazdan **əvvəl** verilən qərar.
 *
 * `registerFailure()` uğursuz cəhdi sayır və beşincidən sonra `lockedUntil` yazır,
 * amma yazılan dəyəri oxuyan tərəf olmasa kilid heç nəyi dayandırmır. Parol
 * mərhələsini keçmiş tərəf 6 rəqəmli kodu limitsiz sınaya bilirdi — `WINDOW = 1`
 * hər anda üç kodu etibarlı saxladığı üçün bu, real bir hücum yolu idi.
 */
export function twoFactorGateOutcome(input: {
  withinRateLimit: boolean;
  lockedUntil: Date | null;
  now: Date;
}): TwoFactorGate {
  if (!input.withinRateLimit) return "RATE_LIMITED";
  if (isLockActive(input.lockedUntil, input.now)) return "LOCKED";
  return "PROCEED";
}
