"use server";

import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import type { Locale } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/**
 * `ConfirmAction` `(id: string) => Promise<ActionState>` gözləyir, lakin bu seçim
 * cari istifadəçiyə aiddir — kənardan gələn ID-yə ehtiyac yoxdur. Parametrsiz
 * funksiya həmin tipə uyğun gəlir, ona görə istifadə edilməyən arqument saxlanmır.
 */
export async function toggleRecommendations(): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  let user;
  try {
    user = await requirePublicAction("preferences", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  try {
    const current = await prisma.notificationPreference.findUnique({ where: { userId: user.id }, select: { recommendationEnabled: true } });
    const enabled = !(current?.recommendationEnabled ?? true);
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, recommendationEnabled: enabled },
      update: { recommendationEnabled: enabled },
    });
    revalidatePath("/kabinet/tovsiyeler");
    return success(enabled ? "Fərdi tövsiyələr aktiv edildi." : "Fərdi tövsiyələr söndürüldü.");
  } catch (error) {
    return unexpected("tövsiyə seçimi dəyişmədi", error);
  }
}
