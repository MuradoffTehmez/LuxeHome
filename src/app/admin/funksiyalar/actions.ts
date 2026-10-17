"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";
import { SETTING_KEYS, getSetting, setSettings } from "@/lib/settings";
import { CRITICAL_FLAGS, FEATURE_FLAGS, diffFeatureFlags, parseFeatureFlags, type FeatureFlag } from "@/lib/feature-flags-policy";

/**
 * Funksiya bayraqlarının saxlanması (#242, PRD 23). Bütün açarlar tək JSON-da atomik yazılır;
 * dəyişiklik audit jurnalına əvvəl/sonra dəyərləri ilə düşür, kritik açarlar xülasədə ayrıca qeyd olunur.
 * Forma yalnız göndərilən (işarələnmiş) açarları «açıq» sayır — bütün açarlar formadadır.
 */
export async function saveFeatureFlags(_state: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.SETTINGS_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  try {
    const before = parseFeatureFlags(await getSetting(SETTING_KEYS.FEATURE_FLAGS));
    const after = { ...before };
    for (const flag of Object.keys(FEATURE_FLAGS) as FeatureFlag[]) after[flag] = formData.get(flag) === "on";
    const changes = diffFeatureFlags(before, after);
    if (changes.length === 0) return success(msg("server.featureFlags.unchanged"));
    // Kritik açar dəyişirsə forma təsdiq sahəsini göndərməlidir.
    const critical = changes.filter((change) => CRITICAL_FLAGS.includes(change.flag));
    if (critical.length > 0 && formData.get("confirmCritical") !== "on") return failure(msg("server.featureFlags.confirmRequired"));

    await setSettings({ [SETTING_KEYS.FEATURE_FLAGS]: JSON.stringify(after) });
    await recordAudit(
      user,
      "UPDATE",
      "Setting",
      SETTING_KEYS.FEATURE_FLAGS,
      `${critical.length ? "KRİTİK · " : ""}${changes.map((change) => `${change.flag}: ${change.from ? "on" : "off"} → ${change.to ? "on" : "off"}`).join(", ")}`,
      { oldValue: before, newValue: after },
    );
    revalidatePath("/admin/funksiyalar");
    revalidatePath("/", "layout");
    return success(msg("server.featureFlags.saved"));
  } catch (error) {
    return unexpected("funksiya bayraqları saxlanmadı", error, msg("server.common.unexpected"));
  }
}
