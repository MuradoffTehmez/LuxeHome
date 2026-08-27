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
  contactPhone: z.string().trim().max(30),
  contactEmail: z.string().trim().toLowerCase().pipe(z.email("Korporativ e-poçt düzgün deyil")).or(z.literal("")),
  contactAddress: z.string().trim().max(300),
  contactInstagram: z.string().trim().max(100),
  contactWhatsapp: z.string().trim().max(30),
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
    contactPhone: form.text(formData, "contactPhone"),
    contactEmail: form.text(formData, "contactEmail"),
    contactAddress: form.text(formData, "contactAddress"),
    contactInstagram: form.text(formData, "contactInstagram"),
    contactWhatsapp: form.text(formData, "contactWhatsapp"),
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    await setSettings({
      [SETTING_KEYS.LEAD_NOTIFICATION_EMAIL]: parsed.data.notificationEmail,
      [SETTING_KEYS.LEAD_NOTIFY_ENABLED]: parsed.data.notifyEnabled ? "1" : "0",
      [SETTING_KEYS.ADMIN_ANNOUNCEMENT]: parsed.data.announcement,
      [SETTING_KEYS.CONTACT_PHONE]: parsed.data.contactPhone,
      [SETTING_KEYS.CONTACT_EMAIL]: parsed.data.contactEmail,
      [SETTING_KEYS.CONTACT_ADDRESS]: parsed.data.contactAddress,
      [SETTING_KEYS.CONTACT_INSTAGRAM]: parsed.data.contactInstagram.replace(/^@/, ""),
      [SETTING_KEYS.CONTACT_WHATSAPP]: parsed.data.contactWhatsapp,
    });

    await recordAudit(user, "UPDATE", "Setting", null, "Panel parametrləri");
    revalidatePath("/admin/parametrler");
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    revalidatePath("/elaqe");
    return success("Parametrlər yadda saxlanıldı.");
  } catch (error) {
    return unexpected("parametrlər saxlanılmadı", error);
  }
}
