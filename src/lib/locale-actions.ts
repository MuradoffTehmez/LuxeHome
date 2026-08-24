"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth/guard";
import { LOCALES } from "@/lib/constants";
import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/i18n/config";

const VALID_LOCALES = new Set<string>(Object.values(LOCALES));

/**
 * Dil seçimini profil üzrə saxlayır — `saveThemePreference`-in eyni naxışı.
 * URL prefiksi (`/en/...`) səhifə keçidini özü idarə edir; bu yalnız hesabı
 * olan istifadəçi üçün *sonrakı* girişlərdə üstünlüyü yadda saxlayır.
 */
export async function saveLocalePreference(locale: string): Promise<void> {
  if (!VALID_LOCALES.has(locale)) return;

  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const user = await getOptionalUser();
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { locale },
  });
}
