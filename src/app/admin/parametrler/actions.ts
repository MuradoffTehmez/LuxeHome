"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LOCALES, PERMISSIONS } from "@/lib/constants";
import { getAdminT } from "@/lib/admin-i18n";
import { PROJECTS_SECTION_ENABLED_VALUE } from "@/lib/site-sections";
import { SETTING_KEYS, setSettings } from "@/lib/settings";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import * as form from "@/lib/admin/form";

/** Boş sətri saxlayan, dolu dəyəri isə diapazona görə yoxlayan koordinat sahəsi. */
function coordinate(min: number, max: number, message: string) {
  return z
    .string()
    .trim()
    .refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max), message);
}

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
  // Boş sətir icazəlidir: koordinat təyin edilməyibsə xəritə sadəcə göstərilmir.
  contactLatitude: coordinate(-90, 90, "Enlik -90 ilə 90 arasında olmalıdır"),
  contactLongitude: coordinate(-180, 180, "Uzunluq -180 ilə 180 arasında olmalıdır"),
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
    contactLatitude: form.text(formData, "contactLatitude"),
    contactLongitude: form.text(formData, "contactLongitude"),
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
      [SETTING_KEYS.CONTACT_LATITUDE]: parsed.data.contactLatitude,
      [SETTING_KEYS.CONTACT_LONGITUDE]: parsed.data.contactLongitude,
    });

    await recordAudit(user, "UPDATE", "Setting", null, "Panel parametrləri");
    revalidatePath("/admin/parametrler");
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    for (const locale of ["az", "en", "ru"]) revalidatePath(`/${locale}/elaqe`);
    return success("Parametrlər yadda saxlanıldı.");
  } catch (error) {
    return unexpected("parametrlər saxlanılmadı", error);
  }
}

/**
 * «Yaşayış kompleksləri» bölməsini ictimai saytda açıb-bağlayır (#83).
 *
 * Yalnız `site.projects_enabled` parametri yazılır — layihə qeydləri toxunulmur və
 * paneldə idarə davam edir. Görünürlük render vaxtı `isProjectsSectionEnabled()`
 * ilə həll olunur, ona görə keşlənmiş data deyil, layout-lar yenilənir.
 */
export async function toggleProjectsSection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.SETTINGS_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const t = await getAdminT();
  const enabled = form.boolean(formData, "enabled");

  try {
    await setSettings({
      [SETTING_KEYS.PROJECTS_SECTION_ENABLED]: enabled ? PROJECTS_SECTION_ENABLED_VALUE : "0",
    });
    await recordAudit(
      user,
      "UPDATE",
      "Setting",
      SETTING_KEYS.PROJECTS_SECTION_ENABLED,
      enabled ? "Yaşayış kompleksləri bölməsi açıldı" : "Yaşayış kompleksləri bölməsi gizlədildi",
    );

    // Menyu, footer, ana səhifə, detal blokları və sitemap — hamısı layout ağacındadır.
    revalidatePath("/admin/parametrler");
    revalidatePath("/", "layout");
    for (const locale of Object.values(LOCALES)) {
      revalidatePath(`/${locale}`, "layout");
    }

    return success(enabled ? t("pages.settings.sections.projectsShown") : t("pages.settings.sections.projectsHidden"));
  } catch (error) {
    return unexpected("bölmə görünürlüyü dəyişdirilmədi", error);
  }
}
