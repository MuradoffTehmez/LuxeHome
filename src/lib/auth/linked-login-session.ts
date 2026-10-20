import { getOptionalUser } from "./guard";
import { canUsePublicSignIn } from "./public-account-policy";

/**
 * «Bağlı giriş üsulları»nın sessiya köməkçiləri — `guard.ts`-dən (Next naviqasiyası) asılı olduğu üçün `linked-logins.ts`
 * D1 qatından ayrıdır.
 */

/**
 * Callback-də: bağlama yalnız flow-dakı hesab hələ də cari sessiyanın sahibidirsə davam edir — sessiya bu arada
 * dəyişibsə (başqa hesaba girilib, çıxılıb) heç nə yazılmır.
 */
export async function currentLinkingUser(linkUserId: string): Promise<{ id: string } | null> {
  const user = await getOptionalUser();
  if (!user || user.id !== linkUserId || !canUsePublicSignIn(user.accountType)) return null;
  return { id: user.id };
}

/**
 * Start marşrutunda `?bagla=1`: bağlama yalnız giriş etmiş ictimai hesab üçündür. Sessiya yoxdursa `null` — marşrut
 * giriş səhifəsinə yönləndirir; hədəf hesab imzalı flow cookie-sinə yazılır, sorğudan gələn heç bir id-yə etibar edilmir.
 */
export async function linkingUserForStart(url: URL): Promise<{ linking: false } | { linking: true; userId: string | null }> {
  if (url.searchParams.get("bagla") !== "1") return { linking: false };
  const user = await getOptionalUser();
  return { linking: true, userId: user && canUsePublicSignIn(user.accountType) ? user.id : null };
}
