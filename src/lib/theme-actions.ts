"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth/guard";

const VALID_THEMES = new Set(["light", "dark"]);

/**
 * Mövzu seçimini profil üzrə saxlayır ki, başqa cihazda ilk girişdə eyni görünüş
 * gəlsin. Ziyarətçi girişsizdirsə səssizcə heç nə etmir — toggle hər kəs üçündür.
 */
export async function saveThemePreference(theme: string): Promise<void> {
  if (!VALID_THEMES.has(theme)) return;

  const user = await getOptionalUser();
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { themePreference: theme },
  });
}
