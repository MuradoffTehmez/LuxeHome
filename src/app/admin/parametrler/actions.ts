"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PERMISSIONS } from "@/lib/constants";
import { SETTING_KEYS, setSettings } from "@/lib/settings";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import * as form from "@/lib/admin/form";

const settingsSchema = z.object({
  notificationEmail: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("E-poçt ünvanı düzgün deyil"))
    .or(z.literal("")),
  notifyEnabled: z.boolean(),
  announcement: z.string().trim().max(500, "Qeyd 500 simvoldan uzun ola bilməz"),
});

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.SETTINGS_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = settingsSchema.safeParse({
    notificationEmail: form.text(formData, "notificationEmail"),
    notifyEnabled: form.boolean(formData, "notifyEnabled"),
    announcement: form.text(formData, "announcement"),
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    await setSettings({
      [SETTING_KEYS.LEAD_NOTIFICATION_EMAIL]: parsed.data.notificationEmail,
      [SETTING_KEYS.LEAD_NOTIFY_ENABLED]: parsed.data.notifyEnabled ? "1" : "0",
      [SETTING_KEYS.ADMIN_ANNOUNCEMENT]: parsed.data.announcement,
    });

    await recordAudit(user, "UPDATE", "Setting", null, "Panel parametrləri");
    revalidatePath("/admin/parametrler");
    revalidatePath("/admin");
    return success("Parametrlər yadda saxlanıldı.");
  } catch (error) {
    return unexpected("parametrlər saxlanılmadı", error);
  }
}
