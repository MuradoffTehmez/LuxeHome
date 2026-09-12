"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth/guard";
import { ROLES } from "@/lib/constants";
import { isSystemWriteBlocked } from "@/lib/system-mode";

const VALID_THEMES = new Set(["light", "dark"]);

/**
 * Mövzu seçimini profil üzrə saxlayır ki, başqa cihazda ilk girişdə eyni görünüş
 * gəlsin. Ziyarətçi girişsizdirsə səssizcə heç nə etmir — toggle hər kəs üçündür.
 */
export async function saveThemePreference(theme: string): Promise<void> {
  if (!VALID_THEMES.has(theme)) return;

  const user = await getOptionalUser();
  if (!user) return;

  // Rejim bağlıdırsa tərcih yazılmır — `saveLocalePreference` ilə eyni səbəb:
  // toggle `void` qaytarır, istisna isə istifadəçiyə xəta ekranı göstərərdi.
  // Görünüş cari sessiyada yenə dəyişir, sadəcə profildə saxlanmır.
  if (await isSystemWriteBlocked({ isSuperAdmin: user.role === ROLES.SUPER_ADMIN })) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { themePreference: theme },
  });
}
