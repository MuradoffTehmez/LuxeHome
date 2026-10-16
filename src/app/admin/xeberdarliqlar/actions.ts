"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { LOCALES, PERMISSIONS, type Locale } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { SETTING_KEYS, getSetting, setSettings } from "@/lib/settings";
import {
  SAFETY_WARNING_MAX,
  SAFETY_WARNING_MIN,
  normalizeSafetyWarning,
  parseSafetyWarnings,
  serializeSafetyWarnings,
  type SafetyWarningOverrides,
} from "@/lib/safety-warning";

/**
 * Əlaqə panelinin beh xəbərdarlığı (#199). PRD-yə görə təhlükəsizlik məlumatlarını Redaktor
 * idarə edir — icazə `knowledge:manage`-dir (Redaktor, Admin, Super Admin). Boş sahə həmin dili
 * defolt mətnə qaytarır; doldurulmuş, amma hədlərdən kənar mətn rədd olunur.
 */
export async function saveSafetyWarnings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.KNOWLEDGE_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const overrides: SafetyWarningOverrides = {};
  const fieldErrors: Record<string, string> = {};
  for (const locale of Object.values(LOCALES) as Locale[]) {
    const raw = String(formData.get(`warning_${locale}`) ?? "").trim();
    if (!raw) continue;
    const text = normalizeSafetyWarning(raw);
    if (text) overrides[locale] = text;
    else fieldErrors[`warning_${locale}`] = msg("server.safety.uzunluq", { min: SAFETY_WARNING_MIN, max: SAFETY_WARNING_MAX });
  }
  if (Object.keys(fieldErrors).length > 0) return failure(msg("server.common.formInvalid"), fieldErrors);

  try {
    const before = parseSafetyWarnings(await getSetting(SETTING_KEYS.SAFETY_CONTACT_WARNING));
    await setSettings({ [SETTING_KEYS.SAFETY_CONTACT_WARNING]: serializeSafetyWarnings(overrides) });
    await recordAudit(user, "UPDATE", "Setting", SETTING_KEYS.SAFETY_CONTACT_WARNING, "Əlaqə panelinin beh xəbərdarlığı yeniləndi", {
      oldValue: before,
      newValue: overrides,
    });
    // Elan detalı və agentlik profili keşli mətni oxuyur — teq dərhal bitir.
    revalidateTag(PUBLIC_CACHE_TAGS.safety, { expire: 0 });
    revalidatePath("/admin/xeberdarliqlar");
    return success(msg("server.safety.saxlanildi"));
  } catch (error) {
    return unexpected("xəbərdarlıq mətni saxlanmadı", error, msg("server.common.unexpected"));
  }
}
