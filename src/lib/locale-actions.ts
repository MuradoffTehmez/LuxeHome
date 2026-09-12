"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth/guard";
import { LOCALES, ROLES } from "@/lib/constants";
import { isSystemWriteBlocked } from "@/lib/system-mode";

const VALID_LOCALES = new Set<string>(Object.values(LOCALES));

/**
 * Dil seçimini profil üzrə saxlayır — `saveThemePreference`-in eyni naxışı.
 *
 * Cookie yazılmır: dil URL prefiksindədir və `Set-Cookie` ictimai cavabların
 * keşlənməsinə mane olurdu. Bu funksiya yalnız hesabı olan istifadəçinin
 * `User.locale` sahəsini yeniləyir — panel dili və e-poçt dili oradan oxunur.
 */
export async function saveLocalePreference(locale: string): Promise<void> {
  if (!VALID_LOCALES.has(locale)) return;

  const user = await getOptionalUser();
  if (!user) return;

  // `READ_ONLY`/`MAINTENANCE` rejimində profil sahəsi yenilənmir.
  //
  // Burada istisna **atılmır**: bu action dil seçicisindən çağırılır və
  // qaytardığı dəyər `void`-dur — xəta interfeysdə «gözlənilməz xəta» kimi
  // görünərdi. Seçim onsuz da URL prefiksi ilə işləməyə davam edir, yalnız
  // profildə yadda saxlanmır.
  if (await isSystemWriteBlocked({ isSuperAdmin: user.role === ROLES.SUPER_ADMIN })) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { locale },
  });
}
