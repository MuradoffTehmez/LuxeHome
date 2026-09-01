"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LOCALES, PERMISSIONS } from "@/lib/constants";
import { DEMO_CONTENT_ENABLED_VALUE } from "@/lib/demo-content";
import { SETTING_KEYS, setSettings } from "@/lib/settings";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import * as form from "@/lib/admin/form";

const demoSchema = z.object({ enabled: z.boolean() });

/**
 * Nümunə məzmunun ictimai görünürlüyünü açıb-bağlayır.
 *
 * Qeydlərin özü toxunulmur — yalnız `demo.content_enabled` parametri yazılır.
 * Sorğu şərtinin necə qurulduğu `src/lib/demo-content.ts`-dədir.
 */
export async function toggleDemoContent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    // Rejim bütün ictimai sayta təsir edir, ona görə parametr səlahiyyəti tələb olunur.
    user = await requireAdminAction(PERMISSIONS.SETTINGS_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = demoSchema.safeParse({ enabled: form.boolean(formData, "enabled") });
  if (!parsed.success) return invalid(parsed.error);

  try {
    await setSettings({
      [SETTING_KEYS.DEMO_CONTENT_ENABLED]: parsed.data.enabled ? DEMO_CONTENT_ENABLED_VALUE : "0",
    });

    await recordAudit(
      user,
      "UPDATE",
      "Setting",
      SETTING_KEYS.DEMO_CONTENT_ENABLED,
      parsed.data.enabled ? "Nümunə məzmun aktivləşdirildi" : "Nümunə məzmun söndürüldü",
    );

    // Rejim bütün ictimai səthləri dəyişir: kataloq, ana səhifə, bloq, tərəfdaşlar.
    revalidatePath("/admin/demo-mezmun");
    revalidatePath("/", "layout");
    for (const locale of Object.values(LOCALES)) {
      revalidatePath(`/${locale}`, "layout");
    }

    return success(
      parsed.data.enabled
        ? "Nümunə məzmun aktivləşdirildi — saytda görünür."
        : "Nümunə məzmun söndürüldü — saytda yalnız real qeydlər qalır.",
    );
  } catch (error) {
    return unexpected("nümunə məzmun rejimi dəyişdirilmədi", error);
  }
}
