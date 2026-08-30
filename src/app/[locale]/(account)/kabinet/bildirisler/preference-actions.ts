"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import * as form from "@/lib/admin/form";
import type { Locale } from "@/lib/constants";
import {
  NOTIFICATION_CHANNEL_KEYS,
  normalizeQuietHour,
  type NotificationChannelKey,
} from "@/lib/notification-preferences";
import { localizePath } from "@/i18n/path-locale";
import { prisma } from "@/lib/prisma";

const LIST_PATH = "/kabinet/bildirisler";

/**
 * PRD bölmə 57 matrisini (Saved Search / Price Drop / Rezervasiya × Email / Web / Push)
 * və bölmə 168 sakit saatlarını saxlayır.
 *
 * Checkbox işarələnməyəndə brauzer sahəni **ümumiyyətlə göndərmir**, ona görə hər açar
 * `form.boolean()` ilə açıq şəkildə oxunur — yoxluq «söndürülüb» deməkdir. Push açarları
 * abunəlikdən asılıdır: abunəlik yoxdursa, işarələnmiş push seçimi saxlanılsa da heç
 * nə göndərilməyəcək, ona görə burada əlavə məhdudiyyət qoyulmur.
 */
export async function saveNotificationPreferences(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "account.notifications" });
  let user;
  try {
    user = await requirePublicAction("preferences", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const channels = Object.fromEntries(
    NOTIFICATION_CHANNEL_KEYS.map((key) => [key, form.boolean(formData, key)]),
  ) as Record<NotificationChannelKey, boolean>;

  const quietHoursStart = normalizeQuietHour(form.text(formData, "quietHoursStart"));
  const quietHoursEnd = normalizeQuietHour(form.text(formData, "quietHoursEnd"));
  // Yarımçıq aralıq qəbul edilmir: bir ucu boş qalarsa sakit saat rejimi söndürülür,
  // əks halda `isWithinQuietHours` səssizcə heç nə etməzdi və istifadəçi seçimin
  // işlədiyini düşünərdi.
  const quietHours =
    quietHoursStart && quietHoursEnd && quietHoursStart !== quietHoursEnd
      ? { quietHoursStart, quietHoursEnd }
      : { quietHoursStart: null, quietHoursEnd: null };

  try {
    const data = { ...channels, ...quietHours };
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });
    revalidatePath(localizePath(LIST_PATH, locale));
    return success(t("preferences.saved"));
  } catch (error) {
    return unexpected("bildiriş seçimləri saxlanılmadı", error, t("preferences.failed"));
  }
}
